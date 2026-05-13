import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LeaveForm     from './pages/LeaveForm';
import OTForm        from './pages/OTForm';
import RejectForm    from './pages/RejectForm';
import History       from './pages/History';
import Announcements from './pages/Announcements';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/leave"         element={<LeaveForm />} />
        <Route path="/ot"            element={<OTForm />} />
        <Route path="/reject"        element={<RejectForm />} />
        <Route path="/history"       element={<History />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="*" element={<Navigate to="/leave" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
