import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register PWA ServiceWorker for static asset caching and offline resilience
registerSW({
  immediate: true,
  onOfflineReady() {
    console.log('StreamX PWA offline cache ready');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

