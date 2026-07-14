# Vercel Environment Variables Setup

This document lists all required environment variables for deploying the PropertyArk backend as Vercel serverless functions.

## Required Environment Variables

Add these in your Vercel project dashboard under **Settings > Environment Variables**:

### Database Configuration
- `DATABASE_URL` - PostgreSQL connection string (e.g., `postgresql://user:password@host:port/database`)
  - Get this from your Render Postgres dashboard
  - Example: `postgresql://propertyark_user:password@dpg-xxxxx.oregon-postgres.render.com/propertyark`

### Authentication
- `JWT_SECRET` - Secret key for JWT token signing (generate a random string)
  - Generate with: `openssl rand -base64 32`
  - Example: `your-super-secret-jwt-key-change-in-production`

### Security
- `NODE_ENV` - Set to `production` for Vercel deployment
- `ALLOW_MOCK_AUTH` - Set to `false` in production (disables mock authentication)
- `DB_REQUIRE_SSL` - Set to `true` for production databases
- `DB_REJECT_UNAUTHORIZED` - Set to `false` if using self-signed SSL certificates

### Frontend URL
- `FRONTEND_URL` - Your frontend URL (for CORS)
  - Example: `https://real-estate-marketplace-delta.vercel.app`

### Optional Services (if using)
- `FLUTTERWAVE_SECRET_KEY` - For payment processing
- `CLOUDINARY_CLOUD_NAME` - For file uploads
- `CLOUDINARY_API_KEY` - For file uploads
- `CLOUDINARY_API_SECRET` - For file uploads
- `SENDGRID_API_KEY` - For email services

## Vercel-Specific Variables

These are automatically set by Vercel:
- `VERCEL` - Set to `1` (used to detect serverless environment)
- `VERCEL_ENV` - Environment name (production, preview, development)

## Setup Steps

1. Go to your Vercel project dashboard
2. Navigate to **Settings > Environment Variables**
3. Add each variable from the "Required" section above
4. Select the appropriate environments (Production, Preview, Development)
5. Click **Save**
6. Redeploy your project to apply the changes

## Getting DATABASE_URL from Render

1. Go to your Render Postgres dashboard
2. Click on your database
3. Scroll to "Connections" section
4. Copy the "External Database URL"
5. Paste it as the `DATABASE_URL` value in Vercel

## Testing Locally

To test locally with Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Pull environment variables
vercel env pull .env.local

# Run locally
vercel dev
```

## Important Notes

- Never commit `.env` files to version control
- Use different `JWT_SECRET` for production vs development
- Ensure `ALLOW_MOCK_AUTH=false` in production
- Database SSL is required for production PostgreSQL on Render
