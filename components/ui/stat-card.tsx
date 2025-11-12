import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export type TrendDirection = 'up' | 'down' | 'neutral';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    direction: TrendDirection;
    label?: string;
  };
  description?: string;
  className?: string;
  variant?: 'default' | 'gradient';
  iconColor?: string;
  onClick?: () => void;
}

/**
 * StatCard Component
 * 
 * Dashboard statistics card with icon, value, label, and trend indicator
 * 
 * @example
 * ```tsx
 * <StatCard
 *   title="Total Users"
 *   value={1234}
 *   icon={Users}
 *   trend={{ value: 12, direction: 'up', label: 'vs last month' }}
 *   description="Active users on platform"
 *   iconColor="text-blue-500"
 * />
 * ```
 */
export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  className,
  variant = 'default',
  iconColor = 'text-blue-500',
  onClick,
}: StatCardProps) {
  const isClickable = !!onClick;

  const trendConfig = {
    up: {
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      icon: TrendingUp,
    },
    down: {
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      icon: TrendingDown,
    },
    neutral: {
      color: 'text-neutral-600',
      bgColor: 'bg-neutral-50',
      icon: Minus,
    },
  };

  const trendStyle = trend ? trendConfig[trend.direction] : null;
  const TrendIcon = trendStyle?.icon;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border border-neutral-200 bg-white p-6',
        'transition-all duration-200',
        variant === 'gradient' && 'bg-linear-to-br from-white to-neutral-50',
        isClickable && 'cursor-pointer hover:shadow-md hover:border-neutral-300',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        {/* Content */}
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium text-neutral-600">
            {title}
          </p>
          <p className="text-3xl font-bold text-neutral-900 tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>

          {/* Trend Indicator */}
          {trend && trendStyle && TrendIcon && (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
                  trendStyle.bgColor,
                  trendStyle.color
                )}
              >
                <TrendIcon className="w-3 h-3" />
                {trend.value}%
              </span>
              {trend.label && (
                <span className="text-xs text-neutral-500">
                  {trend.label}
                </span>
              )}
            </div>
          )}

          {/* Description */}
          {description && (
            <p className="text-sm text-neutral-500">
              {description}
            </p>
          )}
        </div>

        {/* Icon */}
        {Icon && (
          <div className={cn('p-3 rounded-lg bg-neutral-50', iconColor)}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * StatCardGrid Component
 * 
 * Grid layout for displaying multiple stat cards
 * 
 * @example
 * ```tsx
 * <StatCardGrid>
 *   <StatCard title="Users" value={100} />
 *   <StatCard title="Posts" value={250} />
 *   <StatCard title="Jobs" value={45} />
 * </StatCardGrid>
 * ```
 */
export function StatCardGrid({
  children,
  className,
  columns = 4,
}: {
  children: React.ReactNode;
  className?: string;
  columns?: 1 | 2 | 3 | 4;
}) {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', columnClasses[columns], className)}>
      {children}
    </div>
  );
}

/**
 * SimpleStatCard Component
 * 
 * Simplified stat card without icon or trend
 * 
 * @example
 * ```tsx
 * <SimpleStatCard label="Total Revenue" value="$12,345" />
 * ```
 */
export function SimpleStatCard({
  label,
  value,
  className,
  onClick,
}: {
  label: string;
  value: string | number;
  className?: string;
  onClick?: () => void;
}) {
  const isClickable = !!onClick;

  return (
    <div
      className={cn(
        'rounded-lg border border-neutral-200 bg-white p-4',
        'transition-all duration-200',
        isClickable && 'cursor-pointer hover:shadow-md hover:border-neutral-300',
        className
      )}
      onClick={onClick}
    >
      <p className="text-sm font-medium text-neutral-600 mb-1">
        {label}
      </p>
      <p className="text-2xl font-bold text-neutral-900">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

/**
 * CompactStatCard Component
 * 
 * Very compact stat card for dense layouts
 * 
 * @example
 * ```tsx
 * <CompactStatCard label="Views" value={1234} icon={Eye} />
 * ```
 */
export function CompactStatCard({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3',
        className
      )}
    >
      {Icon && (
        <div className="p-2 rounded-lg bg-neutral-50">
          <Icon className="w-4 h-4 text-neutral-600" />
        </div>
      )}
      <div className="flex-1">
        <p className="text-xs text-neutral-600">
          {label}
        </p>
        <p className="text-lg font-bold text-neutral-900">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      </div>
    </div>
  );
}
