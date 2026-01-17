import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

// Apply dark mode from localStorage before React renders
const savedState = localStorage.getItem('luqman-task-manager-storage');
if (savedState) {
  try {
    const parsed = JSON.parse(savedState);
    if (parsed.state?.darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    }
  } catch (e) {
    // ignore parse errors
  }
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
