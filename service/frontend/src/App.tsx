import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'

import {
  API_BASE,
  type AgentInfo,
  ExchangePage,
  FinancialEventsPage,
  LandingPage,
  LanguageContext,
  type NotificationCounts,
  NOTIFICATION_POLL_INTERVAL,
  PositionsPage,
  Sidebar,
  SignalsFeed,
  StrategiesPage,
  ThemeContext,
  type ThemeMode,
  Toast,
  TopbarControls,
  TradePage,
  TrendingSidebar,
  CopyTradingPage,
  DiscussionsPage,
  LeaderboardPage,
} from './AppPages'
import { ChallengePage } from './ChallengePage'
import { ExperimentAdminPage } from './ExperimentAdminPage'
import { ResearchExportsPage } from './ResearchExportsPage'
import { TeamMissionsPage } from './TeamMissionsPage'
import { ConfigPage } from './ConfigPage'
import { DashboardPage } from './DashboardPage'
import { Language, getT } from './i18n'
import { hasPermission } from './appShared'

const DISCUSSION_NOTIFICATION_TYPES = new Set([
  'discussion_started',
  'discussion_reply',
  'discussion_mention',
  'discussion_reply_accepted'
])

const STRATEGY_NOTIFICATION_TYPES = new Set([
  'strategy_published',
  'strategy_reply',
  'strategy_mention',
  'strategy_reply_accepted'
])

const EXPERIMENT_NOTIFICATION_TYPES = new Set([
  'experiment_announcement',
  'experiment_assignment',
  'experiment_reminder',
  'experiment_rule_update',
  'experiment_result_update',
  'challenge_invite',
  'team_mission_invite'
])


function App() {
  const [language, setLanguage] = useState<Language>('zh')
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const savedTheme = localStorage.getItem('ai_trader_theme')
    return savedTheme === 'light' ? 'light' : 'dark'
  })
  // Self-host mode: token is fetched automatically from backend on startup
  const [token, setToken] = useState<string | null>(null)
  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null)
  const [agentInfoLoading, setAgentInfoLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null)
  const [notificationCounts, setNotificationCounts] = useState<NotificationCounts>({ discussion: 0, strategy: 0, experiment: 0 })

  const t = getT(language)

  // Auto-login: fetch default owner token from backend on mount
  useEffect(() => {
    fetch(`${API_BASE}/setup/local-token`)
      .then(r => r.json())
      .then(data => { if (data.token) setToken(data.token) })
      .catch(console.error)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('ai_trader_theme', theme)
  }, [theme])

  const fetchAgentInfo = async () => {
    if (!token) return
    setAgentInfoLoading(true)
    try {
      const res = await fetch(`${API_BASE}/claw/agents/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setAgentInfo(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setAgentInfoLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchAgentInfo()
    } else {
      setAgentInfo(null)
      setAgentInfoLoading(false)
    }
  }, [token])

  const fetchUnreadSummary = async () => {
    if (!token) return
    try {
      const res = await fetch(`${API_BASE}/claw/messages/unread-summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) return
      const data = await res.json()
      setNotificationCounts({
        discussion: data.discussion_unread || 0,
        strategy: data.strategy_unread || 0,
        experiment: data.experiment_unread || 0
      })
    } catch (e) {
      console.error(e)
    }
  }

  const markCategoryRead = async (category: 'discussion' | 'strategy' | 'experiment') => {
    if (!token) return
    setNotificationCounts((prev) => ({ ...prev, [category]: 0 }))
    try {
      await fetch(`${API_BASE}/claw/messages/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ categories: [category] })
      })
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (!token) return
    fetchUnreadSummary()
    const interval = setInterval(fetchUnreadSummary, NOTIFICATION_POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [token])

  useEffect(() => {
    if (!agentInfo?.id || !token) return
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws/notify/${agentInfo.id}?token=${encodeURIComponent(token)}`
    const ws = new WebSocket(wsUrl)

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (DISCUSSION_NOTIFICATION_TYPES.has(payload?.type)) {
          setNotificationCounts((prev) => ({ ...prev, discussion: prev.discussion + 1 }))
        } else if (STRATEGY_NOTIFICATION_TYPES.has(payload?.type)) {
          setNotificationCounts((prev) => ({ ...prev, strategy: prev.strategy + 1 }))
        } else if (EXPERIMENT_NOTIFICATION_TYPES.has(payload?.type)) {
          setNotificationCounts((prev) => ({ ...prev, experiment: prev.experiment + 1 }))
        }
        if (payload?.content) {
          setToast({ message: payload.content, type: 'success' })
        }
      } catch (e) {
        console.error(e)
      }
    }

    return () => { ws.close() }
  }, [agentInfo?.id, token])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <LanguageContext.Provider value={{ language, setLanguage, t }}>
        <BrowserRouter>
          <AppRouter
            token={token}
            agentInfo={agentInfo}
            agentInfoLoading={agentInfoLoading}
            fetchAgentInfo={fetchAgentInfo}
            notificationCounts={notificationCounts}
            markCategoryRead={markCategoryRead}
          />

          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}
        </BrowserRouter>
      </LanguageContext.Provider>
    </ThemeContext.Provider>
  )
}

