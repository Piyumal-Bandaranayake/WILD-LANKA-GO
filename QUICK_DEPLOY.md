# 🚀 Quick Deployment Guide

Complete workflow to deploy WILD LANKA GO to Vercel.

## 📋 Pre-Deployment Checklist

- [ ] MongoDB Atlas database created and accessible
- [ ] Cloudinary account set up with API keys
- [ ] Auth0 application configured
- [ ] Gmail App Password generated (for emails)
- [ ] Vercel account created
- [ ] Git repository up to date

---

## 1️⃣ Commit Deployment Configuration

First, commit all deployment files to your repository:

```bash
# Stage all deployment files
git add vercel.json frontend/vercel.json backend/vercel.json backend/api/index.js deploy.sh deploy.bat DEPLOYMENT.md QUICK_DEPLOY.md .vercelignore README.md

# Commit with descriptive message
git commit -m "Add Vercel deployment configuration and scripts"

# Push to GitHub
git push origin main
```

---

## 2️⃣ Deploy Using Script (Recommended)

### Windows

```powershell
.\deploy.bat
```

### Unix/Linux/macOS

```bash
chmod +x deploy.sh
./deploy.sh
```

The script will:
1. ✅ Check for required files
2. ✅ Install dependencies
3. ✅ Build frontend
4. ✅ Deploy to Vercel
5. ✅ Provide post-deployment checklist

---

## 3️⃣ Manual Deployment (Alternative)

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

Follow the browser prompt to authenticate.

### Step 3: Deploy

From project root directory:

```bash
vercel
```

Answer the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your account
- **Link to existing project?** → No (first time) / Yes (subsequent)
- **What's your project's name?** → wild-lanka-go
- **In which directory is your code located?** → ./

### Step 4: Deploy to Production

```bash
vercel --prod
```

---

## 4️⃣ Configure Environment Variables

### Via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **wild-lanka-go**
3. Navigate to **Settings** → **Environment Variables**
4. Add the following variables:

#### Backend Environment Variables

| Variable | Example Value | Required |
|----------|---------------|----------|
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/wildlankago` | ✅ |
| `JWT_SECRET` | `your-super-secret-jwt-key-min-32-chars` | ✅ |
| `CLOUDINARY_CLOUD_NAME` | `your-cloud-name` | ✅ |
| `CLOUDINARY_API_KEY` | `123456789012345` | ✅ |
| `CLOUDINARY_API_SECRET` | `your-cloudinary-secret` | ✅ |
| `AUTH0_DOMAIN` | `your-domain.auth0.com` | ✅ |
| `AUTH0_CLIENT_ID` | `your-auth0-client-id` | ✅ |
| `AUTH0_CLIENT_SECRET` | `your-auth0-client-secret` | ✅ |
| `AUTH0_AUDIENCE` | `https://your-api-audience` | ✅ |
| `EMAIL_HOST` | `smtp.gmail.com` | ✅ |
| `EMAIL_PORT` | `587` | ✅ |
| `EMAIL_USER` | `your-email@gmail.com` | ✅ |
| `EMAIL_PASSWORD` | `your-app-specific-password` | ✅ |
| `NODE_ENV` | `production` | ✅ |
| `PORT` | `5000` | ⚠️ |
| `FRONTEND_URL` | `https://your-app.vercel.app` | ✅ |

#### Frontend Environment Variables

| Variable | Example Value | Required |
|----------|---------------|----------|
| `VITE_API_URL` | `https://your-app.vercel.app/api` | ✅ |
| `VITE_AUTH0_DOMAIN` | `your-domain.auth0.com` | ✅ |
| `VITE_AUTH0_CLIENT_ID` | `your-auth0-client-id` | ✅ |
| `VITE_AUTH0_AUDIENCE` | `https://your-api-audience` | ✅ |
| `VITE_CLOUDINARY_CLOUD_NAME` | `your-cloud-name` | ⚠️ |

### Via Vercel CLI

```bash
# Add environment variable
vercel env add MONGODB_URI

# Paste your MongoDB URI when prompted
# Select: Production, Preview, Development (all)

# Repeat for each variable
```

### Using .env Template

```bash
# Copy the template
cp .env.example .env.production

# Edit with your production values
# Then manually add each to Vercel dashboard
```

---

## 5️⃣ Update Auth0 Configuration

### Add Vercel URLs to Auth0

