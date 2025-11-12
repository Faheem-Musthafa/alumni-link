import React from 'react';
import { cn } from '@/lib/utils';
import { getRoleGradient, type Role } from '@/lib/design-system';

interface RoleBasedGradientProps {
  role: Role;
  children?: React.ReactNode;
  className?: string;
  variant?: 'solid' | 'subtle' | 'border';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  as?: 'div' | 'section' | 'article' | 'header';
}

/**
 * RoleBasedGradient Component
 * 
 * Provides role-specific visual identity with gradient backgrounds
 * 
 * @example
 * ```tsx
 * <RoleBasedGradient role="student" variant="solid" rounded="lg">
 *   <h2>Welcome, Student!</h2>
 * </RoleBasedGradient>
 * ```
 */
export function RoleBasedGradient({
  role,
  children,
  className,
  variant = 'solid',
  rounded = 'md',
  as: Component = 'div',
}: RoleBasedGradientProps) {
  const gradient = getRoleGradient(role);

  // Variant styles
  const variantStyles = {
    solid: `bg-linear-to-r ${gradient} text-white`,
    subtle: `bg-linear-to-r ${gradient} opacity-10`,
    border: `border-2 border-transparent bg-linear-to-r ${gradient} bg-clip-text text-transparent`,
  };

  // Rounded styles
  const roundedStyles = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };

  return (
    <Component
      className={cn(
        'transition-all duration-300',
        variantStyles[variant],
        roundedStyles[rounded],
        className
      )}
    >
      {children}
    </Component>
  );
}

/**
 * RoleBadge Component
 * 
 * Small badge displaying user role with gradient background
 * 
 * @example
 * ```tsx
 * <RoleBadge role="alumni" />
 * ```
 */
export function RoleBadge({ 
  role, 
  className,
  size = 'md' 
}: { 
  role: Role; 
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const gradient = getRoleGradient(role);

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const roleLabels = {
    student: 'Student',
    alumni: 'Alumni',
    aspirant: 'Aspirant',
    admin: 'Admin',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        'bg-linear-to-r text-white',
        gradient,
        sizeStyles[size],
        className
      )}
    >
      {roleLabels[role]}
    </span>
  );
}

/**
 * RoleIcon Component
 * 
 * Icon with role-specific gradient background
 * 
 * @example
 * ```tsx
 * <RoleIcon role="student">
 *   <UserIcon className="w-5 h-5" />
 * </RoleIcon>
 * ```
 */
export function RoleIcon({
  role,
  children,
  className,
  size = 'md',
}: {
  role: Role;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const gradient = getRoleGradient(role);

  const sizeStyles = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full',
        'bg-linear-to-r text-white',
        gradient,
        sizeStyles[size],
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * RoleCard Component
 * 
 * Card with role-specific gradient border and hover effect
 * 
 * @example
 * ```tsx
 * <RoleCard role="alumni">
 *   <h3>Alumni Resources</h3>
 *   <p>Exclusive content for alumni</p>
 * </RoleCard>
 * ```
 */
export function RoleCard({
  role,
  children,
  className,
  hover = true,
}: {
  role: Role;
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  const gradient = getRoleGradient(role);

  return (
    <div
      className={cn(
        'relative p-6 bg-white rounded-lg shadow-sm',
        'before:absolute before:inset-0 before:rounded-lg before:p-0.5',
        `before:bg-linear-to-r before:${gradient}`,
        'before:-z-10',
        hover && 'transition-transform duration-200 hover:scale-[1.02] hover:shadow-md',
        className
      )}
    >
      {children}
    </div>
  );
}
