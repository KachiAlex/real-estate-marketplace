const axios = require('axios');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5001/api';
let adminToken = null;
let vendorToken = null;
let testVendorId = null;
let testSubscriptionId = null;
let testPlanId = null;

// Test data
const testVendor = {
  firstName: 'Test',
  lastName: 'Vendor',
  email: 'testvendor@example.com',
  password: 'password123',
  role: 'vendor'
};

const adminCredentials = {
  email: 'admin@propertyark.com',
  password: 'admin123'
};

// Helper functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const makeRequest = async (method, endpoint, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      }
    };
    
    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
};

// Test functions
const testAdminLogin = async () => {
  console.log('\n🔐 Testing Admin Login...');
  const result = await makeRequest('POST', '/auth/jwt/login', adminCredentials);
  
  if (result.success && result.data.success) {
    adminToken = result.data.token;
    console.log('✅ Admin login successful');
    return true;
  } else {
    console.log('❌ Admin login failed:', result.error);
    return false;
  }
};

const testVendorRegistration = async () => {
  console.log('\n👤 Testing Vendor Registration...');
  const result = await makeRequest('POST', '/auth/jwt/register', testVendor);
  
  if (result.success && result.data.success) {
    vendorToken = result.data.token;
    testVendorId = result.data.user.id;
    console.log('✅ Vendor registration successful');
    return true;
  } else {
    console.log('❌ Vendor registration failed:', result.error);
    return false;
  }
};

const testCreateSubscriptionPlan = async () => {
  console.log('\n📋 Testing Create Subscription Plan...');
  const planData = {
    name: 'Test Vendor Plan',
    description: 'Test plan for subscription flow',
    amount: 50000,
    currency: 'NGN',
    billingCycle: 'monthly',
    trialDays: 90,
    features: {
      unlimited_listings: true,
      featured_properties: 10,
      priority_support: true,
      verification_badge: true,
      analytics_dashboard: true
    },
    isActive: true,
    sortOrder: 1
  };

  const result = await makeRequest('POST', '/admin/subscription/plans', planData, adminToken);
  
  if (result.success && result.data.success) {
    testPlanId = result.data.data.id;
    console.log('✅ Subscription plan created successfully');
    return true;
  } else {
    console.log('❌ Failed to create subscription plan:', result.error);
    return false;
  }
};

const testGetSubscriptionPlans = async () => {
  console.log('\n📊 Testing Get Subscription Plans...');
  const result = await makeRequest('GET', '/subscription/plans');
  
  if (result.success && result.data.success) {
    console.log(`✅ Found ${result.data.data.length} subscription plans`);
    
    // Use first plan if test plan wasn't created
    if (!testPlanId && result.data.data.length > 0) {
      testPlanId = result.data.data[0].id;
      console.log('📌 Using existing plan for tests');
    }
    return true;
  } else {
    console.log('❌ Failed to get subscription plans:', result.error);
    return false;
  }
};

const testGetSubscriptionStatus = async () => {
  console.log('\n📈 Testing Get Subscription Status...');
  const result = await makeRequest('GET', '/subscription/status', null, vendorToken);
  
  if (result.success && result.data.success) {
    const status = result.data.data;
    console.log('✅ Subscription status retrieved:');
    console.log(`   Status: ${status.status}`);
    console.log(`   Message: ${status.message}`);
    console.log(`   Trial Days: ${status.trialDaysRemaining}`);
    console.log(`   Can Access: ${status.canAccess}`);
    return true;
  } else {
    console.log('❌ Failed to get subscription status:', result.error);
    return false;
  }
};

const testGetCurrentSubscription = async () => {
  console.log('\n📄 Testing Get Current Subscription...');
  const result = await makeRequest('GET', '/subscription/current', null, vendorToken);
  
  if (result.success && result.data.success) {
    const subscription = result.data.data;
    testSubscriptionId = subscription.id;
    console.log('✅ Current subscription retrieved:');
    console.log(`   Plan: ${subscription.plan}`);
    console.log(`   Status: ${subscription.status}`);
    console.log(`   Amount: ${subscription.amount}`);
    console.log(`   Trial End: ${subscription.trialEndDate}`);
    return true;
  } else {
    console.log('❌ Failed to get current subscription:', result.error);
    return false;
  }
};

const testInitializePayment = async () => {
  console.log('\n💳 Testing Initialize Payment...');
  
  if (!testPlanId) {
    console.log('❌ No plan available for payment test');
    return false;
  }

  const paymentData = {
    planId: testPlanId,
    paymentMethod: 'paystack'
  };

  const result = await makeRequest('POST', '/subscription/pay', paymentData, vendorToken);
  
  if (result.success && result.data.success) {
    console.log('✅ Payment initialized successfully');
    console.log(`   Payment URL: ${result.data.data.paymentUrl}`);
    console.log(`   Reference: ${result.data.data.reference}`);
    console.log(`   Amount: ${result.data.data.amount}`);
    return true;
  } else {
    console.log('❌ Failed to initialize payment:', result.error);
    return false;
  }
};