1. Go to [Auth0 Dashboard](https://manage.auth0.com/)
2. Navigate to **Applications** → Your Application
3. Update the following:

**Allowed Callback URLs:**
```
https://your-app.vercel.app/callback,
https://your-app.vercel.app
```

**Allowed Logout URLs:**
```
https://your-app.vercel.app/
```

**Allowed Web Origins:**
```
https://your-app.vercel.app
```

**Allowed Origins (CORS):**
```
https://your-app.vercel.app
```

4. Click **Save Changes**

---

## 6️⃣ Configure MongoDB Atlas

### Whitelist Vercel IP Addresses

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Navigate to **Network Access**
3. Click **Add IP Address**
4. Select **Allow Access from Anywhere** (0.0.0.0/0)
   - Or add Vercel's specific IP ranges if you prefer

⚠️ **Note:** Vercel uses dynamic IPs, so "Allow Access from Anywhere" is recommended for serverless deployments.

---

## 7️⃣ Test Deployment

### Automated Testing

```bash
# Test frontend
curl https://your-app.vercel.app

# Test backend health endpoint
curl https://your-app.vercel.app/api/health

# Test API with authentication
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Manual Testing Checklist

Frontend:
- [ ] Homepage loads correctly
- [ ] User registration works
- [ ] User login works
- [ ] Dashboard displays data
- [ ] Image uploads work
- [ ] All routes are accessible
- [ ] Mobile responsive design works

Backend:
- [ ] API responds to requests
- [ ] Database connection successful
- [ ] Authentication flow works
- [ ] File uploads to Cloudinary work
- [ ] Email notifications send
- [ ] CORS configured properly

### View Deployment Logs

```bash
# View recent logs
vercel logs

# View logs for specific deployment
vercel logs [deployment-url]

# Follow logs in real-time
vercel logs --follow
```

Or view in Vercel Dashboard:
1. Go to your project
2. Click **Deployments**
3. Select a deployment
4. Click **View Function Logs**

---

## 8️⃣ Redeploy After Changes

### Automatic Deployment

Vercel automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

### Manual Redeploy

```bash
# Redeploy to production
vercel --prod

# Or redeploy latest
vercel --force
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. 500 Internal Server Error

**Cause:** Missing or incorrect environment variables

**Solution:**
```bash
# Verify all environment variables are set
vercel env ls

# Add missing variables
vercel env add VARIABLE_NAME
```

#### 2. Database Connection Failed

**Cause:** MongoDB Atlas IP whitelist or incorrect URI

**Solution:**
- Check Network Access in MongoDB Atlas
- Verify MONGODB_URI format
- Ensure database user has proper permissions

#### 3. CORS Errors

**Cause:** Frontend URL not in CORS configuration

**Solution:**
- Update backend CORS settings in `backend/server.js`
- Add Vercel URL to allowed origins
- Redeploy

#### 4. Static Files Not Loading

**Cause:** Incorrect build output directory

**Solution:**
- Verify `frontend/vercel.json` has correct `outputDirectory`
- Check build logs for errors
- Ensure `vite build` completes successfully

#### 5. API Routes 404

**Cause:** Vercel routing not configured properly

**Solution:**
- Check root `vercel.json` routing configuration
- Ensure `backend/api/index.js` exports app correctly
- Verify `backend/vercel.json` points to correct entry point

### Debug Commands

```bash
# Check Vercel CLI version
vercel --version

# List all deployments
vercel list

# View project settings
vercel inspect

# Remove failed deployment
vercel rm [deployment-url]
```

---

## 🎯 Post-Deployment Tasks

- [ ] Test all user flows (registration, login, booking, etc.)
- [ ] Verify email notifications are sending
- [ ] Check image uploads to Cloudinary
- [ ] Monitor error logs for 24 hours
- [ ] Set up custom domain (optional)
- [ ] Configure SSL certificate (auto-configured by Vercel)
- [ ] Set up monitoring/alerting (Vercel Analytics)
- [ ] Share deployment URL with team
- [ ] Update documentation with production URL
- [ ] Create backup of environment variables

---

## 📊 Monitoring & Maintenance

### View Analytics

```bash
vercel analytics
```

Or in dashboard: Project → Analytics

### Performance Monitoring

- **Response Time:** Check function execution time
- **Error Rate:** Monitor 4xx/5xx errors
- **Traffic:** View request volume

### Update Dependencies

```bash
# Check for updates
npm outdated

# Update packages
npm update

# Test locally
npm run dev

# Deploy updates
git add package.json package-lock.json
git commit -m "Update dependencies"
git push origin main
```

---

## 🔐 Security Best Practices

- ✅ Never commit `.env` files
- ✅ Use strong JWT secrets (min 32 characters)
- ✅ Rotate API keys regularly
- ✅ Enable MongoDB Atlas audit logs
- ✅ Use HTTPS only (enforced by Vercel)
- ✅ Implement rate limiting
- ✅ Keep dependencies updated
- ✅ Monitor security vulnerabilities

---

## 🆘 Get Help

**Vercel Support:**
- Documentation: https://vercel.com/docs
- Community: https://github.com/vercel/vercel/discussions
- Support: support@vercel.com

**Project Issues:**
- GitHub Issues: https://github.com/Piyumal-Bandaranayake/WILD-LANKA-GO/issues
- Email: [your-email@example.com]

---

## 📝 Deployment Workflow Summary

```
1. Commit deployment files → Git
2. Push to GitHub → Triggers Vercel
3. Configure environment variables → Vercel Dashboard
4. Update Auth0 URLs → Auth0 Dashboard
5. Whitelist IPs → MongoDB Atlas
6. Test deployment → Manual + Automated
7. Monitor logs → Vercel Dashboard
8. Deploy updates → Git push
```

---

**🎉 Congratulations! Your MERN stack app is now live on Vercel!**

Visit: `https://your-app.vercel.app`

---

*For detailed troubleshooting and advanced configuration, see [DEPLOYMENT.md](DEPLOYMENT.md)*
