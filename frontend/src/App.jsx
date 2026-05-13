import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout        from './components/Layout';
import Login         from './pages/Login';
import Dashboard     from './pages/Dashboard';
import Employees     from './pages/Employees';
import LeaveReport   from './pages/LeaveReport';
import Announcements from './pages/Announcements';
import Requests      from './pages/Requests';

function RequireAuth({ children }) {
  const token = useAuthStore(s => s.token);
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index          element={<Dashboard />} />
          <Route path="employees"     element={<Employees />} />
          <Route path="reports/leave" element={<LeaveReport />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="requests"      element={<Requests />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
