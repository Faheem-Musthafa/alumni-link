import React from 'react';
import { cn } from '@/lib/utils';
import { UserAvatar } from './user-avatar';
import { RoleBadge } from './role-based-gradient';
import { ActionButton, IconButton } from './action-button';
import { type Role } from '@/lib/design-system';
import { MapPin, Briefcase, GraduationCap, MessageCircle, UserPlus, CheckCircle } from 'lucide-react';

interface MentorCardProps {
  mentor: {
    id: string;
    name: string;
    photoURL?: string;
    role: Role;
    verified?: boolean;
    title?: string;
    company?: string;
    location?: string;
    education?: string;
    bio?: string;
    skills?: string[];
    availability?: 'available' | 'busy' | 'unavailable';
  };
  onConnect?: (mentorId: string) => void;
  onMessage?: (mentorId: string) => void;
  isConnected?: boolean;
  className?: string;
  variant?: 'default' | 'compact';
}

/**
 * MentorCard Component
 * 
 * Enhanced mentor card with hover effects, quick actions, and role badge
 * 
 * @example
 * ```tsx
 * <MentorCard
 *   mentor={{
 *     id: '1',
 *     name: 'John Doe',
 *     role: 'alumni',
 *     title: 'Senior Engineer',
 *     company: 'Google',
 *     verified: true,
 *   }}
 *   onConnect={handleConnect}
 *   onMessage={handleMessage}
 * />
 * ```
 */
export function MentorCard({
  mentor,
  onConnect,
  onMessage,
  isConnected = false,
  className,
  variant = 'default',
}: MentorCardProps) {
  const availabilityConfig = {
    available: {
      color: 'bg-emerald-500',
      label: 'Available',
    },
    busy: {
      color: 'bg-amber-500',
      label: 'Busy',
    },
    unavailable: {
      color: 'bg-red-500',
      label: 'Unavailable',
    },
  };

  const availability = mentor.availability
    ? availabilityConfig[mentor.availability]
    : null;

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center gap-4 p-4 rounded-lg border border-neutral-200 bg-white',
          'transition-all duration-200 hover:shadow-md hover:border-neutral-300',
          className
        )}
      >
        <div className="relative">
          <UserAvatar
            name={mentor.name}
            src={mentor.photoURL}
            size="lg"
            verified={mentor.verified}
          />
          {availability && (
            <span
              className={cn(
                'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white',
                availability.color
              )}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-neutral-900 truncate">
              {mentor.name}
            </h3>
            <RoleBadge role={mentor.role} size="sm" />
          </div>
          {mentor.title && (
            <p className="text-sm text-neutral-600 truncate">
              {mentor.title}
              {mentor.company && ` at ${mentor.company}`}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onMessage && (
            <IconButton
              variant="ghost"
              size="sm"
              onClick={() => onMessage(mentor.id)}
              title="Send message"
            >
              <MessageCircle />
            </IconButton>
          )}
          {onConnect && !isConnected && (
            <ActionButton
              variant="primary"
              size="sm"
              onClick={() => onConnect(mentor.id)}
            >
              Connect
            </ActionButton>
          )}
          {isConnected && (
            <span className="flex items-center gap-1 text-sm text-emerald-600">
              <CheckCircle className="w-4 h-4" />
              Connected
            </span>
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
      {/* Card Content */}
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="relative">
            <UserAvatar
              name={mentor.name}
              src={mentor.photoURL}
              size="xl"
              verified={mentor.verified}
            />
            {availability && (
              <span
                className={cn(
                  'absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white',
                  availability.color
                )}
                title={availability.label}
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                  {mentor.name}
                </h3>
                <RoleBadge role={mentor.role} size="sm" />
              </div>
            </div>

            {mentor.title && (
              <div className="flex items-center gap-2 text-sm text-neutral-600 mb-1">
                <Briefcase className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {mentor.title}
                  {mentor.company && ` at ${mentor.company}`}
                </span>
              </div>
            )}

            {mentor.education && (
              <div className="flex items-center gap-2 text-sm text-neutral-600 mb-1">
                <GraduationCap className="w-4 h-4 shrink-0" />
                <span className="truncate">{mentor.education}</span>
              </div>
            )}

            {mentor.location && (
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <MapPin className="w-4 h-4 shrink-0" />
                <span className="truncate">{mentor.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {mentor.bio && (
          <p className="text-sm text-neutral-600 line-clamp-3">
            {mentor.bio}
          </p>
        )}

        {/* Skills */}
        {mentor.skills && mentor.skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {mentor.skills.slice(0, 4).map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs font-medium bg-neutral-100 text-neutral-700 rounded-full"
              >
                {skill}
              </span>
            ))}
            {mentor.skills.length > 4 && (
              <span className="px-2 py-1 text-xs font-medium text-neutral-500">
                +{mentor.skills.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          {isConnected ? (
            <>
              <ActionButton
                variant="primary"
                size="sm"
                fullWidth
                icon={<MessageCircle />}
                onClick={() => onMessage?.(mentor.id)}
              >
                Message
              </ActionButton>
              <span className="flex items-center gap-1 text-xs text-emerald-600 whitespace-nowrap">
                <CheckCircle className="w-4 h-4" />
                Connected
              </span>
            </>
          ) : (
            <>
              <ActionButton
                variant="primary"
                size="sm"
                fullWidth
                icon={<UserPlus />}
                onClick={() => onConnect?.(mentor.id)}
              >
                Connect
              </ActionButton>
              {onMessage && (
                <IconButton
                  variant="outline"
                  size="sm"
                  onClick={() => onMessage(mentor.id)}
                  title="Send message"
                >
                  <MessageCircle />
                </IconButton>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * MentorCardGrid Component
 * 
 * Grid layout for displaying multiple mentor cards
 * 
 * @example
 * ```tsx
 * <MentorCardGrid>
 *   {mentors.map(mentor => (
 *     <MentorCard key={mentor.id} mentor={mentor} />
 *   ))}
 * </MentorCardGrid>
 * ```
 */
export function MentorCardGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6', className)}>
      {children}
    </div>
  );
}
