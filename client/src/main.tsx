import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'https://528afc2c005c2f481efe7769ddb419f2@o4509991705444352.ingest.de.sentry.io/4509991708721232',
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // Tracing
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: [
    'localhost',
    '127.0.0.1',
    /^https:\/\/lecce-digital-legends\.web\.app\//,
  ],
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.,
  // Enable logs to be sent to Sentry
  enableLogs: true,
});

// Initialize theme on app start
const savedTheme = localStorage.getItem('ldc:theme') || 'default';
document.documentElement.className = `ldc-theme--${savedTheme}`;

createRoot(document.getElementById('root')!).render(<App />);
