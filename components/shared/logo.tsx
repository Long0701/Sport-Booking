import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
}

export default function Logo({ className = "", showText = true, size = 'md', variant = 'dark' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl'
  };

  const textColorClasses = {
    dark: 'bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 bg-clip-text text-transparent',
    light: 'bg-gradient-to-r from-white via-emerald-100 to-white bg-clip-text text-transparent'
  };

  const subtitleColorClasses = {
    dark: 'text-gray-500',
    light: 'text-emerald-200'
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="relative group">
        {/* Logo Background with Gradient */}
        <div className={`${sizeClasses[size]} bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105 flex items-center justify-center relative overflow-hidden`}>
          {/* Animated shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-pulse"></div>
          
          {/* SVG Logo */}
          <svg
            className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : 'w-10 h-10'} text-white relative z-10`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            {/* Stadium/Court Icon */}
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
            <circle cx="12" cy="12" r="2"/>
            {/* Additional decorative elements */}
            <path d="M12 1L13.09 8.26L20 7L13.09 15.74L12 23L10.91 15.74L4 17L10.91 8.26L12 1Z" opacity="0.3"/>
          </svg>
        </div>
        
        {/* Floating dots animation */}
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-60"></div>
        <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping opacity-40" style={{ animationDelay: '0.5s' }}></div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={`${textSizeClasses[size]} font-bold ${textColorClasses[variant]}`}>
            SportBooking
          </span>
          {size === 'lg' && (
            <span className={`text-xs ${subtitleColorClasses[variant]} -mt-1 tracking-wide`}>
              Smart Court Booking
            </span>
          )}
        </div>
      )}
    </div>
  );
}
