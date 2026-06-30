import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ShieldAlert, CheckCircle, ArrowRight } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

interface AuthPageProps {
  onLoginSuccess: (user: { id: number; name: string; email: string; role: string }) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    
    if (!email || !password) {
      setErrorMsg("Please fill in all credentials.");
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        email,
        password
      });
      
      if (response.data.success) {
        setSuccessMsg("Login successful! Loading console...");
        setTimeout(() => {
          onLoginSuccess(response.data.user);
          if (response.data.user.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        }, 800);
      } else {
        setErrorMsg(response.data.message || "Invalid credentials.");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Authentication server error.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    
    if (!name || !email || !password || !confirmPassword) {
      setErrorMsg("Please fill in all registration fields.");
      return;
    }
    
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    if (email.toLowerCase().startsWith('admin1') || email.toLowerCase().startsWith('admin2')) {
      setErrorMsg("This prefix is reserved for system administrators.");
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/register`, {
        name,
        email,
        password
      });
      
      if (response.data.success) {
        setSuccessMsg("Sign Up successful! Please sign in with your credentials.");
        setIsSignUp(false);
        setPassword('');
        setConfirmPassword('');
      } else {
        setErrorMsg(response.data.message || "Failed to create account.");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Registration server error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-dark-950 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-accent-purple/10 blur-[80px]"></div>
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-accent-cyan/10 blur-[80px]"></div>
      
      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-wider bg-gradient-to-r from-accent-cyan to-accent-purple bg-clip-text text-transparent">
            {isSignUp ? "CREATE AN ACCOUNT" : "AUTHENTICATION MODULE"}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {isSignUp 
              ? "Register to begin analyzing satellite imagery cloud removal." 
              : "Access the research-grade satellite restoration console."
            }
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-dark-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-8 shadow-2xl">
          {errorMsg && (
            <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-400">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
          
          {successMsg && (
            <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-400">
              <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-5">
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-dark-950/60 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-cyan transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {isSignUp ? "Email Address" : "Username / Email"}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-dark-950/60 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-cyan transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-dark-950/60 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-cyan transition-colors"
                />
              </div>
            </div>

            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-dark-950/60 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-cyan transition-colors"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-purple py-2.5 text-sm font-semibold text-white shadow-lg hover:shadow-accent-cyan/20 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              <span>{loading ? "Authenticating..." : isSignUp ? "Sign Up Now" : "Sign In"}</span>
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <div className="mt-6 text-center text-xs">
            <span className="text-slate-400">
              {isSignUp ? "Already have an account?" : "Need a satellite access account?"}
            </span>{" "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="text-accent-cyan hover:underline font-semibold bg-transparent border-none cursor-pointer"
            >
              {isSignUp ? "Sign In instead" : "Create standard user account"}
            </button>
          </div>
        </div>
        
        {/* Predefined admin info banner */}
        {!isSignUp && (
          <div className="bg-white/5 border border-white/5 rounded-xl p-3.5 text-xs text-slate-400 text-center space-y-1">
            <div>💡 Admin 1: <code className="text-accent-cyan">admin1@cloudclear.ai</code> (pass: <code className="text-accent-purple">admin123</code>)</div>
            <div>💡 Admin 2: <code className="text-accent-cyan">admin2@cloudclear.ai</code> (pass: <code className="text-accent-purple">admin456</code>)</div>
            <div>🤖 AI Agent: <code className="text-accent-cyan">agent@cloudclear.ai</code> (pass: <code className="text-accent-purple">agent123</code>)</div>
          </div>
        )}
      </div>
    </div>
  );
};
