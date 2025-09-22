import React from 'react';

/**
 * Responsive container component for consistent responsive behavior
 */
const ResponsiveContainer = ({ 
  children, 
  className = "",
  breakpoint = "md", // sm, md, lg, xl
  mobileLayout = "stack", // stack, scroll, hide
  ...props 
}) => {
  const breakpointClasses = {
    sm: 'sm:block',
    md: 'md:block', 
    lg: 'lg:block',
    xl: 'xl:block'
  };

  const mobileClasses = {
    stack: 'block',
    scroll: 'overflow-x-auto',
    hide: 'hidden'
  };

  return (
    <div 
      className={`${mobileClasses[mobileLayout]} ${breakpointClasses[breakpoint]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default ResponsiveContainer;