import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthSuccess from './pages/AuthSuccess';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth-success" element={<AuthSuccess />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