function AppRouter({
  token,
  agentInfo,
  agentInfoLoading,
  fetchAgentInfo,
  notificationCounts,
  markCategoryRead,
}: {
  token: string | null
  agentInfo: AgentInfo | null
  agentInfoLoading: boolean
  fetchAgentInfo: () => Promise<void>
  notificationCounts: NotificationCounts
  markCategoryRead: (category: 'discussion' | 'strategy' | 'experiment') => void
}) {
  const location = useLocation()
  const isLanding = location.pathname === '/'
  const canUseExperiments = hasPermission(agentInfo, 'experiment_admin')
  const canUseResearchExports = hasPermission(agentInfo, 'research_exports')
  const canUseTeamMissionAdmin = hasPermission(agentInfo, 'team_mission_admin')
  const permissionLoading = Boolean(token && agentInfoLoading)
  const permissionLoadingView = <div className="loading"><div className="spinner"></div></div>
  // While token is being fetched, show a loading placeholder for auth-required pages
  const tokenLoading = <div className="loading"><div className="spinner"></div></div>

  if (isLanding) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage token={token} />} />
      </Routes>
    )
  }

  return (
    <div className="app-container">
      <Sidebar
        token={token}
        agentInfo={agentInfo}
        onLogout={() => {}}
        notificationCounts={notificationCounts}
        onMarkCategoryRead={markCategoryRead}
      />

      <main className="main-content" style={{ display: 'flex', gap: '24px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
            <TopbarControls />
          </div>

          <Routes>
            <Route path="/market" element={<SignalsFeed token={token} />} />
            <Route path="/leaderboard" element={<LeaderboardPage token={token} />} />
            <Route path="/challenges" element={<ChallengePage token={token} />} />
            <Route path="/challenges/:challengeKey" element={<ChallengePage token={token} />} />
            <Route path="/team-missions" element={permissionLoading ? permissionLoadingView : canUseTeamMissionAdmin ? <TeamMissionsPage token={token} canAdmin={canUseTeamMissionAdmin} /> : <Navigate to="/market" replace />} />
            <Route path="/team-missions/:missionKey" element={permissionLoading ? permissionLoadingView : canUseTeamMissionAdmin ? <TeamMissionsPage token={token} canAdmin={canUseTeamMissionAdmin} /> : <Navigate to="/market" replace />} />
            <Route path="/teams/:teamKey" element={permissionLoading ? permissionLoadingView : canUseTeamMissionAdmin ? <TeamMissionsPage token={token} canAdmin={canUseTeamMissionAdmin} /> : <Navigate to="/market" replace />} />
            <Route path="/experiments" element={permissionLoading ? permissionLoadingView : canUseExperiments ? <ExperimentAdminPage token={token} /> : <Navigate to="/market" replace />} />
            <Route path="/research-exports" element={permissionLoading ? permissionLoadingView : canUseResearchExports && token ? <ResearchExportsPage token={token} /> : <Navigate to="/market" replace />} />
            <Route path="/dashboard" element={<DashboardPage token={token} />} />
            <Route path="/config" element={<ConfigPage />} />
            <Route path="/financial-events" element={<FinancialEventsPage />} />
            <Route path="/copytrading" element={token ? <CopyTradingPage token={token} /> : tokenLoading} />
            <Route path="/strategies" element={<StrategiesPage />} />
            <Route path="/discussions" element={<DiscussionsPage />} />
            <Route path="/positions" element={<PositionsPage />} />
            <Route path="/trade" element={token ? <TradePage token={token} agentInfo={agentInfo} onTradeSuccess={fetchAgentInfo} /> : tokenLoading} />
            <Route path="/exchange" element={token ? <ExchangePage token={token} onExchangeSuccess={fetchAgentInfo} /> : tokenLoading} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>

        <TrendingSidebar />
      </main>
    </div>
  )
}

export default App
