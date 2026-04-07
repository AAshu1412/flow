import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthSuccess from './pages/AuthSuccess';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Waitlist from './pages/Waitlist';

import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Waitlist />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth-success" element={<AuthSuccess />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
