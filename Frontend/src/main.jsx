import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Filter out Stripe checkout page errors from console
const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args) => {
  const message = args[0]?.toString() || '';
  // Filter out Stripe checkout errors
  if (
    message.includes('Cannot find module') ||
    message.includes('uses an unsupported `as` value') ||
    message.includes('cs_test_') ||
    message.includes('stripe.com') ||
    message.includes('checkout.stripe.com')
  ) {
    return; // Don't log these Stripe errors
  }
  originalError.apply(console, args);
};

console.warn = (...args) => {
  const message = args[0]?.toString() || '';
  // Filter out Stripe warnings
  if (
    message.includes('uses an unsupported `as` value') ||
    message.includes('cs_test_') ||
    message.includes('stripe.com') ||
    message.includes('checkout.stripe.com')
  ) {
    return; // Don't log these Stripe warnings
  }
  originalWarn.apply(console, args);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
