import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Простой компонент для 404
const NotFound = () => (
  <div className="min-h-screen bg-sky-500 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-white mb-4">404</h1>
      <p className="text-xl text-white mb-8">Страница не найдена</p>
      <a 
        href="/login" 
        className="px-6 py-3 bg-amber-600 text-black rounded-xl hover:bg-amber-700"
      >
        На главную
      </a>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;