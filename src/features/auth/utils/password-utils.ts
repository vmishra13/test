/**
 * Validates password strength based on security requirements
 * @param password The password to validate
 * @returns boolean indicating if password meets requirements
 */
export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  // Password must be at least 8 characters
  if (password.length < 8) {
    return { 
      valid: false,
      message: 'Password must be at least 8 characters long'
    };
  }

  // Password must contain at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one uppercase letter'
    };
  }

  // Password must contain at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one lowercase letter'
    };
  }

  // Password must contain at least one number
  if (!/\d/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one number'
    };
  }

  // Password must contain at least one special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one special character'
    };
  }

  return { valid: true };
};

/**
 * Generates a secure random password
 * @returns A secure random password
 */
export const generateSecurePassword = (): string => {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  // Ensure it meets our validation requirements
  const validation = validatePassword(password);
  return validation.valid ? password : generateSecurePassword();
};