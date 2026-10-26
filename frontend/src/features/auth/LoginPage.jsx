// [Person 1 – auth] Login page: email + password (validated), plus one-click demo accounts for the presentation.
// On success, authSlice stores the JWT and we go to the live map.
import { useState } from 'react';
import { Alert, Box, Button, Divider, Stack, TextField, Typography } from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import { Link as RouterLink, Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AuthLayout from './AuthLayout';
import { loginUser } from './authSlice';

const DEMO_ACCOUNTS = [
  { label: 'Citizen', email: 'citizen@floodlink.in', icon: PersonIcon },
  { label: 'Volunteer', email: 'volunteer@floodlink.in', icon: VolunteerActivismIcon },
  { label: 'Admin', email: 'admin@floodlink.in', icon: AdminPanelSettingsIcon },
];

// Both fields are required; the message appears under the field that's wrong
function validateLogin(form) {
  const errors = {};
  if (!form.email.trim()) errors.email = 'Email is required';
  if (!form.password) errors.password = 'Password is required';
  return errors;
}

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const { token, status, error } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  if (token) return <Navigate to="/" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validateLogin(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    const result = await dispatch(loginUser({ ...form, email: form.email.trim() }));
    if (loginUser.fulfilled.match(result)) navigate('/');
  }

  const updateField = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to see live requests and help where it matters most.">
      <Stack component="form" spacing={2} onSubmit={handleSubmit} noValidate>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={updateField}
          error={Boolean(errors.email)} helperText={errors.email} required fullWidth />
        <TextField label="Password" name="password" type="password" autoComplete="current-password" value={form.password}
          onChange={updateField} error={Boolean(errors.password)} helperText={errors.password} required fullWidth />
        <Button type="submit" variant="contained" size="large" disabled={status === 'loading'}>
          {status === 'loading' ? 'Logging in...' : 'Log in'}
        </Button>
        <Typography variant="body2" color="text.secondary">
          New here? <Box component={RouterLink} to="/register" sx={{ color: 'primary.main' }}>Create an account</Box>
        </Typography>
      </Stack>
      <Divider sx={{ my: 3, fontSize: 12, color: 'text.secondary' }}>Demo accounts (password demo123)</Divider>
      {/* Fills the form; you still press "Log in", so the audience sees a normal login */}
      <Stack direction="row" spacing={1}>
        {DEMO_ACCOUNTS.map((account) => (
          <Button key={account.email} variant="outlined" color="inherit" fullWidth
            onClick={() => setForm({ email: account.email, password: 'demo123' })}
            sx={{ flexDirection: 'column', py: 1.25, gap: 0.5, borderColor: 'divider' }}>
            <account.icon fontSize="small" />
            <Typography variant="caption" fontWeight={600}>{account.label}</Typography>
          </Button>
        ))}
      </Stack>
    </AuthLayout>
  );
}
