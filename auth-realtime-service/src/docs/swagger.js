// OpenAPI (Swagger) description of auth-realtime-service, shown at http://localhost:5000/api-docs by swagger-ui-express.
// Written by hand as a plain object so there's no extra tooling to explain.
const bearerSecurity = [{ bearerAuth: [] }];

const errorResponse = {
  description: 'Error',
  content: { 'application/json': { example: { status: 401, error: 'Unauthorized', message: 'Please log in (missing token)' } } },
};

const authResponseExample = {
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  user: { id: '6650a1f2c3d4e5f6a7b8c9d0', name: 'Priya', email: 'volunteer@floodlink.in', phone: '9000000002', role: 'VOLUNTEER' },
};

const jsonBody = (example) => ({ required: true, content: { 'application/json': { example } } });
const jsonResponse = (description, example) => ({ description, content: { 'application/json': { example } } });

module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'FloodLink auth-realtime-service API',
    version: 'v1',
    description: 'Users, login and JWT issuing; Socket.io broadcasts; activity log; volunteer presence. '
      + 'Socket events sent to browsers: request:created, request:claimed, request:resolved, request:updated, request:deleted, '
      + 'request:merged, activity:created, presence:changed. Volunteers send presence:update { latitude, longitude } and presence:stop.',
  },
  servers: [{ url: 'http://localhost:5000' }],
  components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
  paths: {
    '/api/v1/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Create a CITIZEN or VOLUNTEER account and get a JWT',
        requestBody: jsonBody({ name: 'Kavya', email: 'kavya@example.com', password: 'demo123', phone: '9876543210', role: 'CITIZEN' }),
        responses: { 201: jsonResponse('Registered', authResponseExample), 400: errorResponse, 409: errorResponse },
      },
    },
    '/api/v1/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in and get a JWT',
        requestBody: jsonBody({ email: 'volunteer@floodlink.in', password: 'demo123' }),
        responses: { 200: jsonResponse('Logged in', authResponseExample), 401: errorResponse },
      },
    },
    '/api/v1/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'The logged-in user',
        security: bearerSecurity,
        responses: { 200: jsonResponse('OK', authResponseExample.user), 401: errorResponse },
      },
    },
    '/api/v1/events': {
      post: {
        tags: ['Events'],
        summary: 'Broadcast a help-request event (called by request-service with the acting user\'s JWT)',
        security: bearerSecurity,
        requestBody: jsonBody({ event: 'request:claimed', data: { id: 12, type: 'RESCUE', address: '4th Main Road, Velachery', status: 'CLAIMED', claimedBy: { id: '6650a1...', name: 'Priya' } } }),
        responses: { 202: jsonResponse('Broadcast sent', { delivered: true, event: 'request:claimed' }), 400: errorResponse, 401: errorResponse },
      },
    },
    '/api/v1/activity': {
      get: {
        tags: ['Activity'],
        summary: 'Latest activity log entries, newest first',
        security: bearerSecurity,
        parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } }],
        responses: {
          200: jsonResponse('OK', [{ _id: '6650b2...', event: 'request:claimed', requestId: 12, actorName: 'Priya', area: 'Velachery', message: 'Volunteer Priya claimed a rescue request in Velachery', createdAt: '2025-12-02T10:20:00.000Z' }]),
          401: errorResponse,
        },
      },
    },
    '/api/v1/presence': {
      get: {
        tags: ['Presence'],
        summary: 'Volunteers online right now (location rounded to about 100 m, null if not shared)',
        security: bearerSecurity,
        responses: {
          200: jsonResponse('OK', {
            onlineCount: 2,
            volunteers: [
              { userId: '6650a1f2c3d4e5f6a7b8c9d0', name: 'Priya', latitude: 12.982, longitude: 80.218, updatedAt: '2025-12-02T10:20:00.000Z' },
              { userId: '6650a1f2c3d4e5f6a7b8c9d1', name: 'Bala', latitude: null, longitude: null, updatedAt: null },
            ],
          }),
          401: errorResponse,
        },
      },
    },
    '/api/v1/health': {
      get: {
        tags: ['Health'],
        summary: 'Is the service running?',
        responses: { 200: jsonResponse('OK', { status: 'UP', service: 'auth-realtime-service', connectedClients: 2 }) },
      },
    },
  },
};
