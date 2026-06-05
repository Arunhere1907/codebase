import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Apply saved theme before first paint to avoid flash
function applyInitialTheme() {
  try {
    const saved = localStorage.getItem('codebase_settings');
    const theme = saved ? JSON.parse(saved).theme : 'dark';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch {
    document.documentElement.classList.add('dark');
  }
}

applyInitialTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
