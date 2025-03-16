import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Quita la llamada a reportWebVitals() o agrégala si la necesitas:
// import reportWebVitals from './reportWebVitals';
// reportWebVitals();