import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import StudentDashboard from './pages/student/Dashboard'
import FacultyDashboard from './pages/faculty/Dashboard'
import AdminDashboard from './pages/admin/Dashboard'
import AdminRegistry from './pages/admin/Registry'
import AdminPeople from './pages/admin/People'
import AdminFeedback from './pages/admin/Feedback'
import FacultyApprovals from './pages/admin/FacultyApprovals'
import AdminSettings from './pages/admin/Settings'
import ExamsList from './pages/student/ExamsList'
import TakeExam from './pages/student/TakeExam'
import MyGrievances from './pages/student/MyGrievances'
import CreateGrievance from './pages/student/CreateGrievance'
import Results from './pages/student/Results'
import Evaluations from './pages/student/Evaluations'
import CreateExam from './pages/faculty/CreateExam'
import EvaluateExam from './pages/faculty/EvaluateExam'
import ManageGrievances from './pages/faculty/ManageGrievances'
import Layout from './components/Layout'

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth()
  const userRole = String(user?.role || '').toLowerCase()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" />
  }

  return children
}

function App() {
  const { user } = useAuth()
  const userRole = String(user?.role || '').toLowerCase()

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                {userRole === 'student' && <Navigate to="/dashboard" />}
                {userRole === 'faculty' && <Navigate to="/faculty/dashboard" />}
                {userRole === 'admin' && <Navigate to="/admin" />}
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              {userRole === 'admin' && <Navigate to="/admin" />}
              {userRole === 'faculty' && <Navigate to="/faculty/dashboard" />}
              <Layout>
                <StudentDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Student Routes */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout>
                <StudentDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/exams"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout>
                <ExamsList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/exam/:examId"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout>
                <TakeExam />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/grievances"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout>
                <MyGrievances />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/grievances/create"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout>
                <CreateGrievance />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/evaluations"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout>
                <Evaluations />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/results"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout>
                <Results />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Faculty Routes */}
        <Route
          path="/faculty/dashboard"
          element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <Layout>
                <FacultyDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/exam/create"
          element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <Layout>
                <CreateExam />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/exam/evaluate"
          element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <Layout>
                <EvaluateExam />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/evaluate/:id"
          element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <Layout>
                <EvaluateExam />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/grievances"
          element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <Layout>
                <ManageGrievances />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout>
                <AdminDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={<Navigate to="/admin" />}
        />
        <Route
          path="/admin/registry"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout>
                <AdminRegistry />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout>
                <AdminPeople />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/feedback"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout>
                <AdminFeedback />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/faculty-approvals"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout>
                <FacultyApprovals />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout>
                <AdminSettings />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* 404 Route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App
