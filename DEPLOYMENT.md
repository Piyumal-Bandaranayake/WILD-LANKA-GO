# 🚀 WILD LANKA GO - Vercel Deployment Guide

This guide provides step-by-step instructions for deploying the WILD LANKA GO application to Vercel.

## 📋 Prerequisites

Before deploying, ensure you have:

1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI** - Install globally: `npm install -g vercel`
3. **GitHub Repository** - Your code should be on GitHub
4. **Environment Variables** - Have all credentials ready

## 🏗️ Project Structure

```
WILD-LANKA-GO/
├── frontend/           # React + Vite application
├── backend/            # Express.js API
├── vercel.json        # Main Vercel configuration
├── deploy.sh          # Unix/Mac deployment script
└── deploy.bat         # Windows deployment script
```

## 🔧 Configuration Files

### 1. Root `vercel.json`
Configures monorepo deployment with both frontend and backend.

### 2. Frontend `vercel.json`
Configures Vite build for static deployment.

### 3. Backend `vercel.json`
Configures Express.js as serverless functions.

## 🌐 Deployment Methods

### Method 1: Using Deployment Scripts (Recommended)

#### **For Windows:**
```bash
deploy.bat
```

#### **For Unix/Mac/Linux:**
```bash
chmod +x deploy.sh
./deploy.sh
```

### Method 2: Manual Vercel CLI Deployment

```bash
# Login to Vercel
vercel login

# Install dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Build frontend
cd frontend && npm run build && cd ..

# Deploy to production
vercel --prod
```

### Method 3: GitHub Integration (Easiest)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "chore: add Vercel deployment configuration"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect the configuration

3. **Vercel will automatically:**
   - Build your frontend
   - Deploy backend as serverless functions
   - Provide deployment URLs

## ⚙️ Environment Variables Setup

After deployment, configure these variables in Vercel Dashboard:

### Backend Variables

Navigate to: **Project Settings → Environment Variables**

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/wildlankago

# Auth0
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_AUDIENCE=your-api-identifier
AUTH0_ISSUER=https://your-domain.auth0.com/

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# CORS
FRONTEND_URL=https://your-frontend-url.vercel.app
```

### Frontend Variables

```env
# API
VITE_API_URL=https://your-backend-url.vercel.app/api

# Auth0
VITE_AUTH0_DOMAIN=your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=your-api-identifier
VITE_AUTH0_REDIRECT_URI=https://your-frontend-url.vercel.app
```

### Setting Environment Variables

**Option 1: Via Vercel Dashboard**
1. Go to Project Settings
2. Click "Environment Variables"
3. Add each variable with appropriate scope (Production/Preview/Development)

**Option 2: Via Vercel CLI**
```bash
vercel env add MONGODB_URI production
vercel env add AUTH0_DOMAIN production
# ... repeat for all variables
```

## 🔄 Automatic Deployments

Once connected to GitHub, Vercel will automatically:

- ✅ Deploy on every push to `main` branch (Production)
- ✅ Create preview deployments for pull requests
- ✅ Run build checks before deployment
- ✅ Provide unique URLs for each deployment

### Branch Configuration

- **Production Branch:** `main`
- **Preview Branches:** All other branches
- **Ignored Branches:** Can be configured in Vercel settings

## 📊 Deployment Workflow

```
Local Changes → Git Push → Vercel Build → Deploy
     ↓              ↓            ↓            ↓
  Code Edit    GitHub Trigger  Run Build   Live URL
```

## 🐛 Troubleshooting

### Build Failures

**Issue:** Frontend build fails
```bash
# Solution: Check build command in frontend/package.json
"scripts": {
  "build": "vite build"
}
```

**Issue:** Backend serverless function errors
```bash
# Solution: Verify server.js exports properly
module.exports = app; // Add if missing
```

### Environment Variables

**Issue:** Variables not loading
- Ensure variables are set in correct scope (Production)
- Redeploy after adding new variables
- Check variable names match exactly (case-sensitive)

### API Routes Not Working

**Issue:** 404 on API calls
- Verify `vercel.json` routes configuration
- Check API_URL in frontend environment variables
- Ensure CORS is configured in backend

### Database Connection

**Issue:** MongoDB connection fails
```bash
# Solution: Whitelist Vercel IPs in MongoDB Atlas
# Or use: 0.0.0.0/0 (allow all - for testing only)
```

## 📱 Mobile App Configuration

If building a mobile app, update API URLs:

```javascript
// In your mobile app config
const API_URL = 'https://your-backend-url.vercel.app/api';
```

## 🔒 Security Checklist

Before deploying to production:

- [ ] All environment variables are set
- [ ] MongoDB Atlas allows Vercel IPs
- [ ] Auth0 callback URLs updated with Vercel domain
- [ ] CORS configured with production frontend URL
- [ ] JWT secret is strong and unique
- [ ] Email credentials are app-specific passwords
- [ ] Cloudinary API keys are production keys
- [ ] Remove any console.logs with sensitive data
- [ ] Enable HTTPS only (Vercel does this automatically)

## 🎯 Post-Deployment Steps

1. **Test All Features:**
   - Authentication flow
   - API endpoints
   - File uploads
   - Email notifications
   - Payment processing (if applicable)

2. **Update Auth0 URLs:**
   - Add Vercel URLs to allowed callbacks
   - Update logout redirect URLs
   - Update CORS origins

3. **Monitor Performance:**
   - Check Vercel Analytics
   - Review function execution times
   - Monitor error logs

4. **Setup Custom Domain (Optional):**
   ```bash
   vercel domains add yourdomain.com
   ```

## 📈 Vercel Features

Your deployment includes:

- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Automatic scaling
- ✅ Edge caching
- ✅ Analytics dashboard
- ✅ Function logs
- ✅ Preview deployments
- ✅ Rollback capability

## 💡 Best Practices

1. **Use Preview Deployments:**
   - Test changes in preview before merging to main

2. **Environment Variables:**
   - Use different values for development/production
   - Never commit `.env` files

3. **Database:**
   - Use MongoDB Atlas for production
   - Enable connection pooling

4. **File Uploads:**
   - Use Cloudinary (Vercel has file size limits)
   - Don't store files in serverless functions

5. **API Rate Limiting:**
   - Implement rate limiting for production
   - Use API keys for sensitive endpoints

## 🆘 Support

- **Vercel Documentation:** [vercel.com/docs](https://vercel.com/docs)
- **Vercel Discord:** [vercel.com/discord](https://vercel.com/discord)
- **Project Issues:** [GitHub Issues](https://github.com/Piyumal-Bandaranayake/WILD-LANKA-GO/issues)

## 📝 Deployment Checklist

- [ ] Vercel account created
- [ ] GitHub repository connected
- [ ] Environment variables configured
- [ ] Build succeeds locally
- [ ] MongoDB Atlas configured
- [ ] Auth0 settings updated
- [ ] Deploy script executed successfully
- [ ] Production URL tested
- [ ] All features verified
- [ ] Team notified of deployment

---

**🎉 Happy Deploying!**

*Last Updated: November 22, 2025*