const testGetPaymentHistory = async () => {
  console.log('\n💰 Testing Get Payment History...');
  const result = await makeRequest('GET', '/subscription/payments', null, vendorToken);
  
  if (result.success && result.data.success) {
    console.log(`✅ Payment history retrieved: ${result.data.data.length} payments`);
    result.data.data.forEach((payment, index) => {
      console.log(`   Payment ${index + 1}: ${payment.amount} - ${payment.status}`);
    });
    return true;
  } else {
    console.log('❌ Failed to get payment history:', result.error);
    return false;
  }
};

const testAdminGetSubscriptions = async () => {
  console.log('\n👥 Testing Admin Get Subscriptions...');
  const result = await makeRequest('GET', '/admin/subscription/subscriptions', null, adminToken);
  
  if (result.success && result.data.success) {
    console.log(`✅ Admin retrieved ${result.data.data.subscriptions.length} subscriptions`);
    return true;
  } else {
    console.log('❌ Failed to get admin subscriptions:', result.error);
    return false;
  }
};

const testAdminGetStats = async () => {
  console.log('\n📊 Testing Admin Get Stats...');
  const result = await makeRequest('GET', '/admin/subscription/stats', null, adminToken);
  
  if (result.success && result.data.success) {
    const stats = result.data.data;
    console.log('✅ Admin stats retrieved:');
    console.log(`   Total: ${stats.totalSubscriptions}`);
    console.log(`   Active: ${stats.activeSubscriptions}`);
    console.log(`   Trial: ${stats.trialSubscriptions}`);
    console.log(`   Expired: ${stats.expiredSubscriptions}`);
    console.log(`   Revenue: ${stats.totalRevenue}`);
    return true;
  } else {
    console.log('❌ Failed to get admin stats:', result.error);
    return false;
  }
};

const testUpdateSubscriptionSettings = async () => {
  console.log('\n⚙️ Testing Update Subscription Settings...');
  const settingsData = {
    autoRenew: false
  };

  const result = await makeRequest('PUT', '/subscription/settings', settingsData, vendorToken);
  
  if (result.success && result.data.success) {
    console.log('✅ Subscription settings updated successfully');
    return true;
  } else {
    console.log('❌ Failed to update subscription settings:', result.error);
    return false;
  }
};

const testCancelSubscription = async () => {
  console.log('\n❌ Testing Cancel Subscription...');
  const result = await makeRequest('POST', '/subscription/cancel', null, vendorToken);
  
  if (result.success && result.data.success) {
    console.log('✅ Subscription cancelled successfully');
    return true;
  } else {
    console.log('❌ Failed to cancel subscription:', result.error);
    return false;
  }
};

const testWebhookVerification = async () => {
  console.log('\n🔗 Testing Webhook Verification...');
  
  // Mock webhook data
  const webhookData = {
    event: 'charge.success',
    data: {
      reference: 'test_ref_123',
      amount: 5000000, // 50,000 in kobo
      currency: 'NGN',
      status: 'success',
      metadata: {
        subscriptionId: testSubscriptionId,
        vendorId: testVendorId
      }
    }
  };

  const result = await makeRequest('POST', '/subscription/webhook', webhookData);
  
  if (result.success) {
    console.log('✅ Webhook endpoint accessible');
    return true;
  } else {
    console.log('❌ Webhook endpoint error:', result.error);
    return false;
  }
};

// Cleanup function
const cleanup = async () => {
  console.log('\n🧹 Cleaning up test data...');
  
  if (testSubscriptionId && adminToken) {
    await makeRequest('DELETE', `/admin/subscription/${testSubscriptionId}`, null, adminToken);
  }
  
  if (testPlanId && adminToken) {
    await makeRequest('DELETE', `/admin/subscription/plans/${testPlanId}`, null, adminToken);
  }
  
  console.log('✅ Cleanup completed');
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting Subscription System End-to-End Tests');
  console.log('===========================================');

  const tests = [
    { name: 'Admin Login', fn: testAdminLogin },
    { name: 'Vendor Registration', fn: testVendorRegistration },
    { name: 'Create Subscription Plan', fn: testCreateSubscriptionPlan },
    { name: 'Get Subscription Plans', fn: testGetSubscriptionPlans },
    { name: 'Get Subscription Status', fn: testGetSubscriptionStatus },
    { name: 'Get Current Subscription', fn: testGetCurrentSubscription },
    { name: 'Initialize Payment', fn: testInitializePayment },
    { name: 'Get Payment History', fn: testGetPaymentHistory },
    { name: 'Update Subscription Settings', fn: testUpdateSubscriptionSettings },
    { name: 'Admin Get Subscriptions', fn: testAdminGetSubscriptions },
    { name: 'Admin Get Stats', fn: testAdminGetStats },
    { name: 'Webhook Verification', fn: testWebhookVerification },
    { name: 'Cancel Subscription', fn: testCancelSubscription }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
      
      // Small delay between tests
      await delay(500);
    } catch (error) {
      console.log(`❌ ${test.name} failed with exception:`, error.message);
      failed++;
    }
  }

  console.log('\n===========================================');
  console.log('🏁 Test Results Summary');
  console.log('===========================================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Subscription system is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the logs above.');
  }

  // Cleanup
  await cleanup();

  process.exit(failed > 0 ? 1 : 0);
};

// Run tests
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  cleanup
};
