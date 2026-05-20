import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.error || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Background */}
      <div className="login-bg">
        <div className="login-bg-grid" />
        <div className="login-bg-orb orb1" />
        <div className="login-bg-orb orb2" />
      </div>

      <div className="login-container">
        {/* Left panel */}
        <div className="login-panel login-panel-left">
          <div className="login-brand">
            <div className="login-logo">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <rect width="36" height="36" rx="10" fill="#1E4DB7"/>
                <path d="M8 26L18 10L28 26H8Z" fill="white" fillOpacity=".9"/>
                <circle cx="18" cy="17" r="5" fill="white" fillOpacity=".2"/>
                <rect x="14" y="22" width="8" height="2" rx="1" fill="white" fillOpacity=".6"/>
              </svg>
              <div>
                <div className="login-brand-name">Grupo Ardisa</div>
                <div className="login-brand-sub">Gestión de Talento</div>
              </div>
            </div>
          </div>

          <div className="login-hero">
            <h1>Plataforma de<br/><span className="text-accent">Talento Humano</span></h1>
            <p>Evalúa, clasifica y desarrolla tu capital humano con la metodología Nine Box.</p>

            <div className="login-features">
              {[
                { icon: '◈', label: 'Matriz Nine Box interactiva' },
                { icon: '◉', label: 'Análisis de desempeño y potencial' },
                { icon: '◎', label: 'Reportes ejecutivos en tiempo real' },
              ].map((f) => (
                <div className="login-feature" key={f.label}>
                  <span className="feature-icon">{f.icon}</span>
                  <span>{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="login-footer-text">
            © 2024 Grupo Ardisa · Plataforma Nine Box v1.0
          </div>
        </div>

        {/* Right panel - Form */}
        <div className="login-panel login-panel-right">
          <div className="login-form-wrapper">
            <div className="login-form-header">
              <h2>Iniciar Sesión</h2>
              <p>Ingrese sus credenciales corporativas</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label className="form-label">Usuario o Correo</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <input
                    type="text"
                    className="form-input with-icon"
                    placeholder="admin"
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Contraseña</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="form-input with-icon with-icon-right"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required
                  />
                  <button type="button" className="input-toggle" onClick={() => setShowPass(!showPass)}>
                    {showPass
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>

              <div className="login-hint">
                <div className="hint-box">
                  <strong>Demo:</strong> usuario <code>admin</code> · contraseña <code>Admin123!</code>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-lg login-submit" disabled={loading}>
                {loading
                  ? <><div className="btn-spinner" /> Autenticando...</>
                  : <>Ingresar a la plataforma <span className="btn-arrow">→</span></>
                }
              </button>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
          overflow: hidden;
          background: var(--navy);
        }
        .login-bg { position: fixed; inset: 0; pointer-events: none; }
        .login-bg-grid {
          position: absolute; inset: 0;
          background-image: linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .login-bg-orb {
          position: absolute; border-radius: 50%;
          filter: blur(80px); opacity: 0.15;
        }
        .orb1 {
          width: 500px; height: 500px;
          background: var(--blue-500);
          top: -100px; left: -100px;
        }
        .orb2 {
          width: 400px; height: 400px;
          background: var(--cyan);
          bottom: -80px; right: -80px;
        }
        .login-container {
          display: flex;
          width: 100%;
          max-width: 960px;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 40px 80px rgba(0,0,0,.4);
          position: relative;
          z-index: 1;
          border: 1px solid rgba(255,255,255,.08);
        }
        .login-panel { flex: 1; }
        .login-panel-left {
          background: linear-gradient(150deg, var(--navy-700) 0%, var(--blue) 100%);
          padding: 48px 40px;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }
        .login-panel-left::before {
          content: '';
          position: absolute;
          width: 300px; height: 300px;
          border-radius: 50%;
          background: rgba(255,255,255,.05);
          bottom: -80px; right: -80px;
        }
        .login-panel-right {
          background: var(--bg-card, white);
          padding: 48px 40px;
          display: flex;
          align-items: center;
        }
        .login-form-wrapper { width: 100%; }
        .login-logo {
          display: flex; align-items: center; gap: 14px;
          margin-bottom: 56px;
        }
        .login-brand-name {
          font-family: 'Syne', sans-serif;
          font-size: 20px; font-weight: 800;
          color: white; letter-spacing: -0.02em;
        }
        .login-brand-sub { font-size: 12px; color: rgba(255,255,255,.6); }
        .login-hero h1 {
          font-size: 36px; font-weight: 800;
          color: white; margin-bottom: 16px;
          line-height: 1.15;
        }
        .text-accent { color: var(--blue-300); }
        .login-hero p { color: rgba(255,255,255,.7); font-size: 15px; margin-bottom: 40px; }
        .login-features { display: flex; flex-direction: column; gap: 14px; }
        .login-feature {
          display: flex; align-items: center; gap: 12px;
          color: rgba(255,255,255,.8); font-size: 14px;
        }
        .feature-icon {
          color: var(--blue-300); font-size: 16px;
          min-width: 20px;
        }
        .login-footer-text {
          margin-top: auto; padding-top: 40px;
          font-size: 12px; color: rgba(255,255,255,.35);
        }
        .login-form-header { margin-bottom: 32px; }
        .login-form-header h2 {
          font-family: 'Syne', sans-serif;
          font-size: 28px; font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 6px;
        }
        .login-form-header p { color: var(--text-muted); font-size: 14px; }
        .input-wrapper { position: relative; }
        .input-icon {
          position: absolute; left: 12px; top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted); pointer-events: none;
        }
        .form-input.with-icon { padding-left: 38px; }
        .form-input.with-icon-right { padding-right: 38px; }
        .input-toggle {
          position: absolute; right: 10px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          cursor: pointer; color: var(--text-muted);
          display: flex;
        }
        .hint-box {
          background: rgba(59,130,246,.08);
          border: 1px solid rgba(59,130,246,.2);
          border-radius: var(--radius);
          padding: 10px 14px;
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 16px;
        }
        .hint-box code {
          background: rgba(59,130,246,.15);
          padding: 1px 6px;
          border-radius: 4px;
          font-size: 12px;
          color: var(--blue-500);
        }
        .login-submit {
          width: 100%;
          justify-content: center;
          padding: 14px;
          font-size: 15px;
          font-weight: 600;
        }
        .btn-spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,.4);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        .btn-arrow { font-size: 18px; transition: transform 0.2s; }
        .login-submit:hover .btn-arrow { transform: translateX(4px); }
        @media (max-width: 768px) {
          .login-panel-left { display: none; }
          .login-panel-right { padding: 32px 24px; }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
