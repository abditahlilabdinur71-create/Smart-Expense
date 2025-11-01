import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg'; // Added size prop
  children: React.ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md', // Default size
  children,
  className = '',
  ...props
}) => {
  let baseStyles = 'rounded-lg font-semibold transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  switch (variant) {
    case 'primary':
      baseStyles += ' bg-primary text-white hover:bg-secondary focus:ring-primary';
      break;
    case 'secondary':
      baseStyles += ' bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400';
      break;
    case 'danger':
      baseStyles += ' bg-danger text-white hover:bg-red-600 focus:ring-danger';
      break;
  }

  switch (size) {
    case 'sm':
      baseStyles += ' px-3 py-1 text-sm';
      break;
    case 'md':
      baseStyles += ' px-4 py-2';
      break;
    case 'lg':
      baseStyles += ' px-6 py-3 text-lg';
      break;
  }

  return (
    <button className={`${baseStyles} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;