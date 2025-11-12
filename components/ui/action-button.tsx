import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children: React.ReactNode;
}

/**
 * ActionButton Component
 * 
 * Enhanced button component with loading states, icons, and multiple variants
 * 
 * @example
 * ```tsx
 * <ActionButton 
 *   variant="primary" 
 *   size="md" 
 *   loading={isLoading}
 *   icon={<PlusIcon />}
 *   onClick={handleSubmit}
 * >
 *   Create Post
 * </ActionButton>
 * ```
 */
export function ActionButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className,
  disabled,
  children,
  ...props
}: ActionButtonProps) {
  // Variant styles
  const variantStyles = {
    primary: 
      'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 ' +
      'shadow-sm hover:shadow-md disabled:bg-blue-300',
    secondary: 
      'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 active:bg-neutral-300 ' +
      'disabled:bg-neutral-50 disabled:text-neutral-400',
    outline: 
      'border-2 border-neutral-300 text-neutral-700 hover:bg-neutral-50 ' +
      'hover:border-neutral-400 active:bg-neutral-100 disabled:border-neutral-200 disabled:text-neutral-400',
    ghost: 
      'text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200 ' +
      'disabled:text-neutral-400',
    danger: 
      'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 ' +
      'shadow-sm hover:shadow-md disabled:bg-red-300',
    success: 
      'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 ' +
      'shadow-sm hover:shadow-md disabled:bg-emerald-300',
  };

  // Size styles
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2.5',
    xl: 'px-8 py-4 text-xl gap-3',
  };

  // Icon size mapping
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      className={cn(
        // Base styles
        'inline-flex items-center justify-center font-medium rounded-lg',
        'transition-all duration-200 ease-in-out',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
        'disabled:cursor-not-allowed disabled:opacity-60',
        // Variant and size
        variantStyles[variant],
        sizeStyles[size],
        // Full width
        fullWidth && 'w-full',
        // Custom className
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {/* Loading Spinner */}
      {loading && (
        <Loader2 className={cn('animate-spin', iconSizes[size])} />
      )}

      {/* Left Icon */}
      {!loading && icon && iconPosition === 'left' && (
        <span className={iconSizes[size]}>{icon}</span>
      )}

      {/* Button Text */}
      <span>
        {loading && loadingText ? loadingText : children}
      </span>

      {/* Right Icon */}
      {!loading && icon && iconPosition === 'right' && (
        <span className={iconSizes[size]}>{icon}</span>
      )}
    </button>
  );
}

/**
 * IconButton Component
 * 
 * Button with only an icon, no text
 * 
 * @example
 * ```tsx
 * <IconButton variant="ghost" size="sm" onClick={handleDelete}>
 *   <TrashIcon />
 * </IconButton>
 * ```
 */
export function IconButton({
  variant = 'ghost',
  size = 'md',
  loading = false,
  children,
  className,
  disabled,
  ...props
}: Omit<ActionButtonProps, 'icon' | 'iconPosition' | 'loadingText'>) {
  const variantStyles = {
    primary: 
      'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 ' +
      'disabled:bg-blue-300',
    secondary: 
      'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 active:bg-neutral-300 ' +
      'disabled:bg-neutral-50 disabled:text-neutral-400',
    outline: 
      'border-2 border-neutral-300 text-neutral-700 hover:bg-neutral-50 ' +
      'hover:border-neutral-400 active:bg-neutral-100 disabled:border-neutral-200 disabled:text-neutral-400',
    ghost: 
      'text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200 ' +
      'disabled:text-neutral-400',
    danger: 
      'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 ' +
      'disabled:bg-red-300',
    success: 
      'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 ' +
      'disabled:bg-emerald-300',
  };

  const sizeStyles = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
    xl: 'p-4',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      className={cn(
        // Base styles
        'inline-flex items-center justify-center rounded-lg',
        'transition-all duration-200 ease-in-out',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
        'disabled:cursor-not-allowed disabled:opacity-60',
        // Variant and size
        variantStyles[variant],
        sizeStyles[size],
        // Custom className
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <Loader2 className={cn('animate-spin', iconSizes[size])} />
      ) : (
        <span className={iconSizes[size]}>{children}</span>
      )}
    </button>
  );
}

/**
 * ButtonGroup Component
 * 
 * Group multiple buttons together with proper spacing
 * 
 * @example
 * ```tsx
 * <ButtonGroup>
 *   <ActionButton variant="outline">Cancel</ActionButton>
 *   <ActionButton variant="primary">Save</ActionButton>
 * </ButtonGroup>
 * ```
 */
export function ButtonGroup({
  children,
  className,
  orientation = 'horizontal',
}: {
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}) {
  return (
    <div
      className={cn(
        'inline-flex',
        orientation === 'horizontal' ? 'flex-row gap-2' : 'flex-col gap-2',
        className
      )}
    >
      {children}
    </div>
  );
}
