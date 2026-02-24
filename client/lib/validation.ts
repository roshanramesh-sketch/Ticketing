/**
 * Client-side validation utilities
 */

export interface PasswordValidationResult {
    isValid: boolean;
    errors: string[];
}

/**
 * Validate password against security requirements:
 * - At least 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 special character
 * - Cannot contain the email prefix (part before @)
 */
export const validatePassword = (
    password: string,
    email?: string
): PasswordValidationResult => {
    const errors: string[] = [];

    if (password.length < 8) {
        errors.push("At least 8 characters");
    }

    if (!/[A-Z]/.test(password)) {
        errors.push("At least 1 uppercase letter");
    }

    if (!/[a-z]/.test(password)) {
        errors.push("At least 1 lowercase letter");
    }

    if (!/[!@#$%^&*(),.?":{}|<>_\-+=[\]\\;'`~/]/.test(password)) {
        errors.push("At least 1 special character (!@#$%^&* etc.)");
    }

    if (email) {
        const emailPrefix = email.split("@")[0].toLowerCase();
        if (emailPrefix.length >= 3 && password.toLowerCase().includes(emailPrefix)) {
            errors.push("Cannot contain your email address");
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
