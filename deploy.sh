#!/bin/bash

# WILD LANKA GO - Vercel Deployment Script
echo "🚀 Starting WILD LANKA GO Deployment to Vercel..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

# Install dependencies
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
cd backend
npm install
cd ..

echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
cd frontend
npm install
cd ..

# Build frontend
echo -e "${YELLOW}🏗️  Building frontend...${NC}"
cd frontend
npm run build
cd ..

# Deploy to Vercel
echo -e "${GREEN}🌐 Deploying to Vercel...${NC}"
vercel --prod

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${YELLOW}📝 Don't forget to set environment variables in Vercel dashboard:${NC}"
echo -e "   - MONGODB_URI"
echo -e "   - AUTH0_DOMAIN"
echo -e "   - AUTH0_AUDIENCE"
echo -e "   - AUTH0_ISSUER"
echo -e "   - JWT_SECRET"
echo -e "   - CLOUDINARY_CLOUD_NAME"
echo -e "   - CLOUDINARY_API_KEY"
echo -e "   - CLOUDINARY_API_SECRET"
echo -e "   - EMAIL_HOST"
echo -e "   - EMAIL_PORT"
echo -e "   - EMAIL_USER"
echo -e "   - EMAIL_PASSWORD"
echo -e "   - FRONTEND_URL"
