import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Fix for read-only fetch in some environments (e.g. AI Studio preview)
try {
  const descriptor = Object.getOwnPropertyDescriptor(window, 'fetch');
  if (descriptor && !descriptor.writable) {
    console.warn('window.fetch is read-only, ensuring it remains stable.');
    // We could try to define it if it's configurable, but usually it's best to just leave it be
    // if it's already there.
  }
} catch (e) {
  console.error('Error checking window.fetch descriptor:', e);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
