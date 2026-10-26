// [Person 1 – auth] Registration page: create a CITIZEN or VOLUNTEER account. Validates every field before
// calling auth-realtime-service, which hashes the password with bcrypt and returns a JWT straight away.
import { useState } from 'react';
import { Alert, Box, Button, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import { Link as RouterLink, Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AuthLayout from './AuthLayout';
import { registerUser } from './authSlice';
import validateRegister from './validateRegister';

const EMPTY_FORM = { name: '', email: '', password: '', phone: '', role: 'CITIZEN' };

const ROLE_CHOICES = [
  { value: 'CITIZEN', label: 'I need help', icon: PersonIcon },
  { value: 'VOLUNTEER', label: 'I want to help', icon: VolunteerActivismIcon },
];

export default function RegisterPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const { token, status, error } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  if (token) return <Navigate to="/" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validateRegister(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    const result = await dispatch(registerUser({ ...form, email: form.email.trim() }));
    if (registerUser.fulfilled.match(result)) navigate('/');
  }

  const updateField = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  // Shared props so every TextField shows its own validation message
  const fieldProps = (name) => ({
    name,
    value: form[name],
    onChange: updateField,
    error: Boolean(errors[name]),
    helperText: errors[name],
    fullWidth: true,
    required: true,
  });

  return (
    <AuthLayout title="Create an account" subtitle="Takes a minute. Volunteers can claim requests right away.">
      <Stack component="form" spacing={2} onSubmit={handleSubmit} noValidate>
        {error && <Alert severity="error">{error}</Alert>}
        {/* Two big choices instead of a dropdown: the most important question on this form */}
        <ToggleButtonGroup exclusive fullWidth value={form.role}
          onChange={(event, role) => role && setForm({ ...form, role })} aria-label="I am a">
          {ROLE_CHOICES.map((choice) => (
            <ToggleButton key={choice.value} value={choice.value} sx={{ py: 1.25, gap: 1, textTransform: 'none' }}>
              <choice.icon fontSize="small" /> {choice.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <TextField label="Full name" autoComplete="name" {...fieldProps('name')} />
        <TextField label="Email" type="email" autoComplete="email" {...fieldProps('email')} />
        <TextField label="Password (6+ characters)" type="password" autoComplete="new-password" {...fieldProps('password')} />
        <TextField label="Phone (10 digits)" autoComplete="tel" inputProps={{ inputMode: 'numeric', maxLength: 10 }} {...fieldProps('phone')} />
        <Button type="submit" variant="contained" size="large" disabled={status === 'loading'}>
          {status === 'loading' ? 'Creating...' : 'Create account'}
        </Button>
        <Typography variant="body2" color="text.secondary">
          Already registered? <Box component={RouterLink} to="/login" sx={{ color: 'primary.main' }}>Log in</Box>
        </Typography>
      </Stack>
    </AuthLayout>
  );
}
