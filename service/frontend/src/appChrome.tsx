import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Newspaper,
  BarChart2,
  Trophy,
  Target,
  Copy,
  TrendingUp,
  MessageSquare,
  Briefcase,
  ArrowUpDown,
  Gift,
  Settings,
  FlaskConical,
  Download,
  Users,
  Sun,
  Moon,
  type LucideIcon,
} from 'lucide-react'
import { type AgentInfo, hasPermission, useLanguage, useTheme } from './appShared'

export function Toast({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])
  return <div className={`toast ${type}`}>{message}</div>
}

export type NotificationCounts = {
  discussion: number
  strategy: number
  experiment: number
}

function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()
  return (
    <div className="control-pill-group">
      <button type="button" onClick={() => setLanguage('zh')} className={`control-pill ${language === 'zh' ? 'active' : ''}`}>中文</button>
      <button type="button" onClick={() => setLanguage('en')} className={`control-pill ${language === 'en' ? 'active' : ''}`}>EN</button>
    </div>
  )
}

function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      <Sun  size={15} className={`theme-icon sun  ${theme === 'light' ? 'active' : ''}`} />
      <Moon size={15} className={`theme-icon moon ${theme === 'dark'  ? 'active' : ''}`} />
    </button>
  )
}

export function TopbarControls() {
  return (
    <div className="topbar-controls">
      <ThemeSwitcher />
      <LanguageSwitcher />
    </div>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

type NavItem = {
  path: string
  Icon: LucideIcon
  label: string
  badge?: number
  category?: 'discussion' | 'strategy' | 'experiment'
}

export function Sidebar({
  agentInfo,
  notificationCounts,
  onMarkCategoryRead,
}: {
  token?: string | null
  agentInfo: AgentInfo | null
  onLogout?: () => void
  notificationCounts: NotificationCounts
  onMarkCategoryRead: (category: 'discussion' | 'strategy' | 'experiment') => void
}) {
  const location = useLocation()
  const { t, language } = useLanguage()
  const canUseExperiments    = hasPermission(agentInfo, 'experiment_admin')
  const canUseResearchExports = hasPermission(agentInfo, 'research_exports')
  const canUseTeamMissions   = hasPermission(agentInfo, 'team_mission_admin')
  const zh = language === 'zh'

  const navItems: NavItem[] = [
    { path: '/dashboard',       Icon: LayoutDashboard, label: zh ? '总览'     : 'Overview'        },
    { path: '/financial-events',Icon: Newspaper,       label: zh ? '金融事件'  : 'Financial Events' },
    { path: '/market',          Icon: BarChart2,       label: zh ? '交易市场'  : 'Market'           },
    { path: '/leaderboard',     Icon: Trophy,          label: zh ? '排行榜'   : 'Leaderboard'       },
    { path: '/challenges',      Icon: Target,          label: zh ? '挑战赛'   : 'Challenges'        },
    ...(canUseTeamMissions   ? [{ path: '/team-missions',   Icon: Users,        label: zh ? '团队任务'  : 'Team Missions'   }] : []),
    ...(canUseExperiments    ? [{ path: '/experiments',     Icon: FlaskConical, label: zh ? '实验'     : 'Experiments',     badge: notificationCounts.experiment, category: 'experiment' as const }] : []),
    ...(canUseResearchExports? [{ path: '/research-exports',Icon: Download,     label: zh ? '研究导出'  : 'Research Exports' }] : []),
    { path: '/copytrading',     Icon: Copy,            label: zh ? '跟单'     : 'Copy Trade'        },
    { path: '/strategies',      Icon: TrendingUp,      label: t.nav.strategies, badge: notificationCounts.strategy,   category: 'strategy'   as const },
    { path: '/discussions',     Icon: MessageSquare,   label: t.nav.discussions,badge: notificationCounts.discussion, category: 'discussion' as const },
    { path: '/positions',       Icon: Briefcase,       label: t.nav.positions  },
    { path: '/trade',           Icon: ArrowUpDown,     label: t.nav.trade      },
    { path: '/exchange',        Icon: Gift,            label: t.nav.exchange   },
    { path: '/config',          Icon: Settings,        label: zh ? '配置'     : 'Config'            },
  ]

  useEffect(() => {
    const activeItem = navItems.find(item => item.path === location.pathname)
    if (activeItem?.category && (activeItem.badge || 0) > 0) {
      onMarkCategoryRead(activeItem.category)
    }
  }, [location.pathname, notificationCounts.discussion, notificationCounts.strategy, notificationCounts.experiment])

  return (
    <div className="sidebar">
      {/* Logo */}
      <div className="logo">
        <div className="logo-icon">α</div>
        <span className="logo-text">Alpha Agent</span>
      </div>

      {/* Nav */}
      <nav className="nav-section">
        <div className="nav-section-title">{zh ? '导航' : 'Navigation'}</div>
        {navItems.map(item => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${isActive ? 'active' : ''}`}
              title={item.label}
              onClick={() => { if (item.category && (item.badge || 0) > 0) onMarkCategoryRead(item.category) }}
            >
              <span className="nav-icon" style={{ display: 'flex', alignItems: 'center' }}>
                <item.Icon size={16} strokeWidth={1.8} />
              </span>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 8 }}>
                <span>{item.label}</span>
                {(item.badge || 0) > 0 && (
                  <span style={{
                    minWidth: 18, height: 18, padding: '0 6px', borderRadius: 999,
                    background: '#ef4444', color: '#fff',
                    fontSize: 11, fontWeight: 700,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
                  }}>
                    {(item.badge ?? 0) > 99 ? '99+' : item.badge}
                  </span>
                )}
              </span>
            </Link>
          )
        })}
      </nav>

    </div>
  )
}
