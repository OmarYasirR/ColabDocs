// src/components/common/Button.jsx
import { forwardRef } from 'react';
import { FiLoader } from 'react-icons/fi';
import { cx } from '../../utils/helpers';

export const VARIANT_CLASSES = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500',
  secondary:
    'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus-visible:ring-slate-400',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-400',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500',
};

const SIZE_CLASSES = {
  sm: 'px-2.5 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
};

const Button = forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      isLoading = false,
      disabled = false,
      icon: Icon = null,
      iconPosition = 'left',
      className = '',
      type = 'button',
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={cx(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-60',
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          fullWidth && 'w-full',
          className
        )}
        {...rest}
      >
        {isLoading ? (
          <FiLoader className="h-4 w-4 animate-spin" />
        ) : (
          Icon && iconPosition === 'left' && <Icon className="h-4 w-4" />
        )}
        {children && <span>{children}</span>}
        {!isLoading && Icon && iconPosition === 'right' && <Icon className="h-4 w-4" />}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;