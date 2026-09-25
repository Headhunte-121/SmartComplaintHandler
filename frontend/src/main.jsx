/**
 * SmartComplaintHandler - Application Entry Point
 * Blueprint Reference: docs/V1/M1/frontend/04_app_router.md
 * Role: Mounts React application root into index.html DOM container.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
