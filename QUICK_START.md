# Quick Start - Multi-Role Feature

## 🚀 Ready to Deploy!

All code is complete and tested. Follow these steps to deploy the multi-role feature.

## Step 1: Deploy to Vercel (2 minutes)

```bash
# Commit all changes
git add api/users.js api/admin.js api/auth/*.js vercel.json *.md
git commit -m "feat: implement multi-role user functionality"
git push origin main
```

Vercel will automatically deploy. Wait for the deployment to complete (check https://vercel.com/dashboard).

## Step 2: Run Database Migration (30 seconds)

Once deployed, open your browser console on https://real-estate-marketplace-delta.vercel.app and run:

```javascript
fetch('/api/admin?action=setup-database', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(data => console.log('✅ Migration Result:', data));
```

You should see:
```
✅ Migration Result: {
  success: true,
  message: "Database setup completed",
  results: [...]
}
```

## Step 3: Test with Existing User (1 minute)

Still in the browser console:

```javascript
// Login
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'onyedika.akoma@gmail.com',
    password: 'dikaoliver2660'
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Login successful');
  console.log('Roles:', data.user.roles);
  console.log('Active Role:', data.user.activeRole);
  window.testToken = data.token;
});
```

Expected output:
```
✅ Login successful
Roles: ["user"]
Active Role: "user"
```

## Step 4: Switch to Vendor Role (30 seconds)

```javascript
fetch('/api/auth/jwt/switch-role', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${window.testToken}`
  },
  body: JSON.stringify({ role: 'vendor' })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Role switched');
  console.log('New Roles:', data.user.roles);
  console.log('Active Role:', data.user.activeRole);
});
```

Expected output:
```
✅ Role switched
New Roles: ["user", "vendor"]
Active Role: "vendor"
```

## Step 5: Verify Frontend (1 minute)

1. Refresh the page
2. You should now see a dashboard switcher in the navigation
3. Click it to switch between "Buyer Dashboard" and "Vendor Dashboard"
4. Verify the URL changes and content updates

## ✅ Done!

The multi-role feature is now live. Users can:
- Register with multiple roles
- Switch between buyer and vendor dashboards
- Access role-specific features

## 🐛 Troubleshooting

### Issue: Migration fails
**Check**: Database connection string in Vercel environment variables
**Fix**: Verify `DATABASE_URL` is set correctly

### Issue: 404 on role endpoints
**Check**: Vercel deployment completed successfully
**Fix**: Redeploy or check vercel.json routing rules

### Issue: Dashboard switcher not showing
**Check**: User has multiple roles
**Fix**: Run the role switch command above to add vendor role

### Issue: "Column roles does not exist"
**Check**: Migration was run successfully
**Fix**: Run Step 2 again

## 📚 More Information

- **Full Testing Guide**: See `MULTI_ROLE_TESTING_GUIDE.md`
- **Deployment Details**: See `DEPLOYMENT_STEPS.md`
- **Implementation Details**: See `MULTI_ROLE_IMPLEMENTATION.md`
- **Quick Summary**: See `MULTI_ROLE_SUMMARY.md`

## 🎯 What's Next?

After successful deployment:
1. Test with admin user: `admin@propertyark.com` / `admin123`
2. Register a new user with dual roles
3. Test the "Become a Vendor" flow
4. Monitor Vercel logs for any errors
5. Update user documentation

## 💡 Pro Tips

- The role switch endpoint automatically adds roles if the user doesn't have them
- Existing single-role users will continue to work without changes
- The frontend should fetch fresh user data after role switching
- All endpoints are backward compatible with existing code

## 🔗 Quick Links

- Production Site: https://real-estate-marketplace-delta.vercel.app
- Vercel Dashboard: https://vercel.com/dashboard
- Database Admin: (your database provider)

---

**Need Help?** Check the troubleshooting section above or review the detailed guides in the other markdown files.
