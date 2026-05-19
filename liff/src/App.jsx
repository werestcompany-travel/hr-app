import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LangProvider } from './context/LangContext';
import LeaveForm     from './pages/LeaveForm';
import OTForm        from './pages/OTForm';
import RejectForm    from './pages/RejectForm';
import History       from './pages/History';
import Announcements from './pages/Announcements';
import Balance       from './pages/Balance';

export default function App() {
  return (
    <LangProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/leave"         element={<LeaveForm />} />
          <Route path="/ot"            element={<OTForm />} />
          <Route path="/reject"        element={<RejectForm />} />
          <Route path="/history"       element={<History />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/balance"       element={<Balance />} />
          <Route path="*" element={<Navigate to="/leave" replace />} />
        </Routes>
      </BrowserRouter>
    </LangProvider>
  );
}
