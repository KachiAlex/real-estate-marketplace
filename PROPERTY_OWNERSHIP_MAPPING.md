# Property Ownership Mapping

This document provides a comprehensive mapping of all mock properties to their respective owners, showing property traceability across accounts.

## 📋 Quick Reference: Vendor Accounts

### 🏢 Active Vendor Accounts (Login to /vendor/dashboard)

| Email | Password | Role | Name | Properties |
|-------|----------|------|------|------------|
| `emeka.okafor@lagosagents.com` | `agent123` | Agent | Emeka Okafor | None yet |
| `fatima.ibrahim@abujaagents.com` | `agent123` | Agent | Fatima Ibrahim | None yet |
| `chidi.nwankwo@riversagents.com` | `agent123` | Agent | Chidi Nwankwo | None yet |
| `aisha.mohammed@propertyowner.com` | `owner123` | Developer | Aisha Mohammed | 2 properties |

---

## 🏠 Complete Property to Owner Mapping

### User 001: Adebayo Oluwaseun
- **Email**: `adebayo.oluwaseun@gmail.com`
- **Password**: `password123`
- **Properties Owned**: 2

| Property ID | Title | Price | Type | Status |
|-------------|-------|-------|------|--------|
| prop_001 | Beautiful Family Home in Lekki Phase 1 | ₦185,000,000 | House | For Sale |
| prop_002 | Modern Downtown Apartment in Victoria Island | ₦1,200,000/mo | Apartment | For Rent |

### User 002: Chioma Nwosu
- **Email**: `chioma.nwosu@yahoo.com`
- **Password**: `password123`
- **Properties Owned**: 2

| Property ID | Title | Price | Type | Status |
|-------------|-------|-------|------|--------|
| prop_003 | Luxury Penthouse Suite with Ocean Views | ₦520,000,000 | Apartment | For Sale |
| prop_004 | Cozy Studio Apartment in Surulere | ₦800,000/mo | Apartment | For Rent |

### User 003: Emmanuel Adeyemi
- **Email**: `emmanuel.adeyemi@hotmail.com`
- **Password**: `password123`
- **Properties Owned**: 2

| Property ID | Title | Price | Type | Status |
|-------------|-------|-------|------|--------|
| prop_005 | Suburban Villa with Private Pool | ₦310,000,000 | House | For Sale |
| prop_006 | Commercial Office Space in Ikeja GRA | ₦3,500,000/mo | Commercial | For Lease |

### User 004: Fatima Ibrahim
- **Email**: `fatima.ibrahim@gmail.com`
- **Password**: `password123`
- **Properties Owned**: 2

| Property ID | Title | Price | Type | Status |
|-------------|-------|-------|------|--------|
| prop_007 | Luxury Townhouse in Ikoyi | ₦450,000,000 | House | For Sale |
| prop_008 | Modern Apartment in Yaba | ₦950,000/mo | Apartment | For Rent |

### User 005: Oluwaseun Akoma (Property Developer)
- **Email**: `oluwaseun.akoma@gmail.com`
- **Password**: `password123`
- **Properties Owned**: 3

| Property ID | Title | Price | Type | Status |
|-------------|-------|-------|------|--------|
| prop_009 | Executive Duplex in Magodo | ₦280,000,000 | House | For Sale |
| prop_010 | Luxury Apartment in Banana Island | ₦380,000,000 | Apartment | For Sale |
| prop_011 | Commercial Retail Space in Victoria Island | ₦2,800,000/mo | Commercial | For Lease |

### User 006: Blessing Okafor
- **Email**: `blessing.okafor@outlook.com`
- **Password**: `password123`
- **Properties Owned**: 1

| Property ID | Title | Price | Type | Status |
|-------------|-------|-------|------|--------|
| prop_012 | Family Home in Gbagada | ₦150,000,000 | House | For Sale |

### User 007: Ibrahim Musa
- **Email**: `ibrahim.musa@gmail.com`
- **Password**: `password123`
- **Properties Owned**: 1

| Property ID | Title | Price | Type | Status |
|-------------|-------|-------|------|--------|
| prop_014 | Executive Villa in Port Harcourt | ₦220,000,000 | House | For Sale |

**Note**: Property prop_013 (Modern Studio in Port Harcourt) is assigned to user_007 in mock data.

### User 008: Grace Eze
- **Email**: `grace.eze@yahoo.com`
- **Password**: `password123`
- **Properties Owned**: 1

| Property ID | Title | Price | Type | Status |
|-------------|-------|-------|------|--------|
| prop_015 | Medical Professional Apartment | ₦750,000/mo | Apartment | For Rent |

### User 009: Kemi Adebayo
- **Email**: `kemi.adebayo@gmail.com`
- **Password**: `password123`
- **Properties Owned**: 2

| Property ID | Title | Price | Type | Status |
|-------------|-------|-------|------|--------|
| prop_016 | Luxury Apartment in Ikoyi | ₦420,000,000 | Apartment | For Sale |
| prop_017 | Modern Townhouse in Lekki | ₦180,000,000 | House | For Sale |

### User 010: Tunde Ogunlana
- **Email**: `tunde.ogunlana@hotmail.com`
- **Password**: `password123`
- **Properties Owned**: 2

| Property ID | Title | Price | Type | Status |
|-------------|-------|-------|------|--------|
| prop_018 | Architectural Masterpiece in Gbagada | ₦195,000,000 | House | For Sale |
| prop_019 | Luxury Penthouse in Victoria Island | ₦650,000,000 | Apartment | For Sale |
| prop_020 | Cozy Studio in Surulere | ₦550,000/mo | Apartment | For Rent |

---

## 🎯 Convert Regular Users to Vendor Accounts

To enable property management features for these users, convert their accounts to vendor accounts:

### Candidates for Vendor Conversion:

1. **Oluwaseun Akoma (user_005)** - Property Developer with 3 properties
   - Already has occupation: "Property Developer at Prime Properties Ltd"
   - Perfect candidate for vendor access

2. **Fatima Ibrahim (user_004)** - Business Owner with 2 properties
   - Business owner with luxury properties
   - Good candidate for vendor access

3. **Chioma Nwosu (user_002)** - Real Estate Agent with 2 properties
   - Already working as "Real Estate Agent at Knight Frank Nigeria"
   - Ideal candidate for vendor access

### How to Convert:

Update their user data in `backend/data/mockUsers.js`:

```javascript
{
  id: 'user_005',
  // ... existing fields ...
  role: 'vendor', // Change from 'user' to 'vendor'
  vendorData: {
    businessName: 'Prime Properties Ltd',
    businessType: 'Property Developer',
    vendorCategory: 'property_owner',
    phone: '+234-805-678-9012',
    experience: '10+ years',
    registeredAt: new Date('2024-01-05').toISOString(),
    status: 'active'
  }
}
```

---

## 📊 Quick Summary

### Total Properties: 20
- **Houses**: 8 properties
- **Apartments**: 11 properties  
- **Commercial**: 1 property

### By Status:
- **For Sale**: 12 properties
- **For Rent**: 7 properties
- **For Lease**: 1 property

### By Location:
- **Lagos**: 17 properties
- **Port Harcourt**: 2 properties
- **Abuja**: 1 property (not in the current dataset)

---

## 🔍 Account Access Summary

### Regular Users (user_001 to user_011):
- **Login**: Use email with password `password123`
- **Access**: User dashboard, property browsing, investment features
- **11 users** total

### Vendor Accounts (agent_001 to agent_003, owner_001):
- **Login**: Use vendor email with password `agent123` or `owner123`
- **Access**: Vendor dashboard, property management, earning tracking
- **4 vendors** total

### Admin Account (admin_001):
- **Login**: `admin@kikiestate.com` with password `admin123`
- **Access**: Admin dashboard, user management, property verification
- **1 admin** total

---

**For development and testing purposes only.**
