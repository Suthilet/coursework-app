import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import { authAPI } from './api/auth';

// Компонент для проверки авторизации
const PrivateRoute = ({ children }) => {
  const isLoggedIn = authAPI.isLoggedIn();
  
  return isLoggedIn ? children : <Navigate to="/login" />;
};

// Публичный маршрут (только для неавторизованных)
const PublicRoute = ({ children }) => {
  const isLoggedIn = authAPI.isLoggedIn();
  
  return !isLoggedIn ? children : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        <Route path="/login" element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } />
        
        <Route path="/register" element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        } />
        
        <Route path="/dashboard" element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        } />
        
        <Route path="*" element={
          <div className="min-h-screen bg-blue-500 flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="text-4xl font-bold mb-4">404</h1>
              <p className="text-xl">Страница не найдена</p>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;