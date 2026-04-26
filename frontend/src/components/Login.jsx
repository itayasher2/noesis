import { useState } from 'react';

const USERS = [
  { username: 'admin', password: 'noesis2025' },
  { username: 'itay', password: 'itay123' },
];

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
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
    }, 600);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: 380,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '40px 36px',
        boxShadow: 'var(--shadow-md)',
      }}>
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="logo-dot"></div>
          <div>
            <div style={{fontSize:17,fontWeight:700,letterSpacing:2,color:'var(--text-primary)',fontFamily:'"Arial Black",sans-serif',lineHeight:1.2}}>NOESIS</div>
            <div style={{fontSize:7.5,letterSpacing:1.5,color:'var(--text-muted)',fontFamily:'Arial,sans-serif',fontStyle:'italic',marginTop:2}}>Understand Value. Act Smarter.</div>
          </div>
        </div>

        {/* Title */}
        <div className="mb-6">
          <div style={{fontSize:18,fontWeight:600,color:'var(--text-primary)',marginBottom:4}}>Sign in</div>
          <div style={{fontSize:13,color:'var(--text-muted)'}}>Enter your credentials to access Noesis</div>
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-4 mb-6">
          <div>
            <label style={{fontSize:12,fontWeight:500,color:'var(--text-muted)',display:'block',marginBottom:6}}>USERNAME</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Enter username"
              style={{
                width: '100%',
                height: 42,
                padding: '0 14px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{fontSize:12,fontWeight:500,color:'var(--text-muted)',display:'block',marginBottom:6}}>PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Enter password"
              style={{
                width: '100%',
                height: 42,
                padding: '0 14px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {error && (
          <div style={{
            background: 'var(--red-bg)',
            border: '1px solid var(--red)',
            color: 'var(--red)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            fontSize: 13,
            marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading || !username || !password}
          className="btn-brand w-full"
          style={{height: 44, fontSize: 14}}
        >
          {loading ? '⟳ Signing in...' : 'Sign In →'}
        </button>

        <div style={{fontSize:11,color:'var(--text-muted)',textAlign:'center',marginTop:20}}>
          Noesis · Equity Valuation Platform
        </div>
      </div>
    </div>
  );
}