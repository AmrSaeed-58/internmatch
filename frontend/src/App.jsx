import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SocketProvider } from './contexts/SocketContext';
import {
  LandingPage,
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  InternshipDetailPage,
  AboutPage,
  PrivacyPage,
  TermsPage,
  ContactPage,
} from './pages/public';
import {
  StudentDashboard,
  StudentProfile,
  StudentInternships,
  StudentRecommendations,
  StudentApplications,
  StudentSaved,
  StudentMessages,
  StudentSettings,
  StudentNotifications,
  StudentEmployerProfile,
} from './pages/student';
import {
  AdminDashboard,
  UserManagement,
  InternshipManagement,
  SystemLogs,
  AdminReports,
  AdminSettings,
  AdminNotifications,
} from './pages/admin';
import {
  EmployerDashboard,
  EmployerProfile,
  PostInternship,
  EditInternship,
  ManageInternships,
  ViewApplicants,
  EmployerStudentProfile,
  AICandidates,
  EmployerAnalytics,
  EmployerMessages,
  EmployerSettings,
  EmployerNotifications,
} from './pages/employer';
import { NotFoundPage } from './components';

// Protected route wrapper
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return children;
}

function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Internship Detail — Public with extended access */}
      <Route path="/internship/:id" element={<InternshipDetailPage />} />

      {/* Static legal/info pages */}
      <Route path="/about" element={<AboutPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/contact" element={<ContactPage />} />

      {/* Student Routes */}
      <Route path="/student/dashboard" element={
        <ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>
      } />
      <Route path="/student/profile" element={
        <ProtectedRoute allowedRoles={['student']}><StudentProfile /></ProtectedRoute>
      } />
      <Route path="/student/internships" element={
        <ProtectedRoute allowedRoles={['student']}><StudentInternships /></ProtectedRoute>
      } />
      <Route path="/student/recommendations" element={
        <ProtectedRoute allowedRoles={['student']}><StudentRecommendations /></ProtectedRoute>
      } />
      <Route path="/student/applications" element={
        <ProtectedRoute allowedRoles={['student']}><StudentApplications /></ProtectedRoute>
      } />
      <Route path="/student/saved" element={
        <ProtectedRoute allowedRoles={['student']}><StudentSaved /></ProtectedRoute>
      } />
      <Route path="/student/messages" element={
        <ProtectedRoute allowedRoles={['student']}><StudentMessages /></ProtectedRoute>
      } />
      <Route path="/student/notifications" element={
        <ProtectedRoute allowedRoles={['student']}><StudentNotifications /></ProtectedRoute>
      } />
      <Route path="/student/settings" element={
        <ProtectedRoute allowedRoles={['student']}><StudentSettings /></ProtectedRoute>
      } />
      <Route path="/student/employer/:employerId" element={
        <ProtectedRoute allowedRoles={['student']}><StudentEmployerProfile /></ProtectedRoute>
      } />

      {/* Employer Routes */}
      <Route path="/employer/dashboard" element={
        <ProtectedRoute allowedRoles={['employer']}><EmployerDashboard /></ProtectedRoute>
      } />
      <Route path="/employer/profile" element={
        <ProtectedRoute allowedRoles={['employer']}><EmployerProfile /></ProtectedRoute>
      } />
      <Route path="/employer/internships/new" element={
        <ProtectedRoute allowedRoles={['employer']}><PostInternship /></ProtectedRoute>
      } />
      <Route path="/employer/internship/new" element={
        <ProtectedRoute allowedRoles={['employer']}><PostInternship /></ProtectedRoute>
      } />
      <Route path="/employer/internship/:id/edit" element={
        <ProtectedRoute allowedRoles={['employer']}><EditInternship /></ProtectedRoute>
      } />
      <Route path="/employer/internships" element={
        <ProtectedRoute allowedRoles={['employer']}><ManageInternships /></ProtectedRoute>
      } />
      <Route path="/employer/internship/:id/applicants" element={
        <ProtectedRoute allowedRoles={['employer']}><ViewApplicants /></ProtectedRoute>
      } />
      <Route path="/employer/student/:studentId" element={
        <ProtectedRoute allowedRoles={['employer']}><EmployerStudentProfile /></ProtectedRoute>
      } />
      <Route path="/employer/candidates" element={
        <ProtectedRoute allowedRoles={['employer']}><AICandidates /></ProtectedRoute>
      } />
      <Route path="/employer/analytics" element={
        <ProtectedRoute allowedRoles={['employer']}><EmployerAnalytics /></ProtectedRoute>
      } />
      <Route path="/employer/messages" element={
        <ProtectedRoute allowedRoles={['employer']}><EmployerMessages /></ProtectedRoute>
      } />
      <Route path="/employer/notifications" element={
        <ProtectedRoute allowedRoles={['employer']}><EmployerNotifications /></ProtectedRoute>
      } />
      <Route path="/employer/settings" element={
        <ProtectedRoute allowedRoles={['employer']}><EmployerSettings /></ProtectedRoute>
      } />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>
      } />
      <Route path="/admin/internships" element={
        <ProtectedRoute allowedRoles={['admin']}><InternshipManagement /></ProtectedRoute>
      } />
      <Route path="/admin/logs" element={
        <ProtectedRoute allowedRoles={['admin']}><SystemLogs /></ProtectedRoute>
      } />
      <Route path="/admin/reports" element={
        <ProtectedRoute allowedRoles={['admin']}><AdminReports /></ProtectedRoute>
      } />
      <Route path="/admin/notifications" element={
        <ProtectedRoute allowedRoles={['admin']}><AdminNotifications /></ProtectedRoute>
      } />
      <Route path="/admin/settings" element={
        <ProtectedRoute allowedRoles={['admin']}><AdminSettings /></ProtectedRoute>
      } />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
        <Router>
          <AppRoutes />
          <ToastContainer
            position="top-right"
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
        </Router>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
