export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^[6-9]\d{9}$/;
export const URL_REGEX = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

export interface ValidationRule {
  validate: (value: any) => boolean;
  message: string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateField(
  value: any,
  rules: ValidationRule[]
): string | null {
  for (const rule of rules) {
    if (!rule.validate(value)) {
      return rule.message;
    }
  }
  return null;
}

export function validateForm(
  data: Record<string, any>,
  schema: ValidationSchema
): ValidationResult {
  const errors: Record<string, string> = {};
  
  for (const [field, rules] of Object.entries(schema)) {
    const error = validateField(data[field], rules);
    if (error) {
      errors[field] = error;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Common validation rules
export const required = (message = "This field is required"): ValidationRule => ({
  validate: (value) => {
    if (typeof value === "string") return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return value != null;
  },
  message,
});

export const minLength = (min: number, message?: string): ValidationRule => ({
  validate: (value) => {
    if (typeof value === "string") return value.length >= min;
    if (Array.isArray(value)) return value.length >= min;
    return false;
  },
  message: message || `Must be at least ${min} characters`,
});

export const maxLength = (max: number, message?: string): ValidationRule => ({
  validate: (value) => {
    if (typeof value === "string") return value.length <= max;
    if (Array.isArray(value)) return value.length <= max;
    return false;
  },
  message: message || `Must be at most ${max} characters`,
});

export const email = (message = "Invalid email address"): ValidationRule => ({
  validate: (value) => {
    if (typeof value !== "string") return false;
    return EMAIL_REGEX.test(value);
  },
  message,
});

export const phone = (message = "Invalid phone number"): ValidationRule => ({
  validate: (value) => {
    if (typeof value !== "string") return false;
    return PHONE_REGEX.test(value.replace(/\s/g, ""));
  },
  message,
});

export const url = (message = "Invalid URL"): ValidationRule => ({
  validate: (value) => {
    if (typeof value !== "string") return false;
    return URL_REGEX.test(value);
  },
  message,
});

export const oneOf = (values: any[], message?: string): ValidationRule => ({
  validate: (value) => values.includes(value),
  message: message || `Must be one of: ${values.join(", ")}`,
});

export const custom = (
  validator: (value: any) => boolean,
  message: string
): ValidationRule => ({
  validate: validator,
  message,
});
