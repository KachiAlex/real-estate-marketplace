# Vercel Deployment Configuration

This project is configured for Vercel deployment with serverless functions.

## Structure

```
real-estate-marketplace/
├── api/                    # Serverless API functions
│   ├── properties.js         # Property CRUD operations
│   ├── auth/
│   │   ├── login.js         # User authentication
│   │   └── register.js      # User registration
│   ├── users/
│   │   └── profile.js       # User profile management
│   ├── health.js            # Health check endpoint
│   └── _middleware.js       # Shared middleware
├── src/                    # React frontend
├── public/                  # Static assets
├── vercel.json             # Vercel configuration
└── .vercelignore          # Files to exclude
```

## Environment Variables

Add these to your Vercel project:

### Required
```
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-jwt-secret-key
NODE_ENV=production
```

### Optional
```
REACT_APP_API_URL=/api
REACT_APP_FIREBASE_API_KEY=your-firebase-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
```

## API Endpoints

All backend endpoints are available as serverless functions:

- `GET /api/properties` - List properties
- `GET /api/properties/:id` - Get property
- `POST /api/properties` - Create property
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/health` - Health check

## Deployment

1. Connect your repository to Vercel
2. Add environment variables
3. Deploy automatically on push to main branch

## Development

### Local Development
```bash
# Frontend
npm start

# Test serverless functions locally
npm install -g vercel
vercel dev
```

### Database
- Use Vercel Postgres or external PostgreSQL
- Connection string in `DATABASE_URL` environment variable
- Serverless functions auto-connect using Sequelize

## Benefits

✅ **Single Domain**: No CORS issues
✅ **Zero Setup**: Automatic deployment
✅ **Global CDN**: Fast static asset delivery
✅ **Serverless**: Pay-per-use pricing
✅ **Scalable**: Auto-scaling functions

## Limitations

⚠️ **Function Timeout**: 30 seconds max
⚠️ **Memory Limit**: 1GB max per function
⚠️ **No WebSockets**: Socket.IO needs workarounds
⚠️ **No Background Jobs**: Use external services

## Migration Notes

- Backend routes converted to serverless functions
- Database connections optimized for serverless
- Environment variables updated for Vercel
- Frontend API calls use relative paths (`/api`)

## Support

For issues with Vercel deployment:
1. Check function logs in Vercel dashboard
2. Verify environment variables
3. Test locally with `vercel dev`
4. Check Vercel deployment logs
