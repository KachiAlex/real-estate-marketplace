# QUICK START GUIDE - PAYMENT SYSTEM FIX

**For:** Engineering Team  
**Urgency:** 🔴 CRITICAL  
**Time to Read:** 5 minutes  

---

## 🚨 THE THREE BLOCKING ISSUES (In Order of Fix)

### 1️⃣ FIX WEBHOOK HANDLER (START HERE - 1 DAY TASK)

**File:** `/backend/services/paymentService.js`

**Problem:** When Paystack sends webhook, payment status never updates in database. Escrows stuck in "pending".

**Quick Fix - Copy This:**

```javascript
// In PaymentService class, REPLACE the processWebhook method entirely with:

async processWebhook({ provider, headers, payload }) {
  try {
    // 1. Verify signature
    let isValid = false;
    if (provider === 'paystack') {
      const hash = require('crypto')
        .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
        .update(JSON.stringify(payload))
        .digest('hex');
      isValid = hash === headers['x-paystack-signature'];
    }
    
    if (!isValid) {
      throw new Error('Invalid webhook signature');
    }
    
    // 2. Get reference from payload
    const reference = payload.data?.reference;
    if (!reference) return { success: true };
    
    // 3. Find payment in database
    const payment = await db.Payment.findOne({ where: { reference } });
    if (!payment) return { success: true };
    
    // 4. Check payment status
    if (payload.data?.status === 'success') {
      // Update payment
      payment.status = 'completed';
      payment.metadata = { ...payment.metadata, webhookReceived: true };
      await payment.save();
      
      // 5. Update related escrow if applicable
      if (payment.paymentType === 'escrow') {
        const escrowId = payment.metadata?.relatedEntity?.id;
        if (escrowId) {
          const escrow = await db.EscrowTransaction.findByPk(escrowId);
          if (escrow) {
            await escrow.update({ status: 'funded', fundedAt: new Date() });
            
            // Notify seller
            await db.Notification.create({
              recipientId: escrow.sellerId,
              type: 'escrow_funded',
              title: 'Payment Received',
              message: 'Buyer has completed payment. Please upload documents.',
              data: { escrowId }
            });
          }
        }
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('[WEBHOOK ERROR]', error);
    return { success: true }; // Still return 200 to prevent Paystack retry
  }
}
```

**Test It:**
```bash
# 1. Go to Paystack Dashboard
# 2. Create test transaction
# 3. Check: Payment.status should = 'completed'
# 4. Check: EscrowTransaction.status should = 'funded'
```

---

### 2️⃣ ADD REFUND METHOD (1 DAY TASK)

**File:** `/backend/services/paystackService.js`

**Problem:** No way to process refunds. Escrow cancellations won't work.

**Quick Fix - Add This Method:**

```javascript
// Add to PaystackService class:

async refundPayment(reference, amount) {
  try {
    const response = await axios.post(
      `${this.baseURL}/refund`,
      {
        transaction: reference,
        amount: amount * 100 // Convert to kobo
      },
      {
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.status) {
      return { success: true, data: response.data.data };
    }
    
    return {
      success: false,
      message: response.data.message || 'Refund failed'
    };
  } catch (error) {
    console.error('Paystack refund error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Refund API failed'
    };
  }
}
```

**Then Update processRefund() in PaymentService:**

```javascript
async processRefund({ paymentId, amount, reason, processedBy }) {
  const payment = await db.Payment.findByPk(paymentId);
  if (!payment) throw new Error('Payment not found');
  
  // Call Paystack refund
  const result = await paystackService.refundPayment(payment.reference, amount);
  if (!result.success) throw new Error('Refund failed: ' + result.message);
  
  // Update payment record
  payment.status = 'refunded';
  payment.metadata = {
    ...payment.metadata,
    refundAmount: amount,
    refundReason: reason,
    refundedAt: new Date()
  };
  await payment.save();
  
  // If escrow, mark as cancelled
  if (payment.paymentType === 'escrow') {
    const escrow = await db.EscrowTransaction.findByPk(
      payment.metadata?.relatedEntity?.id
    );
    if (escrow) {
      await escrow.update({ status: 'cancelled', cancelledAt: new Date() });
    }
  }
  
  return payment;
}
```

---

### 3️⃣ CREATE SOCKET.IO CLIENT (2 DAY TASK)

**File:** `/src/services/socketService.js` (CREATE THIS FILE)

**Problem:** No real-time updates. Users must refresh to see changes.

**Quick Fix - Create File:**

```javascript
import io from 'socket.io-client';
import { getApiUrl } from '../utils/apiConfig';

let socket = null;

export const connectSocket = (token) => {
  if (socket) return socket;
  
  const socketUrl = getApiUrl().replace('/api', '');
  
  socket = io(socketUrl, {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  });
  
  // Listen for payment events
  socket.on('payment:completed', (data) => {
    console.log('Payment completed:', data);
    window.dispatchEvent(new CustomEvent('paymentCompleted', { detail: data }));
  });
  
  // Listen for escrow events
  socket.on('escrow:funded', (data) => {
    console.log('Escrow funded:', data);
    window.dispatchEvent(new CustomEvent('escrowFunded', { detail: data }));
  });
  
  socket.on('escrow:status_changed', (data) => {
    console.log('Escrow status changed:', data);
    window.dispatchEvent(new CustomEvent('escrowStatusChanged', { detail: data }));
  });
  
  socket.on('escrow:disputed', (data) => {
    console.log('Escrow disputed:', data);
    window.dispatchEvent(new CustomEvent('escrowDisputed', { detail: data }));
  });
  
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export const joinEscrowRoom = (escrowId) => {
  if (socket) {
    socket.emit('escrow:join', { escrowId });
  }
};

export const leaveEscrowRoom = (escrowId) => {
  if (socket) {
    socket.emit('escrow:leave', { escrowId });
  }
};
```

