// App shell: Router plus global providers (Auth, Theme)
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
// Gatekeeper for protected routes; checks JWT session
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route element={<PrivateRoute />}>
               <Route path="/dashboard" element={<Dashboard />} />
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/unauthorized" element={<div>Unauthorized</div>} />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
