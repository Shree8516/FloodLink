// [Person 2 – requests] "Ask for help" as 3 short steps: 1. what happened (big type tiles, description, people,
// with Person 3's live suggestion and priority preview), 2. where (GPS or tap the map, plus the address),
// 3. contact details and a quick review. Each step is validated before moving on; then the request is POSTed to
// request-service, which runs the insights check and broadcasts it live. Offline, it goes into the offline queue.
import { useState } from 'react';
import { Box, Button, Paper, Stack, Step, StepLabel, Stepper, TextField, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import SuggestionPanel from '../insights/SuggestionPanel';
import LocationPicker from './LocationPicker';
import PostSuccess from './PostSuccess';
import { createHelpRequest, OFFLINE_QUEUED } from './requestsSlice';
import { TYPE_LABELS } from './requestConstants';
import TypeTiles from './TypeTiles';
import validateRequest, { STEP_FIELDS, validateStep } from './validateRequest';

const STEPS = ['What happened', 'Where', 'Contact and send'];
const MAX_DESCRIPTION = 500;

// Contact details default to the logged-in user, since people usually ask for themselves
function emptyForm(user) {
  return {
    type: 'RESCUE', description: '', address: '', peopleCount: '1',
    contactName: user.name, contactPhone: user.phone || '', location: null,
  };
}

// Converts the form into the exact JSON shape request-service expects (see CONTRACT.md)
function toPayload(form) {
  return {
    type: form.type,
    description: form.description.trim(),
    address: form.address.trim(),
    peopleCount: Number(form.peopleCount),
    contactName: form.contactName.trim(),
    contactPhone: form.contactPhone,
    latitude: form.location.latitude,
    longitude: form.location.longitude,
  };
}

function ReviewRow({ label, value }) {
  return (
    <Stack direction="row" spacing={2}>
      <Typography variant="body2" color="text.secondary" sx={{ width: 90, flexShrink: 0 }}>{label}</Typography>
      <Typography variant="body2">{value}</Typography>
    </Stack>
  );
}

export default function PostRequestPage() {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(() => emptyForm(user));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  // After sending: { saved: HelpRequest } or { queued: true }
  const [result, setResult] = useState(null);

  const setField = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const fieldProps = (name) => ({
    name,
    value: form[name],
    onChange: (event) => setField(name, event.target.value),
    error: Boolean(errors[name]),
    helperText: errors[name],
    fullWidth: true,
    required: true,
  });

  function goNext() {
    const stepErrors = validateStep(step, form);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length === 0) setStep(step + 1);
  }

  async function send() {
    const allErrors = validateRequest(form);
    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) {
      // Jump back to the first step that still has a problem
      setStep(STEP_FIELDS.findIndex((fields) => fields.some((field) => allErrors[field])));
      return;
    }
    setSubmitting(true);
    try {
      setResult({ saved: await dispatch(createHelpRequest(toPayload(form))).unwrap() });
    } catch (message) {
      if (message === OFFLINE_QUEUED) setResult({ queued: true });
      else enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  function startOver() {
    setResult(null);
    setForm(emptyForm(user));
    setErrors({});
    setStep(0);
  }

  if (result) return <PostSuccess result={result} onPostAnother={startOver} />;

  return (
    <Box sx={{ maxWidth: 760, mx: 'auto', px: 2, py: { xs: 2, md: 4 } }}>
      <Typography variant="h5">Ask for help</Typography>
      <Typography color="text.secondary">Three quick steps. Volunteers see your request the moment you send it.</Typography>
      <Stepper activeStep={step} alternativeLabel sx={{ my: 3 }}>
        {STEPS.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
      </Stepper>

      {/* Enter moves to the next step, and on the last step it sends */}
      <Paper variant="elevation" component="form" noValidate sx={{ p: { xs: 2, sm: 3 } }}
        onSubmit={(event) => {
          event.preventDefault();
          if (step < STEPS.length - 1) goNext(); else send();
        }}>
        {step === 0 && (
          <Stack spacing={2.5}>
            <TypeTiles value={form.type} onChange={(type) => setField('type', type)} />
            <TextField label="What is happening?" multiline minRows={3} autoFocus
              placeholder="e.g. Elderly couple trapped on first floor, water rising" {...fieldProps('description')}
              helperText={errors.description || `${form.description.length}/${MAX_DESCRIPTION}`}
              inputProps={{ maxLength: MAX_DESCRIPTION }} />
            <SuggestionPanel description={form.description} type={form.type} peopleCount={form.peopleCount}
              onUseType={(type) => setField('type', type)} />
            <TextField label="How many people need help?" type="number" inputProps={{ min: 1, max: 1000 }}
              {...fieldProps('peopleCount')} sx={{ maxWidth: 260 }} />
          </Stack>
        )}

        {step === 1 && (
          <Stack spacing={2.5}>
            <LocationPicker value={form.location} onChange={(location) => setField('location', location)}
              error={errors.location} type={form.type} />
            <TextField label="Address (street, area)" placeholder="e.g. Gandhi Road, Velachery" {...fieldProps('address')}
              helperText={errors.address || 'End with the area name, e.g. "..., Velachery". It groups requests by area.'} />
          </Stack>
        )}

        {step === 2 && (
          <Stack spacing={2.5}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Contact name" autoComplete="name" {...fieldProps('contactName')} />
              <TextField label="Contact phone (10 digits)" autoComplete="tel" inputProps={{ inputMode: 'numeric', maxLength: 10 }}
                {...fieldProps('contactPhone')} />
            </Stack>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(148, 163, 184, 0.06)' }}>
              <Typography variant="overline" color="text.secondary">Check before sending</Typography>
              <Stack spacing={0.75} sx={{ mt: 1 }}>
                <ReviewRow label="Help" value={TYPE_LABELS[form.type]} />
                <ReviewRow label="Situation" value={form.description} />
                <ReviewRow label="People" value={form.peopleCount} />
                <ReviewRow label="Address" value={form.address} />
              </Stack>
            </Box>
          </Stack>
        )}

        <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
          {step > 0 && (
            <Button startIcon={<ArrowBackIcon />} onClick={() => { setErrors({}); setStep(step - 1); }} disabled={submitting}>
              Back
            </Button>
          )}
          <Box sx={{ flexGrow: 1 }} />
          {step < STEPS.length - 1 ? (
            <Button type="submit" variant="contained" size="large" endIcon={<ArrowForwardIcon />}>Next</Button>
          ) : (
            <Button type="submit" variant="contained" color="error" size="large" disabled={submitting} sx={{ px: 4 }}>
              {submitting ? 'Sending...' : 'Send help request'}
            </Button>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}
