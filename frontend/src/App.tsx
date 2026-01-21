import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage } from './pages'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { useAuthStore } from './stores/authStore'
import './App.css'

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <ErrorBoundary showHomeButton>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />}
        />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        />
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </ErrorBoundary>
  )
}

export default App
