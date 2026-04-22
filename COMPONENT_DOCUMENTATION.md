# Frontend Component Documentation

## Overview
Complete reference for all frontend pages, components, and custom hooks used in the frontend-backend integration system.

---

## Pages

### Authentication Pages

#### SignInModal
**Location:** `src/components/SignInModal.js`

Modal component for user login.

**Props:**
```javascript
{
  isOpen: boolean,
  onClose: () => void,
  onSuccess: () => void
}
```

**Features:**
- Email/password login
- Google OAuth sign-in button
- Link to forgot password page
- Link to registration

**Usage:**
```jsx
<SignInModal 
  isOpen={showLogin} 
  onClose={() => setShowLogin(false)}
  onSuccess={() => navigate('/dashboard')}
/>
```

---

#### ForgotPasswordPage
**Location:** `src/pages/auth/ForgotPasswordPage.js`

Page for requesting password reset.

**Features:**
- Email input validation
- POST /api/auth/forgot-password call
- Success/error message display
- Link to login page

**Usage:**
```jsx
<Route path="/forgot-password" element={<ForgotPasswordPage />} />
```

---

#### PasswordResetPage
**Location:** `src/pages/auth/PasswordResetPage.js`

Page for resetting password with token.

**Features:**
- Parse reset token from URL
- Password strength validation
- POST /api/auth/reset-password call
- Redirect to login on success

**Usage:**
```jsx
<Route path="/reset-password/:token" element={<PasswordResetPage />} />
```

---

### Dashboard Pages

#### MyInquiriesPage
**Location:** `src/pages/MyInquiriesPage.js`

Display user inquiries with filtering and sorting.

**Features:**
- Fetch inquiries from GET /inquiries
- Filter by status
- Sort by date
- Inquiry detail modal
- Delete inquiry functionality
- Empty state display

**Usage:**
```jsx
<Route path="/inquiries" element={<MyInquiriesPage />} />
```

---

#### InvestmentPage
**Location:** `src/pages/InvestmentPage.js`

Display investment opportunities.

**Features:**
- Fetch investments from GET /investments
- Grid/list format display
- Filters (status, return range, type)
- Sorting options
- Pagination
- "Invest Now" button with modal
- "View Details" navigation

**Usage:**
```jsx
<Route path="/investments" element={<InvestmentPage />} />
```

---

#### EscrowTransactionsPage
**Location:** `src/pages/EscrowTransactionsPage.js`

Display escrow transactions.

**Features:**
- Fetch transactions from localStorage
- Transaction list with details
- Filter by status
- Sort by date/amount
- Transaction detail modal
- "Complete Payment" button for pending
- Empty state display

**Usage:**
```jsx
<Route path="/escrow" element={<EscrowTransactionsPage />} />
```

---

#### BillingPaymentsPage
**Location:** `src/pages/BillingPaymentsPage.js`

Display billing and payment information.

**Features:**
- Payment history table
- Saved payment methods section
- Add payment method form
- Invoice download functionality
- Investment summary display

**Usage:**
```jsx
<Route path="/billing" element={<BillingPaymentsPage />} />
```

---

#### SavedPropertiesPage
**Location:** `src/pages/SavedPropertiesPage.js`

Display saved favorite properties.

**Features:**
- Fetch favorites from GET /api/favorites
- Grid/list format display
- Filters (property type, location, price range)
- Sorting options (newest/oldest, price)
- Pagination
- "Remove from Favorites" button
- "View Details" navigation
- Empty state display

**Usage:**
```jsx
<Route path="/saved-properties" element={<SavedPropertiesPage />} />
```

---

#### AddPropertyPage
**Location:** `src/pages/AddPropertyPage.js`

Page for adding new property.

**Features:**
- PropertyForm component integration
- Form fields (title, description, location, price, etc.)
- Image upload
- Amenities selection
- Form validation
- POST /api/properties call
- Redirect to property detail on success
- Error message display

**Usage:**
```jsx
<Route path="/properties/add" element={<AddPropertyPage />} />
```

---

#### EditPropertyPage
**Location:** `src/pages/EditPropertyPage.js`

Page for editing existing property.

