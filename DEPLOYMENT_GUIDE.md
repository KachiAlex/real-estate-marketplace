# Deployment Guide

## Overview
Complete guide for deploying the frontend-backend integration system to production.

---

## Prerequisites

- Node.js 16+ installed
- npm or yarn package manager
- Git for version control
- Render account (for backend deployment)
- Hosting service account (for frontend deployment)
- Database setup (MongoDB or PostgreSQL)
- Environment variables configured

---

## Backend Deployment (Render)

### Step 1: Prepare Backend for Deployment

1. **Update environment variables:**
   ```bash
   cp .env.render-template .env.render
   ```

2. **Configure production environment variables:**
   ```
   NODE_ENV=production
   DATABASE_URL=your_production_database_url
   JWT_SECRET=your_secure_jwt_secret
   SENDGRID_API_KEY=your_sendgrid_key
   STORAGE_BUCKET=your_storage_bucket
   STORAGE_KEY=your_storage_key
   ```

3. **Run database migrations:**
   ```bash
   npm run migrate:prod
   ```

### Step 2: Deploy to Render

1. **Connect GitHub repository:**
   - Go to Render dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository and branch

2. **Configure build settings:**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment: Node
   - Node Version: 16

3. **Set environment variables:**
   - Add all production environment variables in Render dashboard
   - Ensure DATABASE_URL is set to production database

4. **Deploy:**
   - Click "Create Web Service"
   - Render will automatically deploy on push to main branch

### Step 3: Verify Backend Deployment

1. **Test API endpoints:**
   ```bash
   curl https://your-api.onrender.com/api/health
   ```

2. **Check logs:**
   - View deployment logs in Render dashboard
   - Monitor for any errors

3. **Run smoke tests:**
   ```bash
   npm run test:smoke
   ```

---

## Frontend Deployment

### Step 1: Build Production Bundle

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build production bundle:**
   ```bash
   npm run build
   ```

3. **Verify build output:**
   ```bash
   ls -la build/
   ```

### Step 2: Configure API Endpoints

1. **Update API base URL:**
   ```javascript
   // .env.production
   REACT_APP_API_URL=https://your-api.onrender.com
   ```

2. **Rebuild with production config:**
   ```bash
   npm run build
   ```

### Step 3: Deploy to Hosting Service

#### Option A: Vercel

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel --prod
   ```

3. **Configure environment variables:**
   - Go to Vercel dashboard
   - Project Settings → Environment Variables
   - Add REACT_APP_API_URL

#### Option B: Netlify

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Deploy:**
   ```bash
   netlify deploy --prod --dir=build
   ```

3. **Configure environment variables:**
   - Go to Netlify dashboard
   - Site Settings → Build & Deploy → Environment
   - Add REACT_APP_API_URL

#### Option C: AWS S3 + CloudFront

1. **Build and upload to S3:**
   ```bash
   aws s3 sync build/ s3://your-bucket-name --delete
   ```

2. **Invalidate CloudFront cache:**
   ```bash
   aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
   ```

### Step 4: Verify Frontend Deployment

1. **Test application:**
   - Visit deployed URL
   - Test login functionality
   - Test API calls

2. **Check browser console:**
   - Verify no CORS errors
   - Check API endpoint configuration

3. **Run performance tests:**
   ```bash
   npm run test:performance
   ```

---

## Database Setup

### MongoDB

1. **Create MongoDB Atlas cluster:**
   - Go to MongoDB Atlas
   - Create new cluster
   - Configure security (IP whitelist, database user)

2. **Get connection string:**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/dbname
   ```

3. **Set DATABASE_URL:**
   ```bash
   export DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/dbname"
   ```

### PostgreSQL

1. **Create database:**
   ```bash
   createdb production_db
   ```

2. **Run migrations:**
   ```bash
   npm run migrate:prod
   ```

3. **Set DATABASE_URL:**
   ```bash
   export DATABASE_URL="postgresql://user:password@host:5432/production_db"
   ```

---

## SSL/TLS Configuration

1. **Enable HTTPS:**
   - Render automatically provides SSL certificates
   - Vercel/Netlify automatically provide SSL certificates

2. **Update API calls:**
   - Ensure all API calls use HTTPS
   - Update CORS configuration if needed

3. **Security headers:**
   - Configure Content-Security-Policy
   - Configure X-Frame-Options
   - Configure X-Content-Type-Options

---

## Monitoring & Logging

### Backend Monitoring

1. **Set up error tracking:**
   ```bash
   npm install sentry
   ```

2. **Configure Sentry:**
   ```javascript
   import * as Sentry from "@sentry/node";
   
   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.NODE_ENV
   });
   ```

3. **Monitor logs:**
   - View Render logs in dashboard
   - Set up log aggregation (e.g., LogRocket)

