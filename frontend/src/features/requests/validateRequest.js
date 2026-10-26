// [Person 2 – requests] Validation rules for the Post Request form. Returns { fieldName: 'error text' };
// an empty object means the form is valid. request-service checks the same rules again (never trust the browser).
// The form has 3 steps, and validateStep() checks only the fields of the current step before moving on.

const PHONE_PATTERN = /^\d{10}$/;

// Which fields each step of the form asks for
export const STEP_FIELDS = [
  ['type', 'description', 'peopleCount'],
  ['location', 'address'],
  ['contactName', 'contactPhone'],
];

export default function validateRequest(form) {
  const errors = {};
  const people = Number(form.peopleCount);
  if (!form.type) errors.type = 'Choose the kind of help needed';
  if (!form.description.trim()) errors.description = 'Describe the situation';
  if (form.description.length > 500) errors.description = 'Keep it under 500 characters';
  if (!form.address.trim()) errors.address = 'Address is required';
  if (!Number.isInteger(people) || people < 1 || people > 1000) errors.peopleCount = 'Enter a number from 1 to 1000';
  if (!form.contactName.trim()) errors.contactName = 'Contact name is required';
  if (!PHONE_PATTERN.test(form.contactPhone)) errors.contactPhone = 'Enter a valid 10-digit phone number';
  if (form.location === null) errors.location = 'Tap the map or use your location to mark where help is needed';
  return errors;
}

export function validateStep(step, form) {
  const allErrors = validateRequest(form);
  return Object.fromEntries(Object.entries(allErrors).filter(([field]) => STEP_FIELDS[step].includes(field)));
}
