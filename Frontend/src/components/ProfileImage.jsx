import React, { useState, useEffect } from 'react';

const ProfileImage = ({ 
  src, 
  alt, 
  className = "w-24 h-24 rounded-full border-4 border-green-600",
  fallbackText = null,
  useProxy = true 
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageSrc, setImageSrc] = useState(src);
  const [retryCount, setRetryCount] = useState(0);

  // Generate initials from name for fallback
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Check if URL needs proxying (Google images, etc.)
  const needsProxy = (url) => {
    if (!url || !useProxy) return false;
    const problematicDomains = [
      'lh3.googleusercontent.com',
      'lh4.googleusercontent.com',
      'lh5.googleusercontent.com',
      'lh6.googleusercontent.com'
    ];
    return problematicDomains.some(domain => url.includes(domain));
  };

  // Get proxied URL
  const getProxiedUrl = (originalUrl) => {
    if (!needsProxy(originalUrl)) return originalUrl;
    return `http://localhost:5001/api/profile-image/proxy?url=${encodeURIComponent(originalUrl)}`;
  };

  useEffect(() => {
    if (src) {
      setImageSrc(getProxiedUrl(src));
      setImageError(false);
      setIsLoading(true);
      setRetryCount(0);
    }
  }, [src]);

  const handleImageError = () => {
    console.log('🖼️ Image load failed:', imageSrc);
    
    // If we're using proxy and it failed, try original URL
    if (retryCount === 0 && needsProxy(src)) {
      console.log('🔄 Retrying with original URL...');
      setRetryCount(1);
      setImageSrc(src);
      return;
    }
    
    // If original URL also failed, show fallback
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    console.log('✅ Image loaded successfully:', imageSrc);
    setIsLoading(false);
    setImageError(false);
  };

  // If image failed to load or no src provided, show fallback
  if (imageError || !src) {
    const initials = getInitials(fallbackText || alt);
    
    return (
      <div 
        className={`${className} bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold`}
        title={alt}
        style={{ fontSize: className.includes('w-8') ? '0.75rem' : '1.125rem' }}
      >
        {initials}
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div 
          className={`absolute inset-0 ${className} bg-gray-200 animate-pulse flex items-center justify-center z-10`}
        >
          <svg 
            className={`text-gray-400 ${className.includes('w-8') ? 'w-4 h-4' : 'w-8 h-8'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      )}
      <img
        src={imageSrc}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onError={handleImageError}
        onLoad={handleImageLoad}
        loading="lazy"
      />
    </div>
  );
};

export default ProfileImage;
