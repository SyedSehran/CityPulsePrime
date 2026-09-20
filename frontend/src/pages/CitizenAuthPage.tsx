import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, ArrowRight, Loader2, Mail, Lock, User, Phone, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { loginUser, registerCitizen } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const CitizenAuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleFillDemo = () => {
    setEmail('citizen@citypulse.gov');
    setPassword('password123');
    setIsLogin(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const res = await loginUser(email, password);
        if (res.user.role !== 'citizen') {
          throw new Error('This account belongs to the Government portal. Please sign in via the Officer Portal.');
        }
        login(res.access_token, res.user);
        navigate('/citizen');
      } else {
        const res = await registerCitizen({
          full_name: fullName,
          email,
          password,
          phone: phone || undefined,
        });
        login(res.access_token, res.user);
        navigate('/citizen');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-ambient-bg">
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-icon-badge">
              <Shield size={24} strokeWidth={2.2} />
            </div>
            <h1 className="auth-title">
              {isLogin ? 'Citizen Portal Sign In' : 'Join CityPulse Network'}
            </h1>
            <p className="auth-subtitle">
              {isLogin
                ? 'Sign in to file civic complaints, track neighborhood repairs, and vote on resolution quality.'
                : 'Create your verified citizen profile to report infrastructure hazards and participate in governance.'}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${isLogin ? 'active' : ''}`}
              onClick={() => {
                setIsLogin(true);
                setError(null);
              }}
            >
              Citizen Sign In
            </button>
            <button
              type="button"
              className={`auth-tab ${!isLogin ? 'active' : ''}`}
              onClick={() => {
                setIsLogin(false);
                setError(null);
              }}
            >
              New Registration
            </button>
          </div>

          {/* Quick Demo Autofill Hint */}
          {isLogin && (
            <div className="demo-badge">
              <span>Demo: <code>citizen@citypulse.gov</code></span>
              <button type="button" className="demo-fill-btn" onClick={handleFillDemo}>
                Auto-fill
              </button>
            </div>
          )}

          {error && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 12,
                marginBottom: 18,
                fontWeight: 500,
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div className="input-container">
                    <User className="input-icon-left" size={16} />
                    <input
                      type="text"
                      className="form-input-lux"
                      placeholder="e.g. Priya Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number (Optional)</label>
                  <div className="input-container">
                    <Phone className="input-icon-left" size={16} />
                    <input
                      type="tel"
                      className="form-input-lux"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-container">
                <Mail className="input-icon-left" size={16} />
                <input
                  type="email"
                  className="form-input-lux"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-container">
                <Lock className="input-icon-left" size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input-lux"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="input-icon-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 14, height: 42 }}
              disabled={loading}
            >
              {loading && <Loader2 className="spin" size={15} />}
              {loading ? 'Authenticating...' : isLogin ? 'Access Citizen Portal' : 'Create Free Account'}
              {!loading && <ArrowRight size={14} />}
            </button>
          </form>

          <div className="security-trust">
            <ShieldCheck size={14} color="var(--accent-primary)" />
            <span>Encrypted Citizen Authentication & GPS Verification</span>
          </div>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link to="/gov/login" style={{ fontSize: 12, color: 'var(--text-secondary)', textDecoration: 'none' }}>
              Are you a municipal official? <strong style={{ color: 'var(--accent-primary)' }}>Officer Portal →</strong>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
