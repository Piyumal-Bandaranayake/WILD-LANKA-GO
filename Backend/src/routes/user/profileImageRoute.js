import express from 'express';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create cache directory if it doesn't exist
const cacheDir = path.join(__dirname, '../../../cache/profile-images');
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

// Cache duration: 24 hours
const CACHE_DURATION = 24 * 60 * 60 * 1000;

// Generate cache key from URL
const getCacheKey = (url) => {
  return crypto.createHash('md5').update(url).digest('hex');
};

// Check if cached file is still valid
const isCacheValid = (filePath) => {
  try {
    const stats = fs.statSync(filePath);
    const now = Date.now();
    const fileAge = now - stats.mtime.getTime();
    return fileAge < CACHE_DURATION;
  } catch (error) {
    return false;
  }
};

// Proxy and cache profile images
router.get('/proxy', async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ message: 'URL parameter is required' });
  }

  // Validate URL (only allow certain domains for security)
  const allowedDomains = [
    'lh3.googleusercontent.com',
    's.gravatar.com',
    'avatars.githubusercontent.com',
    'cdn.auth0.com'
  ];
  
  let urlObj;
  try {
    urlObj = new URL(url);
  } catch (error) {
    return res.status(400).json({ message: 'Invalid URL' });
  }

  if (!allowedDomains.includes(urlObj.hostname)) {
    return res.status(403).json({ message: 'Domain not allowed' });
  }

  const cacheKey = getCacheKey(url);
  const cacheFile = path.join(cacheDir, `${cacheKey}.jpg`);
  const metaFile = path.join(cacheDir, `${cacheKey}.meta`);

  // Check if we have a valid cached version
  if (fs.existsSync(cacheFile) && fs.existsSync(metaFile) && isCacheValid(cacheFile)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
      res.set('Content-Type', meta.contentType || 'image/jpeg');
      res.set('Cache-Control', 'public, max-age=86400'); // 24 hours
      res.set('X-Cache', 'HIT');
      return res.sendFile(cacheFile);
    } catch (error) {
      console.error('Error reading cached file:', error);
    }
  }

  // Fetch from original URL
  try {
    console.log('🔄 Fetching profile image from:', urlObj.hostname);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'WildLankaGo/1.0 (Profile Image Proxy)',
        'Accept': 'image/*',
      },
      timeout: 10000, // 10 second timeout
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch image:', response.status, response.statusText);
      return res.status(response.status).json({ 
        message: 'Failed to fetch image',
        status: response.status 
      });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.buffer();

    // Save to cache
    try {
      fs.writeFileSync(cacheFile, buffer);
      fs.writeFileSync(metaFile, JSON.stringify({
        contentType,
        originalUrl: url,
        cachedAt: new Date().toISOString(),
      }));
      console.log('✅ Image cached successfully');
    } catch (cacheError) {
      console.error('⚠️ Failed to cache image:', cacheError);
    }

    // Send response
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=86400'); // 24 hours
    res.set('X-Cache', 'MISS');
    res.send(buffer);

  } catch (error) {
    console.error('❌ Error proxying image:', error);
    
    if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({ 
        message: 'Image service temporarily unavailable',
        error: 'NETWORK_ERROR' 
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to proxy image',
      error: error.message 
    });
  }
});

// Clean up old cache files
router.post('/cleanup-cache', (req, res) => {
  try {
    const files = fs.readdirSync(cacheDir);
    let deletedCount = 0;
    
    files.forEach(file => {
      const filePath = path.join(cacheDir, file);
      if (!isCacheValid(filePath)) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    });
    
    res.json({ 
      message: 'Cache cleanup completed',
      deletedFiles: deletedCount 
    });
  } catch (error) {
    console.error('Cache cleanup error:', error);
    res.status(500).json({ 
      message: 'Cache cleanup failed',
      error: error.message 
    });
  }
});

export default router;