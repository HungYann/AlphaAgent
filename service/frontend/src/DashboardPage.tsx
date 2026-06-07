import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'
import { API_BASE, useLanguage } from './appShared'

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_AGENTS = [
  { agent_id: 1, name: 'Warren.ai',    total_profit: 18420,  total_profit_percent: 18.42, trade_count: 87,  spark: [100,103,101,107,112,108,115,118,116,122,118,124,130,128,135,133,140,138,145,143,150,148,155,152,160,158,165,163,168,166,172,170,175,174,178,176,180,182,184,183,186,188,190,189,192,194,196,195,198,200] },
  { agent_id: 2, name: 'Simons.q',     total_profit: 9870,   total_profit_percent: 9.87,  trade_count: 214, spark: [100,98,102,105,103,108,106,111,109,114,112,117,115,120,118,123,121,126,124,129,127,129,131,130,133,131,134,132,135,133,136,135,137,136,138,137,139,138,140,139,141,140,142,141,143,142,144,143,145,144] },
  { agent_id: 3, name: 'Dalio.r',      total_profit: 5340,   total_profit_percent: 5.34,  trade_count: 56,  spark: [100,101,100,102,101,103,102,104,103,105,104,106,105,107,106,108,107,109,108,110,109,111,110,112,111,113,112,114,113,115,114,116,115,117,116,118,117,119,118,120,119,121,120,122,121,123,122,124,123,124] },
  { agent_id: 4, name: 'Soros.macro',  total_profit: -2180,  total_profit_percent: -2.18, trade_count: 143, spark: [100,102,101,103,102,104,103,105,104,103,102,101,100,99,98,97,96,97,96,95,94,95,94,93,94,93,95,94,96,95,97,96,98,97,99,98,100,99,101,100,100,99,99,98,98,99,99,98,98,97] },
  { agent_id: 5, name: 'Lynch.growth', total_profit: -5620,  total_profit_percent: -5.62, trade_count: 312, spark: [100,101,100,99,98,97,98,97,96,95,96,95,94,93,94,93,92,93,92,91,92,91,90,91,90,89,90,89,88,89,88,87,88,87,86,87,86,85,86,85,86,85,84,85,84,85,84,83,84,83] },
]

const DEMO_SIGNALS = [
  { id: 1, agent: 'Warren.ai',    symbol: 'AAPL',  side: 'buy',   price: 213.50, qty: 50,   time: '14:32', market: 'us-stock' },
  { id: 2, agent: 'Simons.q',     symbol: 'BTC',   side: 'buy',   price: 67840,  qty: 0.15, time: '14:28', market: 'crypto'   },
  { id: 3, agent: 'Dalio.r',      symbol: 'NVDA',  side: 'sell',  price: 875.20, qty: 20,   time: '14:15', market: 'us-stock' },
  { id: 4, agent: 'Soros.macro',  symbol: 'ETH',   side: 'short', price: 3420,   qty: 2.5,  time: '13:58', market: 'crypto'   },
  { id: 5, agent: 'Warren.ai',    symbol: 'MSFT',  side: 'buy',   price: 415.30, qty: 30,   time: '13:44', market: 'us-stock' },
  { id: 6, agent: 'Lynch.growth', symbol: 'SOL',   side: 'cover', price: 142.80, qty: 40,   time: '13:31', market: 'crypto'   },
]

const DEMO_PORTFOLIO = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  value: 100000 + Math.sin(i / 4) * 8000 + i * 850 + Math.random() * 2000,
}))

const DEMO_POSITIONS = [
  { symbol: 'AAPL',  market: 'us-stock', side: 'long',  qty: 150, entry: 198.20, current: 213.50, pnl: 2295 },
  { symbol: 'BTC',   market: 'crypto',   side: 'long',  qty: 0.8, entry: 61200,  current: 67840,  pnl: 5312 },
  { symbol: 'NVDA',  market: 'us-stock', side: 'long',  qty: 40,  entry: 830.00, current: 875.20, pnl: 1808 },
  { symbol: 'ETH',   market: 'crypto',   side: 'short', qty: 5,   entry: 3650,   current: 3420,   pnl: 1150 },
  { symbol: 'TSLA',  market: 'us-stock', side: 'long',  qty: 60,  entry: 185.40, current: 178.30, pnl: -426 },
]

// ── Component ────────────────────────────────────────────────────────────────

interface Status {
  status: string; agent_count: number; position_count: number
  trade_count: number; total_cash: number; model_provider: string; default_skill: string
}

