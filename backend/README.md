# Real Estate Marketplace Backend

A comprehensive backend API for the Real Estate Marketplace application built with Node.js, Express, and MongoDB.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Property Management**: CRUD operations for real estate listings with advanced filtering
- **User Management**: User profiles, favorites, and preferences
- **File Upload**: Image upload support (Cloudinary integration planned)
- **Payment Processing**: Stripe integration for payments (planned)
- **Email Services**: SendGrid integration for notifications (planned)
- **Real-time Features**: Socket.io for live updates (planned)
- **Security**: Rate limiting, CORS, Helmet, input validation

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **Security**: helmet, cors, express-rate-limit
- **File Upload**: multer, cloudinary
- **Payments**: Stripe
- **Email**: Nodemailer, SendGrid
- **Real-time**: Socket.io

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd real-estate-marketplace/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the backend directory:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/real-estate

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=30d

   # Cloudinary Configuration (for image uploads)
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret

   # Stripe Configuration (for payments)
   STRIPE_SECRET_KEY=your-stripe-secret-key
   STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key

   # Email Configuration (SendGrid)
   SENDGRID_API_KEY=your-sendgrid-api-key
   EMAIL_FROM=noreply@realestate.com

   # File Upload Configuration
   MAX_FILE_SIZE=5242880
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login user | Public |
| GET | `/api/auth/me` | Get current user | Private |
| PUT | `/api/auth/profile` | Update user profile | Private |
| PUT | `/api/auth/password` | Change password | Private |

### Properties

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/properties` | Get all properties (with filtering) | Public |
| GET | `/api/properties/:id` | Get single property | Public |
| POST | `/api/properties` | Create new property | Private |
| PUT | `/api/properties/:id` | Update property | Private |
| DELETE | `/api/properties/:id` | Delete property | Private |
| POST | `/api/properties/:id/favorite` | Toggle favorite | Private |

### Users

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/users/profile` | Get user profile | Private |
| GET | `/api/users/favorites` | Get user favorites | Private |
| GET | `/api/users/properties` | Get user properties | Private |

### Other Routes

- `/api/investments` - Investment management (to be implemented)
- `/api/escrow` - Escrow transactions (to be implemented)
- `/api/payments` - Payment processing (to be implemented)
- `/api/upload` - File uploads (to be implemented)

## Database Models

### User Model
- Basic info: firstName, lastName, email, password, phone
- Role-based access: user, agent, admin
- Preferences: notifications, search preferences
- Favorites: array of favorite properties
- Verification: email verification, password reset

### Property Model
- Basic info: title, description, price, type, status
- Location: address, city, state, zipCode, coordinates
- Details: bedrooms, bathrooms, sqft, lotSize, yearBuilt
- Features: amenities, images, owner, agent
- Financial: monthlyRent, annualTaxes, hoaFees
- Analytics: views, favorites, inquiries

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for password security
- **Input Validation**: express-validator for request validation
- **Rate Limiting**: Prevent abuse with request limiting
- **CORS**: Cross-origin resource sharing configuration
- **Helmet**: Security headers for Express
- **Role-based Access**: Different permissions for different user roles

## Development

### Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests (to be implemented)
```

### Project Structure

```
backend/
├── models/          # Database models
│   ├── User.js
│   └── Property.js
├── routes/          # API routes
│   ├── auth.js
│   ├── properties.js
│   ├── users.js
│   ├── investments.js
│   ├── escrow.js
│   ├── payments.js
│   └── upload.js
├── middleware/      # Custom middleware
│   └── auth.js
├── config/          # Configuration files
├── server.js        # Main server file
├── package.json
└── README.md
```

## Future Enhancements

- [ ] Complete investment management system
- [ ] Implement escrow functionality
- [ ] Add payment processing with Stripe
- [ ] Integrate file upload with Cloudinary
- [ ] Add email notifications with SendGrid
- [ ] Implement real-time features with Socket.io
- [ ] Add comprehensive testing suite
- [ ] Implement caching with Redis
- [ ] Add API documentation with Swagger
- [ ] Implement search with Elasticsearch

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License. 