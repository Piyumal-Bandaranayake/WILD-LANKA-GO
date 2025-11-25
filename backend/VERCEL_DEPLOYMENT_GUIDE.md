# Vercel Deployment Guide - Wild Lanka Go Backend

## Recent Fixes Applied (Nov 25, 2025)

### Issues Fixed:
1. ✅ **500 Errors on Root Route** - Fixed serverless handler initialization
2. ✅ **Database Connection Issues** - Implemented proper connection caching
3. ✅ **Logger File System Errors** - Updated logger to use console on Vercel
4. ✅ **Favicon 404 Errors** - Added favicon handler

## Pre-Deployment Checklist

### 1. Environment Variables
Ensure these are set in your Vercel project settings:

```bash
# Required
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/wildlankago
JWT_SECRET=your_jwt_secret_minimum_32_characters
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=https://your-frontend.vercel.app

# Optional
JWT_REFRESH_SECRET=your_refresh_secret
NODE_ENV=production
ALLOWED_ORIGINS=https://additional-domain.com
```

### 2. Vercel Project Configuration

**Option A: Using Vercel CLI**
```bash
cd backend
vercel login
vercel env add MONGODB_URI
vercel env add JWT_SECRET
vercel env add CLOUDINARY_CLOUD_NAME
vercel env add CLOUDINARY_API_KEY
vercel env add CLOUDINARY_API_SECRET
vercel env add FRONTEND_URL
```

**Option B: Using Vercel Dashboard**
1. Go to your project on vercel.com
2. Settings → Environment Variables
3. Add each variable for Production, Preview, and Development

## Deployment Steps

### Deploy to Vercel

```bash
cd backend
vercel --prod
```

Or push to GitHub (if connected):
```bash
git add .
git commit -m "Backend ready for Vercel deployment"
git push origin main
```

## Testing the Deployment

### 1. Test Root Endpoint
```bash
curl https://your-backend.vercel.app/
```
Expected response:
```json
{
  "success": true,
  "message": "Wild Lanka Go API is running",
  "version": "1.0.0",
  "environment": "production",
  "timestamp": "2025-11-25T..."
}
```

### 2. Test Health Endpoint
```bash
curl https://your-backend.vercel.app/api/health
```

### 3. Test Database Connection
```bash
curl https://your-backend.vercel.app/api/auth/test
```

## Troubleshooting

### Error: 500 Internal Server Error

**Cause**: Missing environment variables or database connection issues

**Solution**:
1. Check Vercel logs: `vercel logs your-deployment-url`
2. Verify all environment variables are set
3. Test MongoDB connection string locally
4. Check if IP is whitelisted in MongoDB Atlas

### Error: CORS Issues

**Cause**: Frontend URL not in allowed origins

**Solution**:
```bash
# Set FRONTEND_URL in Vercel
vercel env add FRONTEND_URL production
# Enter: https://your-frontend.vercel.app
```

### Error: Database connection timeout

**Cause**: MongoDB Atlas IP whitelist or connection string issue

**Solution**:
1. In MongoDB Atlas → Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0)
2. Verify connection string format:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/wildlankago?retryWrites=true&w=majority
   ```

### Error: Image uploads failing

**Cause**: Cloudinary not configured

**Solution**:
1. Verify Cloudinary credentials are correct
2. Test Cloudinary configuration:
   ```bash
   curl -X POST https://your-backend.vercel.app/api/test-upload \
     -H "Content-Type: application/json"
   ```

## Viewing Logs

### Real-time logs
```bash
vercel logs --follow
```

### Recent logs
```bash
vercel logs
```

### Specific deployment logs
```bash
vercel logs <deployment-url>
```

## Key Differences from Traditional Server

| Feature | Traditional Server | Vercel Serverless |
|---------|-------------------|-------------------|
| File Storage | ✅ Disk storage works | ❌ Use Cloudinary |
| Background Jobs | ✅ Cron/scheduled tasks | ❌ Use Vercel Cron |
| WebSockets | ✅ Full support | ⚠️ Limited support |
| Cold Starts | ❌ Always warm | ⚠️ First request slower |
| Database Connection | Once on startup | Cached per function |
| File Logging | ✅ Works | ❌ Use console.log |

## Performance Optimization

### 1. Database Connection Caching
Already implemented in `config/db.js`:
```javascript
let cachedConnection = null;
// Returns cached connection when available
```

### 2. Reduce Cold Starts
- Keep functions small and focused
- Minimize dependencies
- Use dynamic imports for large libraries

### 3. Monitor Performance
```bash
vercel inspect <deployment-url>
```

## Rollback if Needed

```bash
# List deployments
vercel ls

# Promote a previous deployment
vercel promote <previous-deployment-url>
```

## CI/CD with GitHub

1. Connect repository to Vercel
2. Auto-deploys on push to main
3. Preview deployments for PRs

## Common Commands

```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel

# Check deployment status
vercel ls

# View environment variables
vercel env ls

# Remove deployment
vercel rm <deployment-name>
```

## Support Resources

- Vercel Documentation: https://vercel.com/docs
- MongoDB Atlas: https://www.mongodb.com/docs/atlas/
- Cloudinary Docs: https://cloudinary.com/documentation

## Emergency Contacts

If deployment fails critically:
1. Check Vercel status: https://www.vercel-status.com/
2. Review MongoDB Atlas status
3. Check Cloudinary status

---
Last Updated: November 25, 2025
