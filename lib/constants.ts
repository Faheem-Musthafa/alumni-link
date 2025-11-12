export const USER_ROLES = {
  STUDENT: "student",
  ALUMNI: "alumni",
  ASPIRANT: "aspirant",
  MENTOR: "mentor",
  ADMIN: "admin",
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const VERIFICATION_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export type VerificationStatus = typeof VERIFICATION_STATUS[keyof typeof VERIFICATION_STATUS];

export const MENTORSHIP_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type MentorshipStatus = typeof MENTORSHIP_STATUS[keyof typeof MENTORSHIP_STATUS];

export const JOB_APPLICATION_STATUS = {
  PENDING: "pending",
  REVIEWED: "reviewed",
  SHORTLISTED: "shortlisted",
  REJECTED: "rejected",
  ACCEPTED: "accepted",
} as const;

export type JobApplicationStatus = typeof JOB_APPLICATION_STATUS[keyof typeof JOB_APPLICATION_STATUS];

export const FIRESTORE_COLLECTIONS = {
  USERS: "users",
  PROFILES: "profiles",
  MENTORSHIP_REQUESTS: "mentorshipRequests",
  JOB_POSTINGS: "jobPostings",
  JOB_APPLICATIONS: "jobApplications",
  VERIFICATION_REQUESTS: "verificationRequests",
  USER_REPORTS: "userReports",
  ADMIN_ACTIVITY_LOGS: "adminActivityLogs",
} as const;

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  DASHBOARD: "/dashboard",
  PROFILE: "/profile",
  SETTINGS: "/settings",
  MENTORSHIP: "/mentorship",
  JOBS: "/jobs",
  JOBS_CREATE: "/jobs/create",
  JOBS_MY_POSTS: "/jobs/my-posts",
  JOBS_MY_APPLICATIONS: "/jobs/my-applications",
  CHAT: "/chat",
  USERS: "/users",
  ONBOARDING: "/onboarding",
  ADMIN: "/admin",
  ADMIN_USERS: "/admin/users",
  ADMIN_VERIFICATIONS: "/admin/verifications",
  ADMIN_REPORTS: "/admin/reports",
  ADMIN_POSTS: "/admin/posts",
  ADMIN_ACTIVITY_LOGS: "/admin/activity-logs",
} as const;

export const PROFILE_COMPLETION_FIELDS = [
  "bio",
  "location",
  "college",
  "course",
  "graduationYear",
  "skills",
  "linkedIn",
] as const;

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/jpg"];
export const ALLOWED_DOCUMENT_TYPES = ["application/pdf", "image/jpeg", "image/png"];
