import { useState } from 'react';

const USERS = [
  { username: 'admin', password: 'noesis2025' },
  { username: 'itay', password: 'itay123' },
];

function Field({ label, type = 'text', value, onChange, onEnter }) {
  return (
    <div>
      <label className="t-eyebrow" style={{ display: 'block', marginBottom: 6 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onEnter()}
        style={{ width: '100%', height: 40, boxSizing: 'border-box', padding: '0 14px' }}
      />
    </div>
  );
}

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = () => {
    setLoading(true);
    setError('');
    setTimeout(() => {
      const user = USERS.find(u => u.username === username && u.password === password);
      if (user) {
        localStorage.setItem('noesis-auth', user.username);
        onLogin(user.username);
      } else {
        setError('Invalid username or password');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div className="card glow" style={{ width: 380, padding: '32px 32px 28px' }}>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div className="logo-dot" style={{ width: 10, height: 10 }} />
          <div>
            <div className="wordmark" style={{ fontSize: 16 }}>NOESIS</div>
            <div className="wordmark-tag" style={{ fontSize: 7.5 }}>Understand Value. Act Smarter.</div>
          </div>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 22 }}>
          <div className="t-eyebrow" style={{ marginBottom: 8, fontSize: 12 }}>Sign in</div>
          <div className="t-body-sm">Enter credentials to access Noesis</div>
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 18 }}>
          <Field label="Username" value={username} onChange={setUsername} onEnter={submit} />
          <Field label="Password" type="password" value={password} onChange={setPassword} onEnter={submit} />
        </div>

        {/* Error strip */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 14px',
            background: 'var(--red-bg)',
            border: '1px solid var(--red-border)',
            color: 'var(--red)',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-mono)', fontSize: 11,
            letterSpacing: '0.04em',
            marginBottom: 14,
          }}>
            <span>✕</span>{error}
          </div>
        )}

        <button
          onClick={submit}
          disabled={loading || !username || !password}
          className="btn-brand"
          style={{ height: 42, width: '100%', justifyContent: 'center' }}
        >
          {loading ? '⟳ Signing in…' : 'Sign in →'}
        </button>

        <div className="t-meta" style={{ textAlign: 'center', marginTop: 20 }}>
          NOESIS · EQUITY VALUATION PLATFORM
        </div>

        <div style={{
          marginTop: 16,
          padding: '8px 12px',
          border: '1px dashed var(--border)',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-subtle)',
        }}>
          <div className="t-meta" style={{ textAlign: 'center' }}>
            admin / noesis2025 · itay / itay123
          </div>
        </div>
      </div>
    </div>
  );
}
