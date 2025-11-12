import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
  gradient?: boolean;
}

/**
 * PageHeader Component
 * 
 * Consistent page header with title, description, breadcrumbs, and action buttons
 * 
 * @example
 * ```tsx
 * <PageHeader
 *   title="Job Postings"
 *   description="Browse and apply to job opportunities"
 *   breadcrumbs={[
 *     { label: 'Dashboard', href: '/dashboard' },
 *     { label: 'Jobs' }
 *   ]}
 *   actions={
 *     <ActionButton variant="primary" icon={<PlusIcon />}>
 *       Create Job
 *     </ActionButton>
 *   }
 * />
 * ```
 */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
  gradient = false,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'space-y-4 pb-6 border-b border-neutral-200',
        gradient && 'bg-linear-to-r from-blue-50 to-indigo-50 -mx-6 px-6 py-6 rounded-lg mb-6',
        className
      )}
    >
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center space-x-2 text-sm" aria-label="Breadcrumb">
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              )}
              {item.href || item.onClick ? (
                <a
                  href={item.href}
                  onClick={item.onClick}
                  className="text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  {item.label}
                </a>
              ) : (
                <span className="text-neutral-900 font-medium">
                  {item.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Header Content */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-base text-neutral-600 max-w-3xl">
              {description}
            </p>
          )}
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * SectionHeader Component
 * 
 * Smaller header for sections within a page
 * 
 * @example
 * ```tsx
 * <SectionHeader
 *   title="Recent Activity"
 *   description="Your latest interactions"
 *   action={<Button variant="ghost" size="sm">View All</Button>}
 * />
 * ```
 */
export function SectionHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-4', className)}>
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-neutral-900">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-neutral-600">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}

/**
 * PageSection Component
 * 
 * Wrapper for page sections with consistent spacing
 * 
 * @example
 * ```tsx
 * <PageSection>
 *   <SectionHeader title="Recent Posts" />
 *   <PostsList />
 * </PageSection>
 * ```
 */
export function PageSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('space-y-4', className)}>
      {children}
    </section>
  );
}

/**
 * PageContainer Component
 * 
 * Main container for page content with consistent padding and max-width
 * 
 * @example
 * ```tsx
 * <PageContainer>
 *   <PageHeader title="Dashboard" />
 *   <PageSection>
 *     <Content />
 *   </PageSection>
 * </PageContainer>
 * ```
 */
export function PageContainer({
  children,
  className,
  maxWidth = '7xl',
}: {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'full' | '7xl' | '6xl' | '5xl' | '4xl';
}) {
  const maxWidthClasses = {
    full: 'max-w-full',
    '7xl': 'max-w-7xl',
    '6xl': 'max-w-6xl',
    '5xl': 'max-w-5xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div className={cn('mx-auto px-4 sm:px-6 lg:px-8 py-8', maxWidthClasses[maxWidth], className)}>
      {children}
    </div>
  );
}
