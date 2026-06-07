import { useEffect, useState } from 'react'
import { API_BASE, useLanguage } from './appShared'

interface Config {
  model_provider: string
  anthropic_api_key: string
  openai_api_key: string
  deepseek_api_key: string
  model_name: string
  default_skill: string
  trade_fee_rate: number
  initial_capital: number
  price_refresh_interval: number
  max_parallel_price_fetch: number
}

const PROVIDERS = [
  { value: 'local', label: 'Local (Buffett Skill)', desc: 'No API key required' },
  { value: 'anthropic', label: 'Anthropic Claude', desc: 'claude-3-5-sonnet / opus' },
  { value: 'openai', label: 'OpenAI GPT-4o', desc: 'gpt-4o / gpt-4o-mini' },
  { value: 'deepseek', label: 'DeepSeek', desc: 'deepseek-chat' },
]

export function ConfigPage() {
  const { language } = useLanguage()
  const zh = language === 'zh'
  const [config, setConfig] = useState<Config | null>(null)
  const [form, setForm] = useState<Partial<Config>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showKeys, setShowKeys] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/config/raw`)
      .then(r => r.json())
      .then(d => {
        setConfig(d.config)
        setForm(d.config)
      })
      .catch(console.error)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`${API_BASE}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await res.json()
      if (d.success) {
        setConfig(d.config)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  const handleReset = async () => {
    if (!confirm(zh ? '确认恢复默认配置？' : 'Reset to defaults?')) return
    const res = await fetch(`${API_BASE}/config/reset`, { method: 'POST' })
    const d = await res.json()
    if (d.success) { setConfig(d.config); setForm(d.config) }
  }

  const field = (key: keyof Config, label: string, type = 'text', placeholder = '') => (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </label>
      <input
        type={type === 'password' && !showKeys ? 'password' : type === 'password' ? 'text' : type}
        value={(form[key] ?? '') as string | number}
        placeholder={placeholder}
        onChange={e => setForm(f => ({ ...f, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 8,
          border: '1px solid var(--border-primary)',
          background: 'var(--bg-primary)', color: 'var(--text-primary)',
          fontSize: 14, fontFamily: type === 'password' ? 'monospace' : 'inherit',
          outline: 'none',
        }}
      />
    </div>
  )

  if (!config) return (
    <div style={{ padding: 40, color: 'var(--text-secondary)', fontSize: 14 }}>
      {zh ? '加载配置中...' : 'Loading config...'}
    </div>
  )

  return (
    <div style={{ maxWidth: 680, paddingBottom: 60 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.01em' }}>
          {zh ? '系统配置' : 'Configuration'}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
          {zh
            ? '所有配置保存在本地，数据不上传到任何服务器'
            : 'All settings stored locally. No data leaves your machine.'}
        </p>
      </div>

      {/* xapi.to callout */}
      <div style={{
        marginBottom: 24, padding: '14px 18px', borderRadius: 10,
        background: 'rgba(212,164,88,0.06)',
        border: '1px solid rgba(212,164,88,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 3 }}>
            {zh ? '需要 API Key？' : 'Need an API Key?'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {zh
              ? '通过 xapi.to 用 Twitter/X 账号一键登录，即刻获取密钥'
              : 'Sign in with Twitter/X at xapi.to to instantly generate keys'}
          </div>
        </div>
        <a
          href="https://www.xapi.to/console?loginMethod=twitter&tab=keys"
          target="_blank"
          rel="noreferrer"
          style={{
            padding: '9px 18px', borderRadius: 8, whiteSpace: 'nowrap',
            background: 'var(--accent-primary)', color: '#fff',
            fontWeight: 600, fontSize: 13, textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          {zh ? '获取 API Key ↗' : 'Get API Key ↗'}
        </a>
      </div>

      {/* AI Model */}
      <Section title={zh ? 'AI 模型' : 'AI Model'}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {zh ? '模型提供商' : 'Provider'}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
            {PROVIDERS.map(p => (
              <button
                key={p.value}
                onClick={() => setForm(f => ({ ...f, model_provider: p.value }))}
                style={{
                  padding: '12px 14px', borderRadius: 10, textAlign: 'left',
                  border: `2px solid ${form.model_provider === p.value ? 'var(--accent-primary)' : 'var(--border-primary)'}`,
                  background: form.model_provider === p.value ? 'rgba(212,164,88,0.08)' : 'var(--bg-primary)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', marginBottom: 3 }}>{p.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {form.model_provider !== 'local' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
              <button
                onClick={() => setShowKeys(s => !s)}
                style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {showKeys ? (zh ? '隐藏 Key' : 'Hide keys') : (zh ? '显示 Key' : 'Show keys')}
              </button>
            </div>
            {form.model_provider === 'anthropic' && field('anthropic_api_key', 'Anthropic API Key', 'password', 'sk-ant-...')}
            {form.model_provider === 'openai' && field('openai_api_key', 'OpenAI API Key', 'password', 'sk-...')}
            {form.model_provider === 'deepseek' && field('deepseek_api_key', 'DeepSeek API Key', 'password', 'sk-...')}
            {field('model_name', zh ? '模型名称（留空自动选择）' : 'Model Name (leave empty for default)', 'text', 'e.g. claude-3-5-sonnet-20241022')}
          </>
        )}
      </Section>

      {/* Trading */}
      <Section title={zh ? '交易参数' : 'Trading Parameters'}>
        {field('trade_fee_rate', zh ? '手续费率' : 'Fee Rate', 'number', '0.001')}
        {field('initial_capital', zh ? '初始资金 (USD)' : 'Initial Capital (USD)', 'number', '100000')}
        {field('default_skill', zh ? '默认策略 Skill' : 'Default Skill', 'text', 'buffett')}
      </Section>

      {/* Performance */}
      <Section title={zh ? '性能' : 'Performance'}>
        {field('price_refresh_interval', zh ? '价格刷新间隔（秒）' : 'Price Refresh Interval (s)', 'number', '300')}
        {field('max_parallel_price_fetch', zh ? '最大并行价格请求数' : 'Max Parallel Price Fetches', 'number', '5')}
      </Section>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '11px 28px', borderRadius: 8,
            background: saved ? 'var(--success)' : 'var(--accent-primary)',
            border: 'none', color: '#fff',
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}
        >
          {saving ? (zh ? '保存中...' : 'Saving...') : saved ? (zh ? '已保存' : 'Saved!') : (zh ? '保存配置' : 'Save Config')}
        </button>
        <button
          onClick={handleReset}
          style={{
            padding: '11px 20px', borderRadius: 8,
            border: '1px solid var(--border-primary)',
            background: 'none', color: 'var(--text-secondary)',
            fontSize: 14, cursor: 'pointer',
          }}
        >
          {zh ? '恢复默认' : 'Reset Defaults'}
        </button>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      marginBottom: 32, padding: '20px 22px', borderRadius: 12,
      background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)',
    }}>
      <h3 style={{ margin: '0 0 18px', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {title}
      </h3>
      {children}
    </div>
  )
}
