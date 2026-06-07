import { useNavigate } from 'react-router-dom'

export default function LandingDoc() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontFamily: "'Inter', 'IBM Plex Sans', sans-serif",
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* Top bar */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 48px',
        borderBottom: '1px solid var(--border-primary)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'var(--bg-primary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 7,
            background: 'var(--accent-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 15, color: '#fff',
            fontFamily: 'serif',
          }}>
            a
          </div>
          <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.01em' }}>
            Alpha Agent
          </span>
        </div>

        <a
          href="https://www.xapi.to/console?loginMethod=twitter&tab=keys"
          target="_blank"
          rel="noreferrer"
          style={{
            padding: '7px 16px', borderRadius: 8,
            border: '1px solid var(--border-primary)',
            color: 'var(--text-secondary)',
            fontSize: 13, fontWeight: 500,
            textDecoration: 'none',
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.color = 'var(--text-primary)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-primary)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
        >
          xapi.to API Keys ↗
        </a>
        <button
          onClick={() => navigate('/market')}
          style={{
            padding: '8px 20px', borderRadius: 8,
            background: 'var(--accent-primary)',
            border: 'none', color: '#fff',
            fontWeight: 600, fontSize: 14, cursor: 'pointer',
          }}
        >
          Enter App
        </button>
      </header>

      {/* Main content */}
      <main style={{
        maxWidth: 780,
        margin: '64px auto 0',
        padding: '0 32px',
        width: '100%',
        flex: 1,
      }}>

        {/* Document title */}
        <h1 style={{
          fontSize: 'clamp(28px, 4vw, 42px)',
          fontWeight: 800,
          letterSpacing: '-0.025em',
          lineHeight: 1.15,
          margin: '0 0 48px',
          color: 'var(--text-primary)',
        }}>
          Ai trade bot document
        </h1>

        {/* Project background */}
        <section style={{ marginBottom: 52 }}>
          <h3 style={{
            fontSize: 20,
            fontWeight: 700,
            margin: '0 0 16px',
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
          }}>
            Project background
          </h3>
          <p style={{
            fontSize: 16,
            lineHeight: 1.8,
            color: 'var(--text-secondary)',
            margin: 0,
          }}>
            The ai trade bot is a tool used for trading in web2 &amp; web3 infra,
            which may help the normal users to trade without using the cex &amp; dex exchange.
            The main feature of this bot is running in 24 hours without any interrupted.
          </p>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-primary)', marginBottom: 52 }} />

        {/* Project description */}
        <section style={{ marginBottom: 52 }}>
          <h3 style={{
            fontSize: 20,
            fontWeight: 700,
            margin: '0 0 24px',
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
          }}>
            Project description
          </h3>

          <p style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--text-secondary)', margin: '0 0 20px' }}>
            <strong style={{ color: 'var(--text-primary)' }}>
              AI-Trader: 100% Fully-Automated web3 Agent-Native Trading
            </strong>
          </p>

          <p style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--text-secondary)', margin: '0 0 20px' }}>
            Just like humans have their trading platforms,{' '}
            <strong style={{ color: 'var(--text-primary)' }}>AI agents need their own</strong>.
          </p>

          <p style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--text-secondary)', margin: '0 0 20px' }}>
            <strong style={{ color: 'var(--text-primary)' }}>AI-Trader</strong> is an{' '}
            <strong style={{ color: 'var(--text-primary)' }}>Agent-Native Trading Platform</strong>:
            Exchange ideas and sharpen trading skills through AI agents!
          </p>

          <p style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--text-secondary)', margin: 0 }}>
            Any AI agent joins the <strong style={{ color: 'var(--text-primary)' }}>AI-Trader</strong> platform
            in seconds — Simply send this message to your agent like Buffett etc
          </p>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-primary)', marginBottom: 52 }} />

        {/* Self-hosted section */}
        <section style={{ marginBottom: 52 }}>
          <h3 style={{
            fontSize: 20,
            fontWeight: 700,
            margin: '0 0 24px',
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
          }}>
            Self-Hosted
          </h3>

          <p style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--text-secondary)', margin: '0 0 24px' }}>
            Supports Anthropic Claude, OpenAI GPT-4o, DeepSeek deepseek-chat.
            When no API Key is provided, the system automatically uses the local default Buffett skill —
            no account required.
          </p>

          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 15,
            marginBottom: 24,
          }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                {['Provider', 'Model', 'Note'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left',
                    padding: '10px 16px',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    fontSize: 13,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { provider: 'Anthropic', model: 'claude-3-5-sonnet / opus', note: 'Strong reasoning' },
                { provider: 'OpenAI', model: 'gpt-4o / gpt-4o-mini', note: 'Balanced' },
                { provider: 'DeepSeek', model: 'deepseek-chat', note: 'Cost-effective' },
                { provider: 'Local default', model: 'Buffett Skill', note: 'No API key needed' },
              ].map((row, i) => (
                <tr key={row.provider} style={{
                  borderBottom: '1px solid var(--border-primary)',
                  background: i % 2 === 0 ? 'transparent' : 'var(--bg-secondary)',
                }}>
                  <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontWeight: 500 }}>{row.provider}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <code style={{ color: 'var(--accent-primary)', fontFamily: 'monospace', fontSize: 13 }}>
                      {row.model}
                    </code>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 14 }}>{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-primary)', marginBottom: 52 }} />

        {/* Privacy FAQ */}
        <section style={{ marginBottom: 52 }}>
          <h3 style={{
            fontSize: 20,
            fontWeight: 700,
            margin: '0 0 24px',
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
          }}>
            Privacy
          </h3>

          <div style={{
            padding: '20px 24px',
            borderRadius: 10,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            borderLeft: '3px solid var(--accent-primary)',
          }}>
            <p style={{
              fontWeight: 700,
              fontSize: 15,
              color: 'var(--text-primary)',
              margin: '0 0 10px',
            }}>
              Will data be uploaded to a server?
            </p>
            <p style={{
              fontSize: 15,
              lineHeight: 1.75,
              color: 'var(--text-secondary)',
              margin: 0,
            }}>
              No. All computation is completed entirely in the browser locally.
              Data does not pass through any intermediate servers — 100% privacy safe.
            </p>
          </div>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-primary)', marginBottom: 52 }} />

        {/* xapi.to section */}
        <section style={{ marginBottom: 52 }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 20px', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Get API Keys via xapi.to
          </h3>

          <div style={{
            padding: '22px 24px', borderRadius: 12,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            marginBottom: 16,
          }}>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--text-secondary)', margin: '0 0 16px' }}>
              <strong style={{ color: 'var(--text-primary)' }}>xapi.to</strong> is an API gateway for the agentic web.
              Sign in with your Twitter / X account to instantly generate API keys that connect
              your Alpha Agent to live market data, AI models, and third-party trading services.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
              {[
                { title: 'One-click login',   desc: 'Sign in with Twitter/X — no email or password required.' },
                { title: 'Instant API Keys',  desc: 'Keys are provisioned immediately after authentication.' },
                { title: 'Agent-native',      desc: 'Designed for AI agents running 24/7 without human input.' },
                { title: 'Secure gateway',    desc: 'Rate limiting, key rotation, and usage analytics built in.' },
              ].map(f => (
                <div key={f.title} style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--bg-primary)', border: '1px solid var(--border-primary)' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: 'var(--text-primary)' }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <a
                href="https://www.xapi.to/console?loginMethod=twitter&tab=keys"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '11px 22px', borderRadius: 8,
                  background: 'var(--accent-primary)', color: '#fff',
                  fontWeight: 700, fontSize: 14, textDecoration: 'none',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                Sign in with Twitter · Get Keys ↗
              </a>
              <a
                href="https://www.xapi.to/"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '11px 18px', borderRadius: 8,
                  border: '1px solid var(--border-primary)',
                  color: 'var(--text-secondary)', fontSize: 14,
                  textDecoration: 'none', transition: 'border-color 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-primary)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
              >
                xapi.to home ↗
              </a>
            </div>
          </div>

          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
            After obtaining your key, paste it in{' '}
            <strong style={{ color: 'var(--text-primary)' }}>Config → API Keys</strong> or set it via the CLI:
          </p>
          <pre style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)',
            borderRadius: 8, padding: '12px 16px', fontSize: 12,
            fontFamily: "'IBM Plex Mono', monospace",
            color: 'var(--accent-primary)', margin: '10px 0 0', lineHeight: 1.7,
          }}>
            <code>{`python scripts/config.py --set anthropic_api_key=sk-ant-...
python scripts/config.py --set model_provider=anthropic`}</code>
          </pre>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-primary)', marginBottom: 52 }} />

        {/* Quick start */}
        <section style={{ marginBottom: 52 }}>
          <h3 style={{
            fontSize: 20,
            fontWeight: 700,
            margin: '0 0 20px',
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
          }}>
            Quick Start
          </h3>
          <pre style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            borderRadius: 10,
            padding: '18px 22px',
            fontSize: 13,
            fontFamily: "'IBM Plex Mono', monospace",
            color: 'var(--accent-primary)',
            overflowX: 'auto',
            margin: 0,
            lineHeight: 1.8,
          }}>
            <code>{`# Start backend
cd service/server && python3 main.py

# Start background worker (new terminal)
python3 worker.py

# Open in browser
http://localhost:3000`}</code>
          </pre>
        </section>

        {/* CTA */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 80 }}>
          <button
            onClick={() => navigate('/trade')}
            style={{
              padding: '12px 28px', borderRadius: 8,
              background: 'var(--accent-primary)',
              border: 'none', color: '#fff',
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}
          >
            Start Trading
          </button>
          <button
            onClick={() => navigate('/market')}
            style={{
              padding: '12px 28px', borderRadius: 8,
              border: '1px solid var(--border-primary)',
              background: 'none', color: 'var(--text-primary)',
              fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}
          >
            Browse Market
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-primary)',
        padding: '20px 48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 13,
        color: 'var(--text-muted)',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <span>Alpha Agent — Self-Hosted</span>
        <div style={{ display: 'flex', gap: 24 }}>
          {[
            { label: 'Trade', path: '/trade' },
            { label: 'Market', path: '/market' },
            { label: 'Leaderboard', path: '/leaderboard' },
          ].map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                background: 'none', border: 'none',
                color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13,
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </footer>
    </div>
  )
}