**Then Update EscrowPaymentFlow.js:**

```javascript
// At top of component:
import { connectSocket, joinEscrowRoom, disconnectSocket } from '../services/socketService';

// In useEffect on mount:
useEffect(() => {
  if (user?.accessToken) {
    connectSocket(user.accessToken);
  }
  
  if (escrowId) {
    joinEscrowRoom(escrowId);
  }
  
  // Listen for events
  const handleEscrowFunded = (event) => {
    console.log('Escrow funded!', event.detail);
    setEscrowStatus('funded');
    // Update UI...
  };
  
  window.addEventListener('escrowFunded', handleEscrowFunded);
  
  return () => {
    window.removeEventListener('escrowFunded', handleEscrowFunded);
    disconnectSocket();
  };
}, [user, escrowId]);
```

---

## ⚡ QUICK TESTING CHECKLIST

After implementing the three fixes above:

### Test 1: Webhook Processing
```
✓ Create test payment via EscrowPaymentFlow
✓ Check: Payment record created in DB
✓ Simulate Paystack webhook (or use test)
✓ Check: Payment.status = 'completed'
✓ Check: EscrowTransaction.status = 'funded'
```

### Test 2: Refund
```
✓ Admin calls: POST /api/payments/{paymentId}/refund
✓ Check: Paystack API called
✓ Check: Payment.status = 'refunded'
✓ Check: User receives notification
```

### Test 3: Real-Time
```
✓ Open EscrowPaymentFlow component
✓ Console should show "Payment completed" event
✓ Escrow status should update without page refresh
✓ Notification badge should update
```

---

## 📋 DEPLOYMENT CHECKLIST

Before going live:

- [ ] Environment variables set:
  - [ ] `PAYSTACK_PUBLIC_KEY=pk_live_...`
  - [ ] `PAYSTACK_SECRET_KEY=sk_live_...`
  
- [ ] Paystack Dashboard Configuration:
  - [ ] Webhook URL: `https://your-domain.com/api/payments/webhook/paystack`
  - [ ] Test notification received
  
- [ ] Database:
  - [ ] Migrations run (tables created)
  - [ ] Indexes created for performance
  
- [ ] Testing:
  - [ ] End-to-end payment flow tested
  - [ ] Refund scenario tested
  - [ ] Real-time updates verified
  
- [ ] Monitoring:
  - [ ] Payment logs being written
  - [ ] Error alerts configured
  - [ ] Dashboard accessible

---

## 🎯 SUCCESS CRITERIA

✅ When completed, you should have:

1. **Payments persist in database** after Paystack webhook
2. **Escrow status updates automatically** when payment received
3. **Refunds can be processed** via admin dashboard
4. **Users see real-time updates** without page refresh
5. **All notifications sent** at appropriate times
6. **Error cases handled gracefully** with user feedback

---

## 📞 IF YOU GET STUCK

**Webhook not working?**
→ Check: `x-paystack-signature` header matches computed hash  
→ Check: Payment record exists in DB with matching reference  
→ Check: Logs show webhook received  

**Refund failing?**
→ Check: `PAYSTACK_SECRET_KEY` set correctly  
→ Check: Pay sure amount ≤ original payment amount  
→ Check: Payment reference is valid  

**Socket.IO not connecting?**
→ Check: JWT token valid  
→ Check: Browser console for connection errors  
→ Check: Proxy configured correctly  

---

## 📚 REFERENCE DOCUMENTS

For complete details, see:
- `INVESTIGATION_SUMMARY.md` - Overview of findings
- `PAYSTACK_PAYMENT_INVESTIGATION.md` - Complete technical breakdown
- `PAYMENT_CRITICAL_GAPS.md` - Blocking issues with solutions
- `PAYMENT_FLOWS_VISUAL.md` - Visual flow diagrams

---

## ⏱️ TIMELINE

| Task | Days | Start | End |
|------|------|-------|-----|
| Fix Webhook Handler | 1 | Day 1 | Day 1 |
| Add Refund API | 1 | Day 2 | Day 2 |
| Create Socket.IO Client | 2 | Day 3 | Day 4 |
| Testing | 1 | Day 5 | Day 5 |
| **TOTAL** | **5 days** | Day 1 | Day 5 |

**Week 1 Goal:** All three fixes deployed and tested ✓

---

## 🚀 START NOW

1. Read the 3 code fixes above
2. Copy them into your files  
3. Run tests to verify
4. Commit to git
5. Update this checklist as you progress

**You've got this! 💪**

---

**Last Updated:** March 13, 2026  
**Ready to Implement:** YES ✅
