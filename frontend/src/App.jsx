import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import EmployeesPage from './pages/EmployeesPage';
import EmployeeForm from './pages/EmployeeForm';
import EmployeeDetail from './pages/EmployeeDetail';
import EvaluationsPage from './pages/EvaluationsPage';
import EvaluationForm from './pages/EvaluationForm';
import EvaluationDetail from './pages/EvaluationDetail';
import NineBoxPage from './pages/NineBoxPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: 'var(--bg-primary)' }}>
        <div className="loader-ring" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'administrador') return <Navigate to="/" replace />;

  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />

      <Route path="/" element={
        <ProtectedRoute><Layout /></ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />

        <Route path="colaboradores" element={<EmployeesPage />} />
        <Route path="colaboradores/nuevo" element={<EmployeeForm />} />
        <Route path="colaboradores/:id" element={<EmployeeDetail />} />
        <Route path="colaboradores/:id/editar" element={<EmployeeForm />} />

        <Route path="evaluaciones" element={<EvaluationsPage />} />
        <Route path="evaluaciones/nueva" element={<EvaluationForm />} />
        <Route path="evaluaciones/:id" element={<EvaluationDetail />} />
        <Route path="evaluaciones/:id/editar" element={<EvaluationForm />} />

        <Route path="nine-box" element={<NineBoxPage />} />
        <Route path="reportes" element={<ReportsPage />} />

        <Route path="usuarios" element={
          <ProtectedRoute adminOnly><UsersPage /></ProtectedRoute>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              fontSize: '14px',
              boxShadow: 'var(--shadow-md)',
            },
            success: { iconTheme: { primary: 'var(--success)', secondary: '#fff' } },
            error: { iconTheme: { primary: 'var(--danger)', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