**Features:**
- Fetch property data on mount
- PropertyForm pre-population
- Image management (add/remove)
- PUT /api/properties/{propertyId} call
- Delete property button
- DELETE /api/properties/{propertyId} call
- Redirect to vendor dashboard on delete

**Usage:**
```jsx
<Route path="/properties/:id/edit" element={<EditPropertyPage />} />
```

---

#### Profile
**Location:** `src/pages/Profile.js`

User profile management page.

**Features:**
- Avatar upload button
- Avatar preview
- PUT /api/auth/jwt/update-profile call
- POST /upload/user/avatar for avatar
- Success/error message display
- Profile form editing

**Usage:**
```jsx
<Route path="/profile" element={<Profile />} />
```

---

## Shared Components

### NotificationDropdown
**Location:** `src/components/NotificationDropdown.js`

Dropdown component for notifications.

**Props:**
```javascript
{
  notifications: Array,
  unreadCount: number,
  onNotificationClick: (notification) => void
}
```

**Features:**
- Fetch notifications from GET /notifications
- Display notification list
- Show unread count badge
- Notification click handling
- Real-time updates (polling or WebSocket)

**Usage:**
```jsx
<NotificationDropdown 
  notifications={notifications}
  unreadCount={unreadCount}
  onNotificationClick={handleNotificationClick}
/>
```

---

### InvestmentCard
**Location:** `src/components/InvestmentCard.js`

Card component for displaying investment summary.

**Props:**
```javascript
{
  investment: {
    id: string,
    title: string,
    expectedReturn: number,
    targetAmount: number,
    raisedAmount: number
  },
  onInvestClick: () => void,
  onViewDetailsClick: () => void
}
```

**Features:**
- Display investment summary
- Show funding progress bar
- "Invest Now" button
- "View Details" link

**Usage:**
```jsx
<InvestmentCard 
  investment={investment}
  onInvestClick={() => setShowInvestModal(true)}
  onViewDetailsClick={() => navigate(`/investments/${investment.id}`)}
/>
```

---

### TransactionCard
**Location:** `src/components/TransactionCard.js`

Card component for displaying transaction details.

**Props:**
```javascript
{
  transaction: {
    id: string,
    amount: number,
    status: string,
    date: string
  },
  onActionClick: () => void
}
```

**Features:**
- Display transaction details
- Show status badge
- Action buttons based on status

**Usage:**
```jsx
<TransactionCard 
  transaction={transaction}
  onActionClick={handleAction}
/>
```

---

### FavoriteButton
**Location:** `src/components/FavoriteButton.js`

Button component for saving/removing favorites.

**Props:**
```javascript
{
  propertyId: string,
  isFavorited: boolean,
  onToggle: (isFavorited) => void
}
```

**Features:**
- Display heart icon (filled/empty)
- Handle click to save/remove favorite
- POST /api/favorites/{propertyId} to save
- DELETE /api/favorites/{propertyId} to remove
- Show loading state during API call
- Display error toast on failure
- Prompt login if not authenticated

**Usage:**
```jsx
<FavoriteButton 
  propertyId={propertyId}
  isFavorited={isFavorited}
  onToggle={handleToggleFavorite}
/>
```

---

### PropertyForm
**Location:** `src/components/PropertyForm.js`

Reusable form component for property creation/editing.

**Props:**
```javascript
{
  initialData?: object,
  onSubmit: (formData) => void,
  isLoading: boolean
}
```

**Features:**
- Form fields (title, description, location, price, etc.)
- Image upload
- Amenities selection
- Form validation
- Submit button

**Usage:**
```jsx
<PropertyForm 
  initialData={property}
  onSubmit={handleSubmit}
  isLoading={isSubmitting}
/>
```

---

### InvestModal
**Location:** `src/components/InvestModal.js`

Modal for investment transactions.

**Props:**
```javascript
{
  isOpen: boolean,
  investment: object,
  onClose: () => void,
  onSubmit: (investmentData) => void
}
```

**Features:**
- Amount input with validation
- Payment method selection
- Risk acknowledgment checkbox
- Submit button

**Usage:**
```jsx
<InvestModal 
  isOpen={showInvestModal}
  investment={selectedInvestment}
  onClose={() => setShowInvestModal(false)}
  onSubmit={handleInvestment}
/>
```

---

## Custom Hooks

### useInvestments
**Location:** `src/hooks/useInvestments.js`

Hook for managing investments data.

**Returns:**
```javascript
{
  investments: Array,
  total: number,
  loading: boolean,
  error: string | null,
  filters: object,
  setFilters: (filters) => void,
  sort: object,
  setSort: (sort) => void,
  pagination: object,
  setPagination: (pagination) => void
}
```

**Features:**
- Fetch investments from GET /investments
- Filtering logic
- Sorting logic
- Pagination handling
- Error handling

**Usage:**
```jsx
const { investments, loading, filters, setFilters } = useInvestments();
```

---

### useNotifications
**Location:** `src/hooks/useNotifications.js`

Hook for managing notifications.

**Returns:**
```javascript
{
  notifications: Array,
  unreadCount: number,
  loading: boolean,
  error: string | null,
  markAsRead: (notificationId) => void,
  deleteNotification: (notificationId) => void
}
```

**Features:**
- Fetch notifications from GET /notifications
- Real-time updates
- Notification filtering
- Error handling

**Usage:**
```jsx
const { notifications, unreadCount } = useNotifications();
```

---

### useInquiries
**Location:** `src/hooks/useInquiries.js`

Hook for managing inquiries.

**Returns:**
```javascript
{
  inquiries: Array,
  total: number,
  loading: boolean,
  error: string | null,
  createInquiry: (inquiryData) => Promise,
  deleteInquiry: (inquiryId) => Promise,
  filters: object,
  setFilters: (filters) => void
}
```

**Features:**
- Fetch inquiries from GET /inquiries
- Filtering and sorting
- Inquiry creation
- Inquiry deletion
- Error handling

**Usage:**
```jsx
const { inquiries, createInquiry, deleteInquiry } = useInquiries();
```

---

### usePayments
**Location:** `src/hooks/usePayments.js`

Hook for managing payments.

**Returns:**
```javascript
{
  processPayment: (paymentData) => Promise,
  verifyPayment: (paymentId) => Promise,
  loading: boolean,
  error: string | null
}
```

**Features:**
- Payment initialization
- Payment verification
- Error handling

**Usage:**
```jsx
const { processPayment, loading } = usePayments();
```

---

### useFavorites
**Location:** `src/hooks/useFavorites.js`

Hook for managing favorite properties.

**Returns:**
```javascript
{
  favorites: Array,
  total: number,
  loading: boolean,
  error: string | null,
  addFavorite: (propertyId) => Promise,
  removeFavorite: (propertyId) => Promise,
  isFavorited: (propertyId) => boolean,
  filters: object,
  setFilters: (filters) => void,
  pagination: object,
  setPagination: (pagination) => void
}
```

**Features:**
- Fetch favorites from GET /api/favorites
- Add favorite (POST /api/favorites/{propertyId})
- Remove favorite (DELETE /api/favorites/{propertyId})
- Filtering and sorting logic
- Pagination handling
- Error handling

**Usage:**
```jsx
const { favorites, addFavorite, removeFavorite } = useFavorites();
```

---

## Component Hierarchy

```
App
├── SignInModal
├── Routes
│   ├── ForgotPasswordPage
│   ├── PasswordResetPage
│   ├── MyInquiriesPage
│   │   └── InquiryCard
│   ├── InvestmentPage
│   │   ├── InvestmentCard
│   │   └── InvestModal
│   ├── EscrowTransactionsPage
│   │   └── TransactionCard
│   ├── BillingPaymentsPage
│   ├── SavedPropertiesPage
│   │   ├── PropertyCard
│   │   └── FavoriteButton
│   ├── AddPropertyPage
│   │   └── PropertyForm
│   ├── EditPropertyPage
│   │   └── PropertyForm
│   └── Profile
│       └── Avatar Upload
└── NotificationDropdown
```

---

## Styling

All components use consistent styling with:
- Tailwind CSS for utility classes
- CSS modules for component-specific styles
- Responsive design for mobile/tablet/desktop
- Accessibility features (ARIA labels, semantic HTML)

---

## Testing

All components include unit tests:
- Component rendering tests
- User interaction tests
- API call mocking
- Error state handling
- Loading state handling

Test files located in `src/__tests__/` directory.