### Frontend Monitoring

1. **Set up error tracking:**
   ```bash
   npm install @sentry/react
   ```

2. **Configure Sentry:**
   ```javascript
   import * as Sentry from "@sentry/react";
   
   Sentry.init({
     dsn: process.env.REACT_APP_SENTRY_DSN,
     environment: process.env.NODE_ENV
   });
   ```

3. **Monitor performance:**
   - Use Lighthouse for performance audits
   - Monitor Core Web Vitals

---

## Backup & Recovery

### Database Backups

1. **MongoDB Atlas:**
   - Automatic daily backups enabled
   - Manual backup available in Atlas dashboard

2. **PostgreSQL:**
   ```bash
   pg_dump production_db > backup.sql
   ```

3. **Restore from backup:**
   ```bash
   psql production_db < backup.sql
   ```

### Code Backups

1. **GitHub:**
   - All code automatically backed up
   - Use GitHub releases for version control

---

## Rollback Procedure

### Backend Rollback

1. **Identify previous working version:**
   ```bash
   git log --oneline
   ```

2. **Revert to previous commit:**
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

3. **Render will automatically redeploy:**
   - Monitor deployment in Render dashboard

### Frontend Rollback

1. **Vercel:**
   - Go to Deployments
   - Click "Promote to Production" on previous version

2. **Netlify:**
   - Go to Deploys
   - Click "Publish deploy" on previous version

---

## Performance Optimization

### Backend Optimization

1. **Enable caching:**
   ```javascript
   app.use(express.static('public', { maxAge: '1d' }));
   ```

2. **Compress responses:**
   ```bash
   npm install compression
   ```

3. **Database indexing:**
   ```javascript
   db.properties.createIndex({ location: 1 });
   db.investments.createIndex({ status: 1 });
   ```

### Frontend Optimization

1. **Code splitting:**
   ```javascript
   const InvestmentPage = lazy(() => import('./pages/InvestmentPage'));
   ```

2. **Image optimization:**
   - Use WebP format
   - Implement lazy loading
   - Compress images

3. **Bundle analysis:**
   ```bash
   npm run analyze
   ```

---

## Security Checklist

- [ ] Environment variables are not committed to git
- [ ] HTTPS is enabled on all endpoints
- [ ] CORS is properly configured
- [ ] JWT secrets are strong and unique
- [ ] Database credentials are secure
- [ ] API rate limiting is enabled
- [ ] Input validation is implemented
- [ ] SQL injection prevention is in place
- [ ] XSS protection is enabled
- [ ] CSRF tokens are implemented
- [ ] Security headers are configured
- [ ] Dependencies are up to date
- [ ] Secrets are stored in environment variables
- [ ] Database backups are automated
- [ ] Error messages don't expose sensitive info

---

## Troubleshooting

### Backend Issues

**Issue: API returns 500 error**
- Check Render logs
- Verify database connection
- Check environment variables

**Issue: Database connection fails**
- Verify DATABASE_URL
- Check database credentials
- Verify IP whitelist (MongoDB Atlas)

**Issue: CORS errors**
- Update CORS configuration
- Verify frontend URL in CORS whitelist

### Frontend Issues

**Issue: API calls fail**
- Check REACT_APP_API_URL
- Verify CORS configuration
- Check browser console for errors

**Issue: Page loads slowly**
- Run Lighthouse audit
- Check bundle size
- Optimize images

**Issue: Authentication fails**
- Verify JWT token storage
- Check token expiration
- Verify API endpoint

---

## Post-Deployment Checklist

- [ ] All API endpoints are accessible
- [ ] Frontend loads without errors
- [ ] Authentication works correctly
- [ ] Database operations work
- [ ] File uploads work
- [ ] Email notifications are sent
- [ ] Error handling works
- [ ] Logging is working
- [ ] Monitoring is active
- [ ] Backups are configured
- [ ] SSL/TLS is enabled
- [ ] Performance is acceptable
- [ ] Security headers are set
- [ ] Rate limiting is active
- [ ] Documentation is updated

---

## Maintenance

### Regular Tasks

1. **Weekly:**
   - Monitor error logs
   - Check performance metrics
   - Review security alerts

2. **Monthly:**
   - Update dependencies
   - Review and optimize slow queries
   - Analyze user feedback

3. **Quarterly:**
   - Security audit
   - Performance optimization
   - Database maintenance

### Update Procedure

1. **Test updates locally:**
   ```bash
   npm update
   npm test
   ```

2. **Deploy to staging:**
   - Create staging environment
   - Deploy updates
   - Run full test suite

3. **Deploy to production:**
   - Schedule maintenance window
   - Deploy updates
   - Monitor for issues
   - Be ready to rollback