export function DashboardPage({ token: _token }: { token: string | null }) {
  const { language } = useLanguage()
  const zh = language === 'zh'
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'agents' | 'signals' | 'positions'>('agents')

  useEffect(() => {
    fetch(`${API_BASE}/status`)
      .then(r => r.json())
      .then(s => setStatus(s))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Merge real stats with demo counts as floor
  const stats = {
    agents:    Math.max(status?.agent_count    ?? 0, DEMO_AGENTS.length),
    positions: Math.max(status?.position_count ?? 0, DEMO_POSITIONS.length),
    trades:    Math.max(status?.trade_count    ?? 0, 812),
    cash:      Math.max(status?.total_cash     ?? 0, 512_400),
    provider:  status?.model_provider ?? 'local',
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 40, color: 'var(--text-secondary)', fontSize: 14 }}>
      <ConnectingDot />
      {zh ? '正在连接服务...' : 'Connecting to service...'}
    </div>
  )

  return (
    <div style={{ maxWidth: 960, paddingBottom: 60 }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.01em' }}>
            {zh ? '业务总览' : 'Overview'}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {zh ? '服务运行中' : 'Service running'} · {stats.provider}
            </span>
          </div>
        </div>
        <span style={{
          fontSize: 11, padding: '4px 10px', borderRadius: 999,
          background: 'rgba(212,164,88,0.1)', color: 'var(--accent-primary)',
          border: '1px solid rgba(212,164,88,0.25)', fontWeight: 600,
        }}>
          DEMO DATA
        </span>
      </div>

      {/* ── Stats cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: zh ? 'Agents' : 'Agents',       value: stats.agents,                        sub: zh ? '活跃中' : 'active' },
          { label: zh ? '持仓数' : 'Positions',     value: stats.positions,                     sub: zh ? '未平仓' : 'open'   },
          { label: zh ? '总交易笔' : 'Total Trades', value: stats.trades.toLocaleString(),       sub: zh ? '历史' : 'all-time' },
          { label: zh ? '资金池' : 'Portfolio',      value: `$${(stats.cash/1000).toFixed(0)}K`, sub: 'USD', accent: true      },
        ].map(c => (
          <div key={c.label} style={{
            padding: '16px 18px', borderRadius: 12,
            background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)',
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{c.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, color: (c as any).accent ? 'var(--accent-primary)' : 'var(--text-primary)' }}>{c.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Portfolio sparkline ── */}
      <div style={{ marginBottom: 28, padding: '18px 20px', borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            {zh ? '组合净值 (30日)' : 'Portfolio Value (30d)'}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>+25.4%</div>
        </div>
        <div style={{ height: 80 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={DEMO_PORTFOLIO}>
              <Line type="monotone" dataKey="value" stroke="var(--accent-primary)" strokeWidth={2} dot={false} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 8, fontSize: 12 }}
                formatter={(v: unknown) => [`$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, zh ? '净值' : 'Value']}
                labelFormatter={(l) => `Day ${l}`}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--border-primary)', paddingBottom: 0 }}>
        {([
          ['agents',    zh ? '顶级交易员' : 'Top Agents'],
          ['signals',   zh ? '最近信号'   : 'Recent Signals'],
          ['positions', zh ? '当前持仓'   : 'Positions'],
        ] as [typeof tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: '8px 16px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: 'none',
              color: tab === key ? 'var(--text-primary)' : 'var(--text-muted)',
              borderBottom: tab === key ? '2px solid var(--accent-primary)' : '2px solid transparent',
              marginBottom: -1,
              transition: 'color 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Top Agents ── */}
      {tab === 'agents' && (
        <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-primary)', marginBottom: 28 }}>
          {DEMO_AGENTS.map((a, i) => (
            <div key={a.agent_id} style={{
              display: 'grid', alignItems: 'center',
              gridTemplateColumns: '28px 36px 1fr 120px 80px',
              gap: 12, padding: '12px 18px',
              background: i % 2 === 0 ? 'var(--bg-secondary)' : 'var(--bg-primary)',
              borderBottom: i < DEMO_AGENTS.length - 1 ? '1px solid var(--border-primary)' : 'none',
            }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>#{i + 1}</span>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#fff' }}>
                {a.name.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{a.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.trade_count} {zh ? '笔' : 'trades'}</div>
              </div>
              {/* sparkline */}
              <div style={{ height: 32 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={a.spark.map((v, j) => ({ j, v }))}>
                    <Line type="monotone" dataKey="v" stroke={a.total_profit >= 0 ? '#10b981' : '#ef4444'} strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: a.total_profit >= 0 ? '#10b981' : '#ef4444' }}>
                  {a.total_profit >= 0 ? '+' : ''}{a.total_profit_percent.toFixed(2)}%
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {a.total_profit >= 0 ? '+' : ''}${Math.abs(a.total_profit).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab: Recent Signals ── */}
      {tab === 'signals' && (
        <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-primary)', marginBottom: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 90px 70px 60px', gap: 12, padding: '10px 18px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-primary)' }}>
            {[zh ? '交易员' : 'Agent', zh ? '标的' : 'Symbol', zh ? '方向' : 'Side', zh ? '价格' : 'Price', zh ? '数量' : 'Qty', zh ? '时间' : 'Time'].map(h => (
              <span key={h} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
            ))}
          </div>
          {DEMO_SIGNALS.map((s, i) => (
            <div key={s.id} style={{
              display: 'grid', alignItems: 'center',
              gridTemplateColumns: '1fr 80px 80px 90px 70px 60px',
              gap: 12, padding: '12px 18px',
              background: i % 2 === 0 ? 'var(--bg-secondary)' : 'var(--bg-primary)',
              borderBottom: i < DEMO_SIGNALS.length - 1 ? '1px solid var(--border-primary)' : 'none',
            }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{s.agent}</span>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{s.symbol}</span>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase',
                background: s.side === 'buy' ? 'rgba(16,185,129,0.15)' : s.side === 'sell' ? 'rgba(239,68,68,0.15)' : s.side === 'short' ? 'rgba(239,68,68,0.15)' : 'rgba(212,164,88,0.15)',
                color: s.side === 'buy' ? '#10b981' : s.side === 'sell' ? '#ef4444' : s.side === 'short' ? '#ef4444' : 'var(--accent-primary)',
                display: 'inline-block',
              }}>
                {s.side}
              </span>
              <span style={{ fontSize: 13, fontFamily: 'monospace' }}>${s.price.toLocaleString()}</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.qty}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.time}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab: Positions ── */}
      {tab === 'positions' && (
        <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-primary)', marginBottom: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 60px 90px 90px 80px', gap: 12, padding: '10px 18px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-primary)' }}>
            {[zh ? '标的' : 'Symbol', zh ? '市场' : 'Market', zh ? '方向' : 'Side', zh ? '成本' : 'Entry', zh ? '现价' : 'Current', 'P&L'].map(h => (
              <span key={h} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
            ))}
          </div>
          {DEMO_POSITIONS.map((p, i) => (
            <div key={p.symbol} style={{
              display: 'grid', alignItems: 'center',
              gridTemplateColumns: '1fr 70px 60px 90px 90px 80px',
              gap: 12, padding: '13px 18px',
              background: i % 2 === 0 ? 'var(--bg-secondary)' : 'var(--bg-primary)',
              borderBottom: i < DEMO_POSITIONS.length - 1 ? '1px solid var(--border-primary)' : 'none',
            }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{p.symbol}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>×{p.qty}</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.market === 'us-stock' ? 'Stock' : 'Crypto'}</span>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase',
                background: p.side === 'long' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                color: p.side === 'long' ? '#10b981' : '#ef4444',
                display: 'inline-block',
              }}>{p.side}</span>
              <span style={{ fontSize: 13, fontFamily: 'monospace' }}>${p.entry.toLocaleString()}</span>
              <span style={{ fontSize: 13, fontFamily: 'monospace' }}>${p.current.toLocaleString()}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: p.pnl >= 0 ? '#10b981' : '#ef4444' }}>
                {p.pnl >= 0 ? '+' : ''}${p.pnl.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Quick actions ── */}
      <div style={{ marginBottom: 28 }}>
        <SectionTitle>{zh ? '快捷操作' : 'Quick Actions'}</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
          {[
            { label: zh ? '开始交易' : 'Trade',      path: '/trade',        desc: zh ? '提交买卖信号' : 'Submit signals' },
            { label: zh ? '交易市场' : 'Market',      path: '/market',       desc: zh ? '信号与持仓' : 'Signals & positions' },
            { label: zh ? '排行榜' : 'Leaderboard',   path: '/leaderboard',  desc: zh ? '收益排名' : 'P&L ranking' },
            { label: zh ? '跟单' : 'Copy Trade',      path: '/copytrading',  desc: zh ? '复制顶级交易员' : 'Mirror top traders' },
            { label: zh ? '挑战赛' : 'Challenges',    path: '/challenges',   desc: zh ? '参与竞赛' : 'Join contests' },
            { label: zh ? '配置' : 'Config',          path: '/config',       desc: zh ? 'API Key 与模型' : 'API keys & model' },
          ].map(a => (
            <button key={a.path} onClick={() => navigate(a.path)} style={{
              padding: '14px 16px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
              background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', transition: 'border-color 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-primary)')}
            >
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 3 }}>{a.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── CLI hint ── */}
      <div style={{ padding: '14px 18px', borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderLeft: '3px solid var(--accent-primary)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
          {zh ? '命令行工具' : 'CLI Tools'}
        </div>
        <pre style={{ margin: 0, fontSize: 12, fontFamily: 'monospace', color: 'var(--accent-primary)', lineHeight: 1.8 }}>
{`python scripts/status.py      # ${zh ? '查看当前状态' : 'check status'}
python scripts/trade.py       # ${zh ? '运行交易 bot' : 'run trading bot'}
python scripts/market.py      # ${zh ? '获取市场数据' : 'fetch market data'}
python scripts/config.py      # ${zh ? '管理配置' : 'manage config'}`}
        </pre>
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
      {children}
    </div>
  )
}

function ConnectingDot() {
  return (
    <span style={{
      width: 8, height: 8, borderRadius: '50%',
      background: 'var(--accent-primary)', display: 'inline-block',
      animation: 'pulse 1.2s ease-in-out infinite',
    }} />
  )
}
