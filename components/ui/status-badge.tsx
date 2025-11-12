import React from 'react';
import { cn } from '@/lib/utils';
import { getSemanticColor, type SemanticType } from '@/lib/design-system';
import { CheckCircle2, XCircle, AlertCircle, Info, Clock } from 'lucide-react';

export type StatusVariant = 
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'info' 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'active'
  | 'inactive'
  | 'draft';

interface StatusBadgeProps {
  variant: StatusVariant;
  children?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  dot?: boolean;
}

/**
 * StatusBadge Component
 * 
 * Enhanced badge component with status variants and icons
 * 
 * @example
 * ```tsx
 * <StatusBadge variant="success" showIcon>Approved</StatusBadge>
 * <StatusBadge variant="pending" dot>Pending Review</StatusBadge>
 * ```
 */
export function StatusBadge({
  variant,
  children,
  className,
  size = 'md',
  showIcon = false,
  dot = false,
}: StatusBadgeProps) {
  // Map variants to semantic types and styles
  const variantConfig = {
    success: {
      styles: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2,
      dotColor: 'bg-emerald-500',
    },
    approved: {
      styles: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2,
      dotColor: 'bg-emerald-500',
    },
    error: {
      styles: 'bg-red-50 text-red-700 border-red-200',
      icon: XCircle,
      dotColor: 'bg-red-500',
    },
    rejected: {
      styles: 'bg-red-50 text-red-700 border-red-200',
      icon: XCircle,
      dotColor: 'bg-red-500',
    },
    warning: {
      styles: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: AlertCircle,
      dotColor: 'bg-amber-500',
    },
    info: {
      styles: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Info,
      dotColor: 'bg-blue-500',
    },
    pending: {
      styles: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      icon: Clock,
      dotColor: 'bg-yellow-500',
    },
    active: {
      styles: 'bg-green-50 text-green-700 border-green-200',
      icon: CheckCircle2,
      dotColor: 'bg-green-500',
    },
    inactive: {
      styles: 'bg-gray-50 text-gray-700 border-gray-200',
      icon: XCircle,
      dotColor: 'bg-gray-500',
    },
    draft: {
      styles: 'bg-slate-50 text-slate-700 border-slate-200',
      icon: Info,
      dotColor: 'bg-slate-500',
    },
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  // Size styles
  const sizeStyles = {
    sm: {
      badge: 'px-2 py-0.5 text-xs',
      icon: 'w-3 h-3',
      dot: 'w-1.5 h-1.5',
    },
    md: {
      badge: 'px-2.5 py-1 text-sm',
      icon: 'w-4 h-4',
      dot: 'w-2 h-2',
    },
    lg: {
      badge: 'px-3 py-1.5 text-base',
      icon: 'w-5 h-5',
      dot: 'w-2.5 h-2.5',
    },
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full border',
        'transition-colors duration-200',
        config.styles,
        sizeStyles[size].badge,
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'rounded-full animate-pulse',
            config.dotColor,
            sizeStyles[size].dot
          )}
        />
      )}
      {showIcon && <Icon className={cn(sizeStyles[size].icon)} />}
      {children}
    </span>
  );
}

/**
 * StatusIndicator Component
 * 
 * Simple status indicator with just a colored dot and label
 * 
 * @example
 * ```tsx
 * <StatusIndicator variant="success">Online</StatusIndicator>
 * ```
 */
export function StatusIndicator({
  variant,
  children,
  className,
  pulse = false,
}: {
  variant: StatusVariant;
  children: React.ReactNode;
  className?: string;
  pulse?: boolean;
}) {
  const variantConfig = {
    success: 'bg-emerald-500',
    approved: 'bg-emerald-500',
    error: 'bg-red-500',
    rejected: 'bg-red-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500',
    pending: 'bg-yellow-500',
    active: 'bg-green-500',
    inactive: 'bg-gray-400',
    draft: 'bg-slate-400',
  };

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <span
        className={cn(
          'w-2 h-2 rounded-full',
          variantConfig[variant],
          pulse && 'animate-pulse'
        )}
      />
      <span className="text-sm text-neutral-700">{children}</span>
    </div>
  );
}

/**
 * StatusPill Component
 * 
 * Pill-shaped status indicator without border
 * 
 * @example
 * ```tsx
 * <StatusPill variant="pending">Under Review</StatusPill>
 * ```
 */
export function StatusPill({
  variant,
  children,
  className,
  size = 'md',
}: {
  variant: StatusVariant;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const variantConfig = {
    success: 'bg-emerald-100 text-emerald-800',
    approved: 'bg-emerald-100 text-emerald-800',
    error: 'bg-red-100 text-red-800',
    rejected: 'bg-red-100 text-red-800',
    warning: 'bg-amber-100 text-amber-800',
    info: 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    draft: 'bg-slate-100 text-slate-800',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full',
        variantConfig[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
}
