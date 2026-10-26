// [Person 1 – auth] Validation rules for the Register form. Returns { fieldName: 'error text' };
// an empty object means the form is valid. auth-realtime-service checks the same rules again.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{10}$/;

export default function validateRegister(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Name is required';
  if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Enter a valid email';
  if (form.password.length < 6) errors.password = 'At least 6 characters';
  if (!PHONE_PATTERN.test(form.phone)) errors.phone = 'Enter a valid 10-digit phone number';
  if (!form.role) errors.role = 'Choose a role';
  return errors;
}
