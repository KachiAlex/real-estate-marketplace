# 🌍 Complete Environment Variables Guide for Render

## 📋 **Required Environment Variables - Fill These in Render Dashboard**

### 🔗 **API Configuration**
```
REACT_APP_API_URL=https://real-estate-marketplace-1-k8jp.onrender.com
```
*Your backend URL (already deployed)*

### 🔥 **Firebase Configuration** (From your firebase.js)
```
REACT_APP_FIREBASE_API_KEY=AIzaSyCKPiM3fjQWqxrdN4UoyfLxsJKNk6h8lIU
REACT_APP_FIREBASE_AUTH_DOMAIN=real-estate-marketplace-37544.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=real-estate-marketplace-37544
REACT_APP_FIREBASE_STORAGE_BUCKET=real-estate-marketplace-37544.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=759115682573
REACT_APP_FIREBASE_APP_ID=1:759115682573:web:2dbddf9ba6dac14764d644
REACT_APP_FIREBASE_MEASUREMENT_ID=G-BMDCTD4W5Q
```

### 🏗️ **Build Configuration**
```
NODE_ENV=production
GENERATE_SOURCEMAP=false
```

### 🎯 **Feature Flags** (Optional - Enable Features)
```
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_CHAT=true
REACT_APP_ENABLE_VERIFICATION=true
REACT_APP_ENABLE_NOTIFICATIONS=true
```

### 📧 **Email Configuration** (If using email features)
```
REACT_APP_SUPPORT_EMAIL=support@yourdomain.com
REACT_APP_CONTACT_EMAIL=contact@yourdomain.com
```

### 🌐 **App Configuration** (Optional)
```
REACT_APP_APP_NAME=Real Estate Marketplace
REACT_APP_APP_VERSION=1.0.1
REACT_APP_BASE_URL=https://your-frontend.onrender.com
```

---

## 🔧 **How to Add Environment Variables in Render**

### **Step 1: Go to Your Web Service**
1. Open [Render Dashboard](https://dashboard.render.com)
2. Click on your `real-estate-frontend` service
3. Go to **"Environment"** tab

### **Step 2: Add Environment Variables**
For each variable above:
1. Click **"Add Environment Variable"**
2. **Key**: Copy the variable name (e.g., `REACT_APP_FIREBASE_API_KEY`)
3. **Value**: Copy the corresponding value
4. Click **"Save"**

### **Step 3: Redeploy**
After adding all variables:
1. Click **"Manual Deploy"** → **"Deploy Latest Commit"**
2. Wait for deployment to complete

---

## 🎯 **Quick Copy-Paste Ready Values**

### **Firebase Variables (Copy These):**
```
REACT_APP_FIREBASE_API_KEY=AIzaSyCKPiM3fjQWqxrdN4UoyfLxsJKNk6h8lIU
REACT_APP_FIREBASE_AUTH_DOMAIN=real-estate-marketplace-37544.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=real-estate-marketplace-37544
REACT_APP_FIREBASE_STORAGE_BUCKET=real-estate-marketplace-37544.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=759115682573
REACT_APP_FIREBASE_APP_ID=1:759115682573:web:2dbddf9ba6dac14764d644
REACT_APP_FIREBASE_MEASUREMENT_ID=G-BMDCTD4W5Q
```

### **API Variables (Copy These):**
```
REACT_APP_API_URL=https://real-estate-marketplace-1-k8jp.onrender.com
NODE_ENV=production
```

### **Feature Flags (Copy These):**
```
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_CHAT=true
REACT_APP_ENABLE_VERIFICATION=true
REACT_APP_ENABLE_NOTIFICATIONS=true
```

---

## ⚠️ **Important Notes**

### **🔒 Security:**
- **NEVER** commit actual values to Git
- **ALWAYS** use Render's environment variable management
- **Firebase keys** are public but should still be in env vars

### **🚀 React Prefix Requirement:**
All React environment variables **MUST** start with `REACT_APP_`
- ✅ `REACT_APP_API_URL` 
- ❌ `API_URL` (won't work)

### **🔄 After Deployment:**
Render automatically makes these available in your React code as:
```javascript
process.env.REACT_APP_FIREBASE_API_KEY
process.env.REACT_APP_API_URL
// etc.
```

---

## 🎯 **Service Account Note**

Your `serviceAccount.json` is **NOT needed** for the frontend deployment. It's only used for:
- Backend Firebase Admin SDK
- Firebase Functions
- Server-side operations

**Frontend uses Firebase Client SDK** (which uses the config above).

---

## ✅ **Minimum Required Variables**

If you want to start with just the essentials:

```
REACT_APP_API_URL=https://real-estate-marketplace-1-k8jp.onrender.com
REACT_APP_FIREBASE_API_KEY=AIzaSyCKPiM3fjQWqxrdN4UoyfLxsJKNk6h8lIU
REACT_APP_FIREBASE_AUTH_DOMAIN=real-estate-marketplace-37544.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=real-estate-marketplace-37544
REACT_APP_FIREBASE_STORAGE_BUCKET=real-estate-marketplace-37544.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=759115682573
REACT_APP_FIREBASE_APP_ID=1:759115682573:web:2dbddf9ba6dac14764d644
NODE_ENV=production
```

---

## 🎉 **Ready to Deploy!**

Copy the values above into your Render environment variables and deploy! 🚀

**Your app will be live at:** `https://real-estate-frontend.onrender.com`
