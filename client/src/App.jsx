import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard    from './pages/Dashboard';
import Availability from './pages/Availability';
import Meetings     from './pages/Meetings';
import BookingPage  from './pages/BookingPage';
import Confirmation from './pages/Confirmation';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Admin pages — inside sidebar layout */}
        <Route element={<Layout />}>
          <Route path="/"             element={<Dashboard />} />
          <Route path="/availability" element={<Availability />} />
          <Route path="/meetings"     element={<Meetings />} />
        </Route>

        {/* Public pages — no sidebar */}
        <Route path="/book/:slug"         element={<BookingPage />} />
        <Route path="/book/:slug/confirm" element={<Confirmation />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}