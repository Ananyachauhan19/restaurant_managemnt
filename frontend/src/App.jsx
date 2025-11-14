import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Menu from './pages/Menu';
import Customers from './pages/Customers';
import Reports from './pages/Reports';
import Terminal from './pages/Terminal';
import Login from './pages/Login';
import Header from './components/Header';
import Sidebar from './components/Sidebar';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function Layout({ children }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <PrivateRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </PrivateRoute>
        } />
        <Route path="/orders" element={
          <PrivateRoute>
            <Layout>
              <Orders />
            </Layout>
          </PrivateRoute>
        } />
        <Route path="/menu" element={
          <PrivateRoute>
            <Layout>
              <Menu />
            </Layout>
          </PrivateRoute>
        } />
        <Route path="/customers" element={
          <PrivateRoute>
            <Layout>
              <Customers />
            </Layout>
          </PrivateRoute>
        } />
        <Route path="/reports" element={
          <PrivateRoute>
            <Layout>
              <Reports />
            </Layout>
          </PrivateRoute>
        } />
        <Route path="/terminal" element={
          <PrivateRoute>
            <Layout>
              <Terminal />
            </Layout>
          </PrivateRoute>
        } />
      </Routes>
    </AuthProvider>
  );
}