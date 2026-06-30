import { Component, useState } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { AboutContact } from './components/AboutContact';
import { AuthPage } from './components/AuthPage';
import { AdminDashboard } from './components/AdminDashboard';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("🔥 Error caught by boundary:", error.message, error.stack, errorInfo.componentStack);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <h2 className="text-2xl font-bold text-rose-500 mb-2">AI Dashboard Rendering Error</h2>
          <p className="text-slate-400 max-w-md mx-auto text-sm">
            The dashboard component failed to mount due to a runtime script error. Let us inspect the browser logs to resolve this.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

interface UserSession {
  id: number;
  name: string;
  email: string;
  role: string;
}

function App() {
  const [user, setUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLoginSuccess = (session: UserSession) => {
    setUser(session);
    localStorage.setItem('auth_user', JSON.stringify(session));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  return (
    <Router>
      <div className="min-h-screen bg-dark-900 text-slate-100 flex flex-col">
        {/* Navigation bar with dynamic user authentication state */}
        <Navbar user={user} onLogout={handleLogout} />
        
        {/* Main route layout container */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            
            <Route 
              path="/login" 
              element={
                user ? (
                  user.role === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />
                ) : (
                  <AuthPage onLoginSuccess={handleLoginSuccess} />
                )
              } 
            />
            
            <Route 
              path="/dashboard" 
              element={
                user ? (
                  user.role === 'admin' ? (
                    <Navigate to="/admin" replace />
                  ) : (
                    <ErrorBoundary><Dashboard user={user} /></ErrorBoundary>
                  )
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />
            
            <Route 
              path="/admin" 
              element={
                user && user.role === 'admin' ? (
                  <AdminDashboard />
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />
            
            <Route path="/about" element={<AboutContact defaultTab="about" />} />
            <Route path="/contact" element={<AboutContact defaultTab="contact" />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
