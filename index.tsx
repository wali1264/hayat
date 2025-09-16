import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// The service worker registration logic has been moved to App.tsx to handle updates gracefully.

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);