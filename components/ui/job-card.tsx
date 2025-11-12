import React from 'react';
import { cn } from '@/lib/utils';
import { ActionButton, IconButton } from './action-button';
import { StatusBadge } from './status-badge';
import { formatRelativeTime } from '@/lib/utils/date';
import {
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Bookmark,
  ExternalLink,
  Building2,
} from 'lucide-react';

interface JobCardProps {
  job: {
    id: string;
    title: string;
    company: string;
    companyLogo?: string;
    location: string;
    type: 'full-time' | 'part-time' | 'contract' | 'internship';
    salary?: string;
    description?: string;
    skills?: string[];
    postedAt: Date | string;
    status?: 'active' | 'closed' | 'draft';
    applicants?: number;
  };
  onApply?: (jobId: string) => void;
  onBookmark?: (jobId: string) => void;
  onViewDetails?: (jobId: string) => void;
  isBookmarked?: boolean;
  hasApplied?: boolean;
  className?: string;
  variant?: 'default' | 'compact';
}

/**
 * JobCard Component
 * 
 * Job posting card with company logo, quick apply, bookmark, and status
 * 
 * @example
 * ```tsx
 * <JobCard
 *   job={{
 *     id: '1',
 *     title: 'Senior Software Engineer',
 *     company: 'Google',
 *     location: 'Mountain View, CA',
 *     type: 'full-time',
 *     salary: '$120k - $180k',
 *     postedAt: new Date(),
 *   }}
 *   onApply={handleApply}
 *   onBookmark={handleBookmark}
 * />
 * ```
 */
export function JobCard({
  job,
  onApply,
  onBookmark,
  onViewDetails,
  isBookmarked = false,
  hasApplied = false,
  className,
  variant = 'default',
}: JobCardProps) {
  const jobTypeLabels = {
    'full-time': 'Full Time',
    'part-time': 'Part Time',
    'contract': 'Contract',
    'internship': 'Internship',
  };

  const jobTypeColors = {
    'full-time': 'success',
    'part-time': 'info',
    'contract': 'warning',
    'internship': 'pending',
  } as const;

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center gap-4 p-4 rounded-lg border border-neutral-200 bg-white',
          'transition-all duration-200 hover:shadow-md hover:border-neutral-300',
          className
        )}
      >
        {/* Company Logo */}
        {job.companyLogo ? (
          <img
            src={job.companyLogo}
            alt={job.company}
            className="w-12 h-12 rounded-lg object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-neutral-400" />
          </div>
        )}

        {/* Job Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-neutral-900 truncate mb-1">
            {job.title}
          </h3>
          <div className="flex items-center gap-3 text-sm text-neutral-600">
            <span className="truncate">{job.company}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {job.location}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge variant={jobTypeColors[job.type]} size="sm">
            {jobTypeLabels[job.type]}
          </StatusBadge>
          {hasApplied ? (
            <span className="text-sm text-emerald-600 font-medium">
              Applied
            </span>
          ) : (
            <ActionButton
              variant="primary"
              size="sm"
              onClick={() => onApply?.(job.id)}
            >
              Apply
            </ActionButton>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg border border-neutral-200 bg-white',
        'transition-all duration-200 hover:shadow-lg hover:border-neutral-300',
        className
      )}
    >
      {/* Bookmark Button */}
      {onBookmark && (
        <div className="absolute top-4 right-4 z-10">
          <IconButton
            variant="ghost"
            size="sm"
            onClick={() => onBookmark(job.id)}
            className={cn(
              'bg-white shadow-sm',
              isBookmarked && 'text-yellow-500'
            )}
          >
            <Bookmark className={cn(isBookmarked && 'fill-current')} />
          </IconButton>
        </div>
      )}

      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-4">
          {/* Company Logo */}
          {job.companyLogo ? (
            <img
              src={job.companyLogo}
              alt={job.company}
              className="w-16 h-16 rounded-lg object-cover border border-neutral-200"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-neutral-100 flex items-center justify-center border border-neutral-200">
              <Building2 className="w-8 h-8 text-neutral-400" />
            </div>
          )}

          <div className="flex-1 min-w-0 pr-8">
            <h3
              className="text-lg font-semibold text-neutral-900 mb-2 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={() => onViewDetails?.(job.id)}
            >
              {job.title}
            </h3>
            <p className="text-base text-neutral-700 font-medium mb-2">
              {job.company}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-600">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {job.location}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatRelativeTime(new Date(job.postedAt))}
              </span>
              {job.salary && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {job.salary}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {job.description && (
          <p className="text-sm text-neutral-600 line-clamp-2">
            {job.description}
          </p>
        )}

        {/* Skills */}
        {job.skills && job.skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {job.skills.slice(0, 5).map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full"
              >
                {skill}
              </span>
            ))}
            {job.skills.length > 5 && (
              <span className="px-2 py-1 text-xs font-medium text-neutral-500">
                +{job.skills.length - 5} more
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
          <div className="flex items-center gap-2">
            <StatusBadge variant={jobTypeColors[job.type]} size="sm">
              {jobTypeLabels[job.type]}
            </StatusBadge>
            {job.status && (
              <StatusBadge
                variant={
                  job.status === 'active'
                    ? 'success'
                    : job.status === 'closed'
                    ? 'error'
                    : 'draft'
                }
                size="sm"
              >
                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
              </StatusBadge>
            )}
            {job.applicants !== undefined && (
              <span className="text-xs text-neutral-500">
                {job.applicants} applicant{job.applicants !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onViewDetails && (
              <ActionButton
                variant="ghost"
                size="sm"
                icon={<ExternalLink />}
                iconPosition="right"
                onClick={() => onViewDetails(job.id)}
              >
                View Details
              </ActionButton>
            )}
            {hasApplied ? (
              <span className="px-4 py-2 text-sm text-emerald-600 font-medium">
                Applied ✓
              </span>
            ) : (
              onApply && (
                <ActionButton
                  variant="primary"
                  size="sm"
                  onClick={() => onApply(job.id)}
                >
                  Quick Apply
                </ActionButton>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * JobCardGrid Component
 * 
 * Grid layout for displaying multiple job cards
 * 
 * @example
 * ```tsx
 * <JobCardGrid>
 *   {jobs.map(job => (
 *     <JobCard key={job.id} job={job} />
 *   ))}
 * </JobCardGrid>
 * ```
 */
export function JobCardGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-1 gap-4', className)}>
      {children}
    </div>
  );
}
