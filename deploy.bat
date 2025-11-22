@echo off
REM WILD LANKA GO - Vercel Deployment Script for Windows
echo.
echo ========================================
echo  WILD LANKA GO - Vercel Deployment
echo ========================================
echo.

REM Check if Vercel CLI is installed
where vercel >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Vercel CLI not found. Installing...
    call npm install -g vercel
)

REM Install backend dependencies
echo [INFO] Installing backend dependencies...
cd backend
call npm install
cd ..

REM Install frontend dependencies
echo [INFO] Installing frontend dependencies...
cd frontend
call npm install
cd ..

REM Build frontend
echo [INFO] Building frontend...
cd frontend
call npm run build
cd ..

REM Deploy to Vercel
echo [INFO] Deploying to Vercel...
call vercel --prod

echo.
echo ========================================
echo  Deployment Complete!
echo ========================================
echo.
echo IMPORTANT: Set these environment variables in Vercel dashboard:
echo   - MONGODB_URI
echo   - AUTH0_DOMAIN
echo   - AUTH0_AUDIENCE
echo   - AUTH0_ISSUER
echo   - JWT_SECRET
echo   - CLOUDINARY_CLOUD_NAME
echo   - CLOUDINARY_API_KEY
echo   - CLOUDINARY_API_SECRET
echo   - EMAIL_HOST
echo   - EMAIL_PORT
echo   - EMAIL_USER
echo   - EMAIL_PASSWORD
echo   - FRONTEND_URL
echo   - VITE_API_URL
echo   - VITE_AUTH0_DOMAIN
echo   - VITE_AUTH0_CLIENT_ID
echo   - VITE_AUTH0_AUDIENCE
echo.
pause
