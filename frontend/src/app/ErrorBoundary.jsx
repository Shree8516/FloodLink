// [Person 1 – app shell] Catches JavaScript errors anywhere in the component tree below it and shows a friendly
// message instead of a blank white page. Wraps the whole app in main.jsx.
//
// CLASS vs FUNCTIONAL components:
// - Every other component in this app is a FUNCTIONAL component: a plain function that returns JSX and uses
//   hooks (useState, useEffect) for state and side effects. That's the modern, shorter style.
// - This one is a CLASS component: it extends React.Component, keeps state in this.state, and uses lifecycle
//   methods. Error boundaries MUST be classes, because the two methods that catch render errors
//   (getDerivedStateFromError and componentDidCatch) have no hook equivalent.
import React from 'react';
import { Alert, Box, Button } from '@mui/material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  // Called during rendering when a child throws: switch to the fallback UI
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  // Called after the error: a good place to log it (a real app would send it to a monitoring service)
  componentDidCatch(error, errorInfo) {
    console.error('UI crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            Something went wrong on this screen. Your data is safe on the server.
          </Alert>
          <Button variant="contained" onClick={() => window.location.assign('/')}>
            Reload FloodLink
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
