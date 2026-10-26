// Vite build/dev-server settings for the React app. Used by `npm run dev` and `npm run build`.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // strictPort: fail instead of silently moving to 5174, because the backends only allow 5173 (CORS)
  server: { port: 5173, strictPort: true },
});
