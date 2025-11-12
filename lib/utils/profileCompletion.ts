import { UserProfile } from "@/types";

export interface ProfileCompletionResult {
  percentage: number;
  missingFields: string[];
  completedFields: string[];
}

/**
 * Calculate profile completion percentage based on required and optional fields
 */
export function calculateProfileCompletion(profile: UserProfile | null): ProfileCompletionResult {
  if (!profile) {
    return {
      percentage: 0,
      missingFields: [
        "College",
        "College Email",
        "Graduation Year",
        "Course",
        "Bio",
        "Skills",
      ],
      completedFields: [],
    };
  }

  const requiredFields = [
    { key: "college", label: "College", value: profile.college },
    { key: "collegeEmail", label: "College Email", value: profile.collegeEmail },
    { key: "graduationYear", label: "Graduation Year", value: profile.graduationYear },
    { key: "course", label: "Course", value: profile.course },
    { key: "bio", label: "Bio", value: profile.bio },
    { key: "skills", label: "Skills", value: profile.skills?.length ? profile.skills : null },
  ];

  const optionalFields = [
    { key: "specialization", label: "Specialization", value: profile.specialization },
    { key: "currentCompany", label: "Current Company", value: profile.currentCompany },
    { key: "jobTitle", label: "Job Title", value: profile.jobTitle },
    { key: "experience", label: "Experience", value: profile.experience },
    { key: "location", label: "Location", value: profile.location },
    { key: "interests", label: "Interests", value: profile.interests?.length ? profile.interests : null },
    { key: "linkedIn", label: "LinkedIn", value: profile.linkedIn },
    { key: "github", label: "GitHub", value: profile.github },
    { key: "portfolio", label: "Portfolio", value: profile.portfolio },
  ];

  const completedRequired = requiredFields.filter((field) => {
    if (Array.isArray(field.value)) {
      return field.value.length > 0;
    }
    return field.value !== null && field.value !== undefined && field.value !== "";
  });

  const completedOptional = optionalFields.filter((field) => {
    if (Array.isArray(field.value)) {
      return field.value.length > 0;
    }
    return field.value !== null && field.value !== undefined && field.value !== "";
  });

  // Required fields are worth 70% of total completion
  // Optional fields are worth 30% of total completion
  const requiredPercentage = (completedRequired.length / requiredFields.length) * 70;
  const optionalPercentage = (completedOptional.length / optionalFields.length) * 30;
  const totalPercentage = Math.round(requiredPercentage + optionalPercentage);

  const missingFields = [
    ...requiredFields.filter((field) => {
      if (Array.isArray(field.value)) {
        return !field.value || field.value.length === 0;
      }
      return !field.value;
    }).map((field) => field.label),
    ...optionalFields.filter((field) => {
      if (Array.isArray(field.value)) {
        return !field.value || field.value.length === 0;
      }
      return !field.value;
    }).map((field) => field.label + " (Optional)"),
  ];

  const completedFields = [
    ...completedRequired.map((field) => field.label),
    ...completedOptional.map((field) => field.label),
  ];

  return {
    percentage: totalPercentage,
    missingFields,
    completedFields,
  };
}

/**
 * Get a color class based on completion percentage
 */
export function getCompletionColor(percentage: number): string {
  if (percentage >= 80) return "text-green-600";
  if (percentage >= 50) return "text-yellow-600";
  return "text-red-600";
}

/**
 * Get a background color class for progress bar based on completion percentage
 */
export function getCompletionBgColor(percentage: number): string {
  if (percentage >= 80) return "bg-green-600";
  if (percentage >= 50) return "bg-yellow-600";
  return "bg-red-600";
}

/**
 * Get a message based on completion percentage
 */
export function getCompletionMessage(percentage: number): string {
  if (percentage === 100) return "Your profile is complete!";
  if (percentage >= 80) return "Almost there! Just a few more details.";
  if (percentage >= 50) return "Good progress! Keep filling out your profile.";
  if (percentage >= 25) return "Let's add more information to your profile.";
  return "Complete your profile to get started.";
}
