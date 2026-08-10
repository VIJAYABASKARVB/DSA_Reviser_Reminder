import { Route, Routes, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Navbar from './components/Navbar.jsx'
import AppNotifications from './components/AppNotifications.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import AllProblems from './pages/AllProblems.jsx'
import AddProblem from './pages/AddProblem.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-gray-950">
              <AppNotifications />
              <Navbar />
              <main className="mx-auto max-w-6xl px-4 py-8">
                <Dashboard />
              </main>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/problems"
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-gray-950">
              <Navbar />
              <main className="mx-auto max-w-6xl px-4 py-8">
                <AllProblems />
              </main>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/add"
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-gray-950">
              <Navbar />
              <main className="mx-auto max-w-3xl px-4 py-8">
                <AddProblem />
              </main>
            </div>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}