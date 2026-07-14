# Vercel Deployment with Neon Database

## Environment Variables Configuration

Add these to your Vercel project settings:

### Required Variables

```env
# Neon Database Connection
DATABASE_URL=postgresql://neondb_owner:npg_xUZQWBfyGt79@ep-noisy-resonance-am77s3ty-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# JWT Authentication (generate strong secrets)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-characters

# Node Environment
NODE_ENV=production

# Frontend API Configuration
REACT_APP_API_URL=/api
```

### Optional Variables

```env
# Firebase (if using)
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id

# Development (for local testing)
DATABASE_URL_LOCAL=postgresql://postgres:password@localhost:15432/real_estate_db
```

## Vercel Project Setup

### 1. Environment Variables Setup

1. Go to your Vercel project dashboard
2. Navigate to **Settings > Environment Variables**
3. Add the required variables above
4. Mark sensitive variables as **"Sensitive"**

### 2. Build Configuration

Your `vercel.json` is already configured with:
- Static build for React frontend
- Serverless functions for API
- Proper routing for `/api/*` endpoints

### 3. Database Connection

The serverless functions use:
- **Neon PostgreSQL** for production
- **Connection pooling** optimized for serverless
- **SSL enabled** by default
- **Automatic connection testing**

## Testing the Setup

### 1. Health Check
```bash
curl https://your-app.vercel.app/api/health
```

### 2. Database Connection
```bash
curl https://your-app.vercel.app/api/properties
```

### 3. Authentication Test
```bash
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Neon Database Features

### Connection Pooling
- **Max connections**: 1 (serverless optimized)
- **Idle timeout**: 10 seconds
- **Connection timeout**: 60 seconds

### SSL Configuration
- **SSL Mode**: `require`
- **Channel Binding**: `require`
- **Reject Unauthorized**: `false` (Neon compatibility)

### Performance Tips
1. **Connection reuse** within function execution
2. **Graceful connection close** after response
3. **Connection testing** before operations
4. **Error handling** for connection failures

## Troubleshooting

### Database Connection Issues

**Error**: `Database connection failed`
**Solution**: 
1. Verify `DATABASE_URL` is correct
2. Check Neon database is active
3. Ensure SSL settings match Neon requirements

**Error**: `timeout exceeded`
**Solution**:
1. Increase connection timeout
2. Check network connectivity
3. Verify database is not paused

### Function Timeout Issues

**Error**: `Function execution timed out`
**Solution**:
1. Optimize database queries
2. Reduce data payload
3. Implement pagination

### Environment Variable Issues

**Error**: `DATABASE_URL is not set`
**Solution**:
1. Add variable to Vercel project
2. Redeploy after adding variables
3. Check variable names match exactly

## Security Considerations

### JWT Secrets
- Use **minimum 32 characters**
- Mix letters, numbers, and symbols
- Don't use common words
- Generate new secrets for production

### Database Security
- Neon provides **built-in security**
- SSL is **always enabled**
- Connection strings are **encrypted**
- Regular security updates

### API Security
- **CORS** configured for same domain
- **Input validation** on all endpoints
- **Error handling** prevents information leakage
- **Rate limiting** can be added if needed

## Deployment Checklist

- [ ] Add all environment variables to Vercel
- [ ] Test database connection locally first
- [ ] Deploy to Vercel
- [ ] Test `/api/health` endpoint
- [ ] Test property endpoints
- [ ] Test authentication flow
- [ ] Monitor function logs
- [ ] Check error rates

## Monitoring

### Vercel Dashboard
- **Function Logs**: Real-time execution logs
- **Usage Metrics**: Function invocations and duration
- **Error Rates**: Failed requests and errors
- **Performance**: Response times and throughput

### Neon Dashboard
- **Database Metrics**: Connection count and performance
- **Query Performance**: Slow query analysis
- **Storage Usage**: Database size and growth
- **Security Logs**: Connection attempts and access

## Next Steps

1. **Add environment variables** to Vercel
2. **Deploy the application**
3. **Test all API endpoints**
4. **Monitor function performance**
5. **Set up alerts** for errors

Your application is now ready for Vercel deployment with Neon database!
