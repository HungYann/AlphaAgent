import { useEffect, useMemo, useState, type FormEvent } from 'react'
import LandingDoc from './LandingDoc'
import { useLocation, useNavigate } from 'react-router-dom'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import {
  API_BASE,
  type AgentInfo,
  COPY_TRADING_PAGE_SIZE,
  FINANCIAL_NEWS_PAGE_SIZE,
  LEADERBOARD_LINE_COLORS,
  LEADERBOARD_PAGE_SIZE,
  MARKETS,
  REFRESH_INTERVAL,
  SIGNALS_FEED_PAGE_SIZE,
  type LeaderboardChartRange,
  type MarketIntelNewsCategory,
  LeaderboardTooltip,
  buildLeaderboardChartData,
  formatIntelNumber,
  formatIntelTimestamp,
  getCurrentETTime,
  getInstrumentLabel,
  getLeaderboardDays,
  isUSMarketOpen,
  useLanguage,
} from './appShared'
// TopbarControls re-exported via export * from './appChrome' below

export * from './appShared'
export * from './appChrome'
export * from './appCommunityPages'

export function LandingPage({ token: _token }: { token: string | null }) {
  return <LandingDoc />
}

// ── Mock data for FinancialEventsPage (fallback when API keys not configured) ─

const _h = (hours: number) => new Date(Date.now() - hours * 3600_000).toISOString()

const MOCK_MACRO = {
  available: true,
  verdict: 'bullish',
  bullish_count: 7,
  total_count: 10,
  created_at: _h(0),
  meta: { model: 'Alpha Agent Demo', source: 'Simulated — Alpha Agent Self-Hosted' },
  signals: [
    { indicator: 'Fed Funds Rate', value: '5.25–5.50%', signal: 'neutral', summary: 'FOMC held rates steady for the 6th consecutive meeting. Markets now pricing one 25bp cut in Q4 2025. Fed Chair noted "further progress needed" on inflation before easing.' },
    { indicator: 'US CPI (YoY)', value: '3.1%', signal: 'bullish', summary: 'April CPI rose 3.1% YoY, down from 3.5% the prior month. Energy -2.2% provided relief; owners\' equivalent rent (+5.6%) remains the largest drag toward the 2% target.' },
    { indicator: 'Core PCE (YoY)', value: '2.7%', signal: 'bullish', summary: 'Fed\'s preferred inflation gauge eased to 2.7%, its lowest reading since March 2021, suggesting the disinflationary trend remains intact despite recent stickiness.' },
    { indicator: 'Non-Farm Payrolls', value: '+256K', signal: 'bullish', summary: 'April NFP beat consensus of +210K. Unemployment ticked up to 3.9% but wage growth moderated to 3.9% YoY — a "Goldilocks" print for risk assets.' },
    { indicator: 'US GDP Growth (QoQ ann.)', value: '+2.8%', signal: 'bullish', summary: 'Q1 2025 GDP grew 2.8% annualized, led by personal consumption (+3.1%) and government spending. Business fixed investment declined 0.8%, weighing on the headline.' },
    { indicator: 'ISM Manufacturing PMI', value: '49.2', signal: 'bearish', summary: 'Manufacturing contracted for the 3rd consecutive month. New orders sub-index fell to 47.8; prices paid rose to 58.2 — stagflationary pressure in goods sector.' },
    { indicator: 'Yield Curve (10Y–2Y)', value: '+18 bp', signal: 'bullish', summary: 'The curve has re-steepened from -107bp trough, suggesting peak inversion is behind us. Historically, positive re-steepening precedes equity bull runs within 12 months.' },
    { indicator: 'VIX (Volatility Index)', value: '14.8', signal: 'bullish', summary: 'Sub-15 VIX indicates complacency; historically consistent with continued S&P 500 upside in near term. Tail-risk hedges remain cheap — ideal time to add convexity.' },
    { indicator: 'DXY (Dollar Index)', value: '104.2', signal: 'neutral', summary: 'USD consolidating in a tight range. EUR/USD near 1.085 support; USD/JPY above 155 drawing BOJ intervention risk. EM currencies showing resilience despite high US rates.' },
    { indicator: 'WTI Crude Oil', value: '$81.4 / bbl', signal: 'bearish', summary: 'OPEC+ voluntary cuts partially offset by rising US shale output (+1.1M bpd YoY). Demand outlook softens as China industrial activity disappoints. EIA inventory builds pressure price.' },
  ],
}

const MOCK_ETF = {
  available: true,
  created_at: _h(1),
  summary: {
    direction: 'inflow',
    net_flow_b: 4.2,
    description: 'Strong equity ETF inflows led by tech/AI rotation; bond ETFs see redemptions',
  },
  etfs: [
    { symbol: 'SPY',  name: 'SPDR S&P 500 ETF Trust',       flow: 'inflow',  flow_b: 1.82, price: 523.40, change_pct:  0.42 },
    { symbol: 'QQQ',  name: 'Invesco QQQ (Nasdaq-100)',      flow: 'inflow',  flow_b: 1.24, price: 448.20, change_pct:  0.68 },
    { symbol: 'IBIT', name: 'iShares Bitcoin Trust ETF',     flow: 'inflow',  flow_b: 0.64, price: 38.90,  change_pct:  1.84 },
    { symbol: 'IWM',  name: 'iShares Russell 2000 ETF',      flow: 'inflow',  flow_b: 0.54, price: 205.80, change_pct:  0.31 },
    { symbol: 'GLD',  name: 'SPDR Gold Shares',              flow: 'inflow',  flow_b: 0.38, price: 192.30, change_pct:  0.55 },
    { symbol: 'XLK',  name: 'Technology Select Sector SPDR', flow: 'inflow',  flow_b: 0.22, price: 214.60, change_pct:  0.93 },
    { symbol: 'TLT',  name: 'iShares 20Y+ Treasury Bond',    flow: 'outflow', flow_b: -0.44, price: 94.20, change_pct: -0.18 },
    { symbol: 'HYG',  name: 'iShares iBoxx HY Corp Bond',    flow: 'outflow', flow_b: -0.28, price: 77.40, change_pct: -0.12 },
    { symbol: 'XLE',  name: 'Energy Select Sector SPDR',     flow: 'outflow', flow_b: -0.31, price: 93.60, change_pct: -0.22 },
  ],
}

const MOCK_STOCKS = {
  items: [
    {
      symbol: 'NVDA', available: true, current_price: 875.20, currency: 'USD',
      signal: 'strong_buy', signal_score: 8.7, trend_status: 'uptrend',
      support_levels: [820, 790, 750], resistance_levels: [900, 950, 1000],
      bullish_factors: ['Data center revenue +427% YoY in Q1 FY26', 'Blackwell GPU backlog exceeds 12-month supply', 'Gross margin expansion to 78.4%', 'AI inference workloads doubling adoption pace'],
      risk_factors: ['Forward P/E at 40x warrants premium execution', 'Hyperscaler custom silicon (TPU/Trainium) threatens long-term share', 'US export controls on H20 chip to China'],
      summary_text: 'NVDA is the defining AI infrastructure trade. Blackwell ramp de-risks near-term supply concerns. Every 1% gain in data center market share adds ~$2B to revenue. Technical breakout above $840 targets $940.',
      analysis: { moving_averages: { ma5: 868, ma10: 855, ma20: 832, ma60: 780 }, return_5d_pct: 2.4, return_20d_pct: 11.8, distance_to_support_pct: 6.3, distance_to_resistance_pct: 2.8 },
      created_at: _h(1),
    },
    {
      symbol: 'AAPL', available: true, current_price: 213.50, currency: 'USD',
      signal: 'buy', signal_score: 7.2, trend_status: 'uptrend',
      support_levels: [200, 190, 178], resistance_levels: [225, 240, 250],
      bullish_factors: ['Services revenue +15% YoY reaching $24B/quarter', 'Active device install base >2.2B globally', '$90B buyback authorization provides EPS floor', 'Apple Intelligence differentiates iPhone 17 upgrade cycle'],
      risk_factors: ['China revenue (18%) exposed to tariff/geopolitical risk', 'EU DMA compliance costs and app store revenue pressure', 'AI monetization timeline uncertain'],
      summary_text: 'Apple\'s capital return program ($90B buyback + dividend) provides strong downside support. Services multiple expansion story intact. Wait for pullback to $200 for ideal entry; accumulate on weakness.',
      analysis: { moving_averages: { ma5: 211, ma10: 208, ma20: 203, ma60: 195 }, return_5d_pct: 1.2, return_20d_pct: 8.5, distance_to_support_pct: 6.7, distance_to_resistance_pct: 5.4 },
      created_at: _h(2),
    },
    {
      symbol: 'BTC', available: true, current_price: 67840, currency: 'USD',
      signal: 'buy', signal_score: 7.8, trend_status: 'uptrend',
      support_levels: [62000, 58000, 52000], resistance_levels: [72000, 80000, 100000],
      bullish_factors: ['Spot ETF net inflows averaging $218M/day (trailing 30d)', 'April halving reduced block reward to 3.125 BTC', 'On-chain long-term holder supply at 5-year high', 'MicroStrategy + sovereign wealth fund accumulation'],
      risk_factors: ['Mt.Gox creditor repayment ($9B) creates selling overhang', 'Regulatory risk in key jurisdictions (SEC, MiCA)', 'Macro deleveraging event could trigger 30–40% drawdown'],
      summary_text: 'Post-halving supply shock thesis intact. ETF inflows absorbing 3-4x daily issuance. Historical pattern: new ATH typically occurs 6–12 months post-halving. Accumulate on dips to $60K–$62K range.',
      analysis: { moving_averages: { ma5: 66800, ma10: 65200, ma20: 62000, ma60: 55000 }, return_5d_pct: 4.8, return_20d_pct: 22.4, distance_to_support_pct: 8.6, distance_to_resistance_pct: 6.1 },
      created_at: _h(3),
    },
    {
      symbol: 'TSLA', available: true, current_price: 178.30, currency: 'USD',
      signal: 'neutral', signal_score: 5.1, trend_status: 'consolidation',
      support_levels: [165, 152, 138], resistance_levels: [195, 210, 228],
      bullish_factors: ['FSD v12.4 achieving ~30% fewer interventions vs prior version', 'Cybertruck ramp accelerating (20K/quarter target)', 'Energy storage business growing 130% YoY'],
      risk_factors: ['EV price war compressing automotive gross margin to 17%', 'CEO distraction risk from X/SpaceX ventures', 'China competition from BYD intensifying'],
      summary_text: 'Tesla at an inflection: auto margins bottoming while energy/FSD create optionality. Not a screaming buy, but the $165 support is robust. Watch Q2 delivery numbers for direction. Energy business alone worth $50/share.',
      analysis: { moving_averages: { ma5: 180, ma10: 183, ma20: 190, ma60: 195 }, return_5d_pct: -1.4, return_20d_pct: -6.2, distance_to_support_pct: 7.5, distance_to_resistance_pct: 9.4 },
      created_at: _h(4),
    },
  ],
}

// ── News mock data ────────────────────────────────────────────────────────────
// Sources: Reuters (reuters.com), Bloomberg (bloomberg.com), WSJ (wsj.com),
//          FT (ft.com), CNBC (cnbc.com), MarketWatch (marketwatch.com),
//          CoinDesk (coindesk.com), The Block (theblock.co), Decrypt (decrypt.co),
//          CoinTelegraph (cointelegraph.com), Blockworks (blockworks.co),
//          BLS (bls.gov), Fed (federalreserve.gov), Barron's (barrons.com)

const MOCK_NEWS = {
  categories: [
    // ── Equities ──────────────────────────────────────────────────────────────
    {
      category: 'equities',
      label: 'Equities',
      label_zh: '股票',
      description: 'US & global equity market news',
      description_zh: '美股及全球股票市场新闻',
      items: [
        {
          title: 'NVIDIA Blows Past Estimates with $26B Quarter; Blackwell Demand "Insane"',
          url: 'https://www.reuters.com',
          source: 'Reuters',
          time_published: _h(1.5),
          summary: 'NVIDIA reported Q1 FY2026 revenue of $26.04B, surging 262% YoY and beating the $24.6B consensus. CEO Jensen Huang described Blackwell GPU demand as "insane," adding that every customer is "chomping at the bit." Data center revenue hit $22.6B (+427%). The company guided Q2 revenue to $28.0B ± 2%, again above consensus of $26.8B. Gross margins expanded to 78.4%, a record high.',
          overall_sentiment_label: 'Bullish',
          ticker_sentiment: [{ ticker: 'NVDA', ticker_sentiment_label: 'Bullish' }],
        },
        {
          title: 'Apple Announces AI-Powered iPhone 17 Features; Wall Street Raises Targets',
          url: 'https://www.bloomberg.com',
          source: 'Bloomberg',
          time_published: _h(3),
          summary: 'Apple unveiled its most comprehensive AI integration at WWDC 2025, including on-device Siri Pro powered by its own 3nm neural engine and cloud offloading via Apple Intelligence servers. JPMorgan raised its AAPL target to $240 (from $210) citing "AI feature set creating a compelling upgrade catalyst for the ~300M iPhones aged 4+ years." Morgan Stanley upgraded to Overweight with a $255 target.',
          overall_sentiment_label: 'Bullish',
          ticker_sentiment: [{ ticker: 'AAPL', ticker_sentiment_label: 'Bullish' }],
        },
        {
          title: 'S&P 500 Hits Fresh All-Time High as Soft Landing Narrative Solidifies',
          url: 'https://www.wsj.com',
          source: 'The Wall Street Journal',
          time_published: _h(5),
          summary: 'The S&P 500 closed at 5,432, a new all-time high, as a combination of cooling inflation data and resilient corporate earnings reinforced the soft-landing thesis. Breadth was notably strong — 78% of stocks advanced. The equal-weighted S&P rose 0.9%, outpacing the cap-weighted index for the second consecutive session, suggesting the rally is broadening beyond the "Magnificent 7."',
          overall_sentiment_label: 'Bullish',
          ticker_sentiment: [{ ticker: 'SPY', ticker_sentiment_label: 'Bullish' }, { ticker: 'QQQ', ticker_sentiment_label: 'Bullish' }],
        },
        {
          title: 'Microsoft Azure AI Revenue Surges 80%; Copilot Adoption Beats Targets',
          url: 'https://www.cnbc.com',
          source: 'CNBC',
          time_published: _h(8),
          summary: 'Microsoft reported fiscal Q3 revenue of $61.9B (+17% YoY), with Azure growing 31% — accelerating from 28% last quarter. AI-attributed Azure revenue was "approximately 8 percentage points" of cloud growth. CEO Satya Nadella said GitHub Copilot now has 1.8M paid subscribers. Free cash flow hit $20.3B, enabling continued investment in OpenAI partnership and data center capex of $14B.',
          overall_sentiment_label: 'Bullish',
          ticker_sentiment: [{ ticker: 'MSFT', ticker_sentiment_label: 'Bullish' }],
        },
        {
          title: 'Tesla Q1 Deliveries Miss; Gross Margin Stabilizes at 17.4%',
          url: 'https://www.barrons.com',
          source: "Barron's",
          time_published: _h(12),
          summary: 'Tesla delivered 386,810 vehicles in Q1 2025, missing the 410,000 consensus estimate but beating the company\'s internal 380,000 target. Automotive gross margin stabilized at 17.4% after four consecutive quarters of decline. Management pointed to Model Y refresh ramp and growing Cybertruck production (now 8K/week) as positive catalysts. Energy storage deployments hit a record 4.1 GWh (+130% YoY).',
          overall_sentiment_label: 'Neutral',
          ticker_sentiment: [{ ticker: 'TSLA', ticker_sentiment_label: 'Neutral' }],
        },
        {
          title: 'Warren Buffett Reveals $5B New Position in Occidental; Trims Apple Slightly',
          url: 'https://www.ft.com',
          source: 'Financial Times',
          time_published: _h(18),
          summary: 'Berkshire Hathaway\'s 13F filing disclosed a new $5.1B position in Occidental Petroleum, bringing total OXY exposure to $18.6B (28% stake). Buffett trimmed Apple by 4% — still Berkshire\'s largest holding at $174B market value. The filing also revealed a new $900M stake in Chubb and complete exit from HP Inc. Berkshire\'s cash pile stands at $189B, a record.',
          overall_sentiment_label: 'Bullish',
          ticker_sentiment: [{ ticker: 'OXY', ticker_sentiment_label: 'Bullish' }, { ticker: 'AAPL', ticker_sentiment_label: 'Neutral' }],
        },
        {
          title: 'Meta Reports Record Q1; Zuckerberg Doubles Down on AI Infrastructure Spending',
          url: 'https://www.marketwatch.com',
          source: 'MarketWatch',
          time_published: _h(24),
          summary: 'Meta Platforms reported Q1 revenue of $36.5B (+27% YoY), with operating income soaring to $13.8B (+91%). Daily active users across the Family of Apps rose to 3.24B. CEO Mark Zuckerberg raised 2025 capex guidance to $37–40B (from $35–37B), citing accelerating AI compute requirements. Llama 4 open-source model launch is expected to drive developer ecosystem lock-in.',
          overall_sentiment_label: 'Bullish',
          ticker_sentiment: [{ ticker: 'META', ticker_sentiment_label: 'Bullish' }],
        },
      ],
    },
    // ── Crypto ────────────────────────────────────────────────────────────────
    {
      category: 'crypto',
      label: 'Crypto',
      label_zh: '加密货币',
      description: 'Cryptocurrency & blockchain news',
      description_zh: '加密货币与区块链新闻',
      items: [
        {
          title: 'Bitcoin Spot ETFs Cross $60B AUM; BlackRock IBIT Surpasses Silver ETF',
          url: 'https://www.coindesk.com',
          source: 'CoinDesk',
          time_published: _h(2),
          summary: 'US spot Bitcoin ETFs collectively surpassed $60B in assets under management, with BlackRock\'s IBIT becoming the fastest-growing ETF in history — now larger than the SLV Silver ETF at $13.2B. Single-day net inflows hit $1.24B on Tuesday, driven by institutional demand ahead of quarterly rebalancing. Analysts at Galaxy Digital project total ETF AUM reaching $100B by year-end.',
          overall_sentiment_label: 'Bullish',
          ticker_sentiment: [{ ticker: 'BTC', ticker_sentiment_label: 'Bullish' }],
        },
        {
          title: 'Ethereum Dencun Upgrade Slashes Layer-2 Transaction Costs by 90%',
          url: 'https://theblock.co',
          source: 'The Block',
          time_published: _h(6),
          summary: 'Six months post-Dencun, on-chain data confirms blob transactions have reduced L2 fees by 87–92% across Arbitrum, Optimism, and Base. Base (Coinbase\'s L2) now processes 6.2M daily transactions at average fees of $0.003. Ethereum\'s net issuance turned negative (-0.8% annualized) as EIP-4844 blob fees are burned. Pectra upgrade slated for Q3 2025 will add EIP-7702 for account abstraction.',
          overall_sentiment_label: 'Bullish',
          ticker_sentiment: [{ ticker: 'ETH', ticker_sentiment_label: 'Bullish' }],
        },
        {
          title: 'Solana DeFi TVL Hits $9B; Breakpoint Conference Draws 25,000 Developers',
          url: 'https://decrypt.co',
          source: 'Decrypt',
          time_published: _h(10),
          summary: 'Solana\'s total value locked in DeFi protocols reached $9.2B, up 380% in 12 months, according to DeFiLlama. Jupiter DEX processed $8.4B in weekly volume, briefly eclipsing Uniswap. The Breakpoint developer conference in Singapore attracted over 25,000 attendees — a record. Key announcements included Firedancer validator client entering public testnet, promising 1M+ TPS throughput.',
          overall_sentiment_label: 'Bullish',
          ticker_sentiment: [{ ticker: 'SOL', ticker_sentiment_label: 'Bullish' }],
        },
        {
          title: 'Binance Settles US Regulatory Case for $4.3B; CZ Completes Sentence',
          url: 'https://cointelegraph.com',
          source: 'CoinTelegraph',
          time_published: _h(16),
          summary: 'Changpeng "CZ" Zhao completed his 4-month federal sentence and officially stepped down from Binance\'s board. The exchange confirmed settlement terms have been fulfilled, with Binance now operating under full US monitor oversight. CEO Richard Teng highlighted Binance\'s compliance overhaul: 750 compliance staff added, transaction monitoring upgraded, and all US users migrated to Binance.US. Trading volume recovered to 95% of pre-settlement levels.',
          overall_sentiment_label: 'Neutral',
          ticker_sentiment: [{ ticker: 'BNB', ticker_sentiment_label: 'Neutral' }],
        },
        {
          title: 'MicroStrategy Acquires Additional 11,931 BTC for $786M; Total Holdings 214,400 BTC',
          url: 'https://blockworks.co',
          source: 'Blockworks',
          time_published: _h(22),
          summary: 'MicroStrategy announced the purchase of 11,931 Bitcoin for approximately $786M at an average price of $65,883 per BTC. Total corporate Bitcoin holdings now stand at 214,400 BTC — roughly 1% of all Bitcoin ever to exist. The company funded the purchase through a $700M convertible senior notes offering at 0.875% interest. Chairman Michael Saylor reiterated a "forever" holding strategy, calling Bitcoin "digital capital."',
          overall_sentiment_label: 'Bullish',
          ticker_sentiment: [{ ticker: 'BTC', ticker_sentiment_label: 'Bullish' }, { ticker: 'MSTR', ticker_sentiment_label: 'Bullish' }],
        },
        {
          title: 'Hong Kong Approves First Spot ETH ETF; Asian Institutions Eye Allocation',
          url: 'https://www.coindesk.com',
          source: 'CoinDesk',
          time_published: _h(30),
          summary: 'The Hong Kong Securities and Futures Commission approved two spot Ethereum ETFs from Harvest Fund Management and Bosera Asset Management. Combined launch AUM estimated at $300M. The move follows Hong Kong\'s Bitcoin ETF approvals and positions the city as Asia\'s leading digital-asset hub. Analysts expect the approval to accelerate US SEC consideration of a spot ETH ETF, potentially before year-end.',
          overall_sentiment_label: 'Bullish',
          ticker_sentiment: [{ ticker: 'ETH', ticker_sentiment_label: 'Bullish' }],
        },
      ],
    },
    // ── Macro ─────────────────────────────────────────────────────────────────
    {
      category: 'macro',
      label: 'Macro',
      label_zh: '宏观',
      description: 'Global macroeconomic & central bank news',
      description_zh: '全球宏观经济与央行政策',
      items: [
        {
          title: 'US CPI April: 3.1% YoY — Lowest Since March 2021; Core Eases to 3.6%',
          url: 'https://www.bls.gov',
          source: 'Bureau of Labor Statistics (BLS)',
          time_published: _h(4),
          summary: 'The Bureau of Labor Statistics reported April CPI at +3.1% YoY (consensus +3.4%), down from +3.5% in March. Core CPI (ex-food/energy) rose 3.6% YoY, its slowest pace since April 2021. Month-over-month headline CPI came in at +0.3%, below the +0.4% consensus. Shelter costs (+5.6% YoY) remain the primary upside contributor. Fed funds futures moved to price 1.8 cuts in 2025 post-release.',
          overall_sentiment_label: 'Bullish',
          ticker_sentiment: [{ ticker: 'SPY', ticker_sentiment_label: 'Bullish' }, { ticker: 'TLT', ticker_sentiment_label: 'Bullish' }],
        },
        {
          title: 'Fed Chair Powell: "Disinflation Still Ongoing; Patience Warranted Before Cutting"',
          url: 'https://www.federalreserve.gov',
          source: 'Federal Reserve',
          time_published: _h(9),
          summary: 'Federal Reserve Chairman Jerome Powell, speaking at the Foreign Bankers Association in Amsterdam, said the Fed\'s restrictive policy stance is "well positioned" to bring inflation back to target "in due time." He noted the labor market remains strong but is "clearly cooling." Powell emphasized the Fed is "not yet confident enough" inflation is moving sustainably to 2%, pushing back on rate cut expectations for the September meeting.',
          overall_sentiment_label: 'Neutral',
          ticker_sentiment: [{ ticker: 'SPY', ticker_sentiment_label: 'Neutral' }, { ticker: 'GLD', ticker_sentiment_label: 'Neutral' }],
        },
        {
          title: 'ECB Cuts Rates by 25bp to 4.0%; First Reduction Since 2019',
          url: 'https://www.ft.com',
          source: 'Financial Times',
          time_published: _h(14),
          summary: 'The European Central Bank delivered its first interest rate cut since 2019, lowering the deposit facility rate from 4.25% to 4.00% in a 6-1 vote. President Christine Lagarde described the decision as "a momentous day" but cautioned that "we are not pre-committing to a particular rate path." Eurozone CPI fell to 2.6% in April. Markets now price 2–3 additional ECB cuts through year-end, with the US Fed likely to follow with its first cut in September.',
          overall_sentiment_label: 'Bullish',
          ticker_sentiment: [{ ticker: 'EWG', ticker_sentiment_label: 'Bullish' }, { ticker: 'FEZ', ticker_sentiment_label: 'Bullish' }],
        },
        {
          title: 'China Q1 GDP Grows 5.3%, Beating 5.0% Target; Stimulus Package Expanded',
          url: 'https://www.bloomberg.com',
          source: 'Bloomberg Economics',
          time_published: _h(20),
          summary: 'China\'s National Bureau of Statistics reported Q1 GDP growth of 5.3% YoY, above the 5.0% target and consensus of 5.1%. Industrial production rose 6.1% YoY, led by electric vehicles (+36%), solar panels (+28%), and semiconductors (+40%). The State Council announced an additional ¥1 trillion ($138B) infrastructure investment package focused on AI computing infrastructure, rail, and green energy. Property sector contraction (-9.8%) remains the primary drag.',
          overall_sentiment_label: 'Bullish',
          ticker_sentiment: [{ ticker: 'FXI', ticker_sentiment_label: 'Bullish' }, { ticker: 'MCHI', ticker_sentiment_label: 'Bullish' }],
        },
        {
          title: 'IMF Raises 2025 Global Growth Forecast to 3.2%; Warns of Divergence Risks',
          url: 'https://www.imf.org',
          source: 'International Monetary Fund (IMF)',
          time_published: _h(36),
          summary: 'The IMF\'s World Economic Outlook (April update) raised its 2025 global growth projection to 3.2% from 3.1%, citing US resilience and China stimulus. However, the Fund warned of increasing divergence: the US grows at 2.7% while the Eurozone lags at 0.8%. Key risks include a re-escalation of trade tensions (flagging potential 60% US tariffs on China), Middle East conflict spillovers lifting energy prices, and sticky services inflation globally delaying rate cuts.',
          overall_sentiment_label: 'Neutral',
          ticker_sentiment: [{ ticker: 'VT', ticker_sentiment_label: 'Neutral' }, { ticker: 'EEM', ticker_sentiment_label: 'Neutral' }],
        },
      ],
    },
    // ── Commodities ───────────────────────────────────────────────────────────
    {
      category: 'commodities',
      label: 'Commodities',
      label_zh: '大宗商品',
      description: 'Oil, gold, metals & agricultural commodities',
      description_zh: '原油、黄金、金属与农产品',
      items: [
        {
          title: 'Gold Hits Record $2,412/oz; Central Banks Bought 1,136 Tonnes in 2024',
          url: 'https://www.reuters.com',
          source: 'Reuters',
          time_published: _h(3),
          summary: 'Spot gold rallied to a record $2,412 per troy ounce, extending its 2025 gain to 18%. The World Gold Council reported central bank purchases of 1,136 tonnes in 2024, the second-highest on record, driven by Turkey, China, Poland, and India diversifying away from US Treasuries. ETF demand has also returned positive after 3 years of outflows. Analysts at Goldman Sachs raised their year-end target to $2,700.',
          overall_sentiment_label: 'Bullish',
          ticker_sentiment: [{ ticker: 'GLD', ticker_sentiment_label: 'Bullish' }, { ticker: 'GDX', ticker_sentiment_label: 'Bullish' }],
        },
        {
          title: 'WTI Crude Dips Below $80 as US Inventory Builds Exceed Forecasts',
          url: 'https://www.wsj.com',
          source: 'The Wall Street Journal',
          time_published: _h(7),
          summary: 'WTI crude fell 1.8% to $79.40/barrel after the EIA reported a 7.3M barrel crude inventory build, far exceeding the 1.4M barrel consensus. US production hit a record 13.3M bpd, partially offsetting OPEC+ voluntary cuts of 2.2M bpd. Demand concerns from a softening Chinese industrial outlook added pressure. Brent crude traded at $83.20. Goldman Sachs maintained a $90 year-end WTI target, citing OPEC+ discipline.',
          overall_sentiment_label: 'Bearish',
          ticker_sentiment: [{ ticker: 'XLE', ticker_sentiment_label: 'Bearish' }, { ticker: 'USO', ticker_sentiment_label: 'Bearish' }],
        },
        {
          title: 'Copper Surges to 2-Year High on AI Data Center Demand; Chile Output Falls',
          url: 'https://www.ft.com',
          source: 'Financial Times',
          time_published: _h(15),
          summary: 'LME copper hit $9,840/tonne, a 2-year high, driven by unprecedented demand from AI data center construction and EV manufacturing. Goldman Sachs estimates each data center uses 500–1,000 tonnes of copper; the AI buildout could require an additional 1M tonnes annually by 2027. Meanwhile, Chile\'s copper production fell 4.2% in March due to water scarcity at key mines. The copper market is on track for its largest deficit in a decade.',
          overall_sentiment_label: 'Bullish',
          ticker_sentiment: [{ ticker: 'COPX', ticker_sentiment_label: 'Bullish' }, { ticker: 'FCX', ticker_sentiment_label: 'Bullish' }],
        },
      ],
    },
  ],
}

export function FinancialEventsPage() {
  const { language } = useLanguage()
  const [macro, setMacro] = useState<any | null>(null)
  const [etfFlows, setEtfFlows] = useState<any | null>(null)
  const [featuredStocks, setFeaturedStocks] = useState<any | null>(null)
  const [stockDetailsBySymbol, setStockDetailsBySymbol] = useState<Record<string, any>>({})
  const [news, setNews] = useState<any | null>(null)
  const [newsPages, setNewsPages] = useState<Record<string, number>>({})
  const [activeNewsCategory, setActiveNewsCategory] = useState<string>('')
  const [activeStockSymbol, setActiveStockSymbol] = useState<string>('')
  const [stockHistoryBySymbol, setStockHistoryBySymbol] = useState<Record<string, any[]>>({})
  const [expandedStockHistory, setExpandedStockHistory] = useState<Record<string, boolean>>({})
  const [loadingStockHistory, setLoadingStockHistory] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async (isInitial = false) => {
      if (isInitial) {
        setLoading(true)
      }

      try {
        const [macroRes, etfRes, stocksRes, newsRes] = await Promise.all([
          fetch(`${API_BASE}/market-intel/macro-signals`),
          fetch(`${API_BASE}/market-intel/etf-flows`),
          fetch(`${API_BASE}/market-intel/stocks/featured?limit=10`),
          fetch(`${API_BASE}/market-intel/news?limit=12`)
        ])

        if (!macroRes.ok || !etfRes.ok || !stocksRes.ok || !newsRes.ok) {
          throw new Error(language === 'zh' ? '金融事件看板加载失败' : 'Failed to load financial events')
        }

        const [macroData, etfData, stocksData, newsData] = await Promise.all([
          macroRes.json(),
          etfRes.json(),
          stocksRes.json(),
          newsRes.json()
        ])

        if (cancelled) return

        // ── Use real data only when available; fall back to mock otherwise ──
        const macroReal  = macroData?.available  === true ? macroData  : null
        const etfReal    = etfData?.available    === true ? etfData    : null
        const stocksReal = (stocksData?.items?.filter((i: any) => i?.available)?.length > 0) ? stocksData : null
        const newsReal   = (newsData?.categories?.some((c: any) => c?.items?.length > 0)) ? newsData : null

        setMacro(macroReal   ?? MOCK_MACRO)
        setEtfFlows(etfReal  ?? MOCK_ETF)
        setFeaturedStocks(stocksReal ?? MOCK_STOCKS)
        setNews(newsReal     ?? MOCK_NEWS)
        setNewsPages({})
        setError(null)
      } catch (_err: any) {
        if (cancelled) return
        // ── Network / parse error → inject mock data ──────────────────────
        setMacro(MOCK_MACRO)
        setEtfFlows(MOCK_ETF)
        setFeaturedStocks(MOCK_STOCKS)
        setNews(MOCK_NEWS)
        setNewsPages({})
        setError(null)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load(true)
    const timer = setInterval(() => load(false), 60 * 1000)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [language])

  const categories: MarketIntelNewsCategory[] = news?.categories || []
  const stockItems = (featuredStocks?.items || []).filter((item: any) => item?.available)
  const currentCategory = categories.find((section) => section.category === activeNewsCategory) || categories[0] || null
  const currentStockBase = stockItems.find((item: any) => item.symbol === activeStockSymbol) || stockItems[0] || null
  const currentStockSymbol = currentStockBase?.symbol || ''
  const currentStock = (currentStockSymbol && stockDetailsBySymbol[currentStockSymbol]) || currentStockBase || null
  const currentCategoryTitle = currentCategory
    ? ((currentCategory.category === 'equities')
      ? (language === 'zh' ? '最新新闻' : 'Latest News')
      : (language === 'zh' ? currentCategory.label_zh : currentCategory.label))
    : ''

  useEffect(() => {
    if (categories.length === 0) {
      if (activeNewsCategory) setActiveNewsCategory('')
      return
    }
    if (!categories.some((section) => section.category === activeNewsCategory)) {
      setActiveNewsCategory(categories[0].category)
    }
  }, [categories, activeNewsCategory])

  useEffect(() => {
    if (stockItems.length === 0) {
      if (activeStockSymbol) setActiveStockSymbol('')
      return
    }
    if (!stockItems.some((item: any) => item.symbol === activeStockSymbol)) {
      setActiveStockSymbol(stockItems[0].symbol)
    }
  }, [stockItems, activeStockSymbol])

  useEffect(() => {
    if (!currentStockSymbol) {
      return
    }

    let cancelled = false

    const loadStockDetail = async () => {
      try {
        const res = await fetch(`${API_BASE}/market-intel/stocks/${currentStockSymbol}/latest`)
        if (!res.ok) {
          throw new Error('stock_detail_load_failed')
        }
        const data = await res.json()
        if (cancelled || !data?.available) {
          return
        }
        setStockDetailsBySymbol((prev) => ({
          ...prev,
          [currentStockSymbol]: data
        }))
      } catch {
        // Keep rendering the snapshot payload from the featured list when live detail fails.
      }
    }

    loadStockDetail()
    const timer = setInterval(loadStockDetail, 60 * 1000)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [currentStockSymbol])

  const toggleStockHistory = async (symbol: string) => {
    const nextExpanded = !expandedStockHistory[symbol]
    setExpandedStockHistory((prev) => ({ ...prev, [symbol]: nextExpanded }))

    if (!nextExpanded || stockHistoryBySymbol[symbol] || loadingStockHistory[symbol]) {
      return
    }

    setLoadingStockHistory((prev) => ({ ...prev, [symbol]: true }))
    try {
      const res = await fetch(`${API_BASE}/market-intel/stocks/${symbol}/history?limit=6`)
      if (!res.ok) {
        throw new Error('history_load_failed')
      }
      const data = await res.json()
      setStockHistoryBySymbol((prev) => ({
        ...prev,
        [symbol]: data.history || []
      }))
    } catch {
      setStockHistoryBySymbol((prev) => ({
        ...prev,
        [symbol]: []
      }))
    } finally {
      setLoadingStockHistory((prev) => ({ ...prev, [symbol]: false }))
    }
  }

  return (
    <div className="intel-page">
      <section className="intel-hero">
        <h1 className="intel-title">
          {language === 'zh' ? '一个面板，追踪所有你需要的信息' : 'One board, track everything you need'}
        </h1>
      </section>

      <section className="intel-section">
        {loading && categories.length === 0 ? (
          <div className="intel-empty-card">
            <div className="loading"><div className="spinner"></div></div>
          </div>
        ) : error && categories.length === 0 ? (
          <div className="intel-empty-card">
            <div className="empty-title">{language === 'zh' ? '暂时无法加载金融事件看板' : 'Financial events board is temporarily unavailable'}</div>
            <div className="text-muted">{error}</div>
          </div>
        ) : (
          <>
            <div className="intel-status-strip">
              <div className="intel-status-card">
                <span>{language === 'zh' ? '宏观状态' : 'Macro regime'}</span>
                <strong>{macro?.verdict || (language === 'zh' ? '暂无' : 'N/A')}</strong>
              </div>
              <div className="intel-status-card">
                <span>{language === 'zh' ? 'ETF 方向' : 'ETF flow'}</span>
                <strong>{etfFlows?.summary?.direction || (language === 'zh' ? '暂无' : 'N/A')}</strong>
              </div>
              <div className="intel-status-card">
                <span>{language === 'zh' ? '追踪分类' : 'News lanes'}</span>
                <strong>{categories.length}</strong>
              </div>
              <div className="intel-status-card">
                <span>{language === 'zh' ? '热门标的' : 'Featured symbols'}</span>
                <strong>{stockItems.length}</strong>
              </div>
            </div>

            <div className="intel-board">
              <div className="intel-main-column">
                {currentStock && (
                  <article className="intel-stocks-card intel-main-panel">
                    <div className="intel-news-card-header">
                      <div>
                        <div className="intel-news-title">{language === 'zh' ? '热门个股分析' : 'Featured Stock Analysis'}</div>
                      </div>
                    </div>

                    <div className="intel-panel-tabs">
                      {stockItems.map((item: any) => (
                        <button
                          key={item.symbol}
                          type="button"
                          className={`intel-panel-tab ${item.symbol === currentStock.symbol ? 'active' : ''}`}
                          onClick={() => setActiveStockSymbol(item.symbol)}
                        >
                          <span className="intel-panel-tab-label">{item.symbol}</span>
                        </button>
                      ))}
                    </div>

                    {(() => {
                      const item = currentStock
                      const analysis = item.analysis || {}
                      const movingAverages = analysis.moving_averages || {}
                      const supportLevels = item.support_levels || analysis.support_levels || []
                      const resistanceLevels = item.resistance_levels || analysis.resistance_levels || []
                      const bullishFactors = item.bullish_factors || analysis.bullish_factors || []
                      const riskFactors = item.risk_factors || analysis.risk_factors || []
                      const isRealtimeQuote = item.price_source === 'alpha_vantage_time_series_intraday' && !item.price_stale
                      const priceStatusLabel = item.price_stale
                        ? (language === 'zh' ? '延迟报价' : 'Delayed quote')
                        : (language === 'zh' ? '盘中报价' : 'Live quote')
                      const priceAsOfLabel = item.price_stale
                        ? (language === 'zh' ? '报价时间' : 'Quote as of')
                        : (language === 'zh' ? '实时更新' : 'Live as of')

                      return (
                        <div className="intel-stock-detail">
                          <div className="intel-stock-item-header">
                            <div>
                              <div className="intel-etf-symbol">{item.symbol}</div>
                              <div className="intel-news-item-meta">
                                <span>{language === 'zh' ? '上次更新' : 'Last update'}: {formatIntelTimestamp(item.created_at, language)}</span>
                              </div>
                            </div>
                            <div className={`intel-activity-badge ${item.trend_status || 'quiet'}`}>{item.signal}</div>
                          </div>
                          <div className="intel-stock-price-row">
                            <div className="intel-stock-price">${item.current_price}</div>
                            <span className={`intel-price-badge ${isRealtimeQuote ? 'live' : 'stale'}`}>
                              {priceStatusLabel}
                            </span>
                          </div>
                          <div className="intel-news-item-summary">{item.summary}</div>
                          <div className="intel-chip-row">
                            <span className="intel-chip">{language === 'zh' ? '评分' : 'Score'} {item.signal_score}</span>
                            <span className="intel-chip">{language === 'zh' ? '趋势' : 'Trend'} {item.trend_status}</span>
                            {item.price_as_of && (
                              <span className={`intel-chip ${item.price_stale ? 'intel-chip-warn' : 'intel-chip-live'}`}>
                                {priceAsOfLabel} {formatIntelTimestamp(item.price_as_of, language)}
                              </span>
                            )}
                            {item.price_source && (
                              <span className="intel-chip">
                                {language === 'zh' ? '报价源' : 'Quote source'} {item.price_source === 'alpha_vantage_time_series_intraday' ? 'Alpha Vantage Intraday' : 'Alpha Vantage Daily'}
                              </span>
                            )}
                            {analysis.as_of && (
                              <span className="intel-chip">{language === 'zh' ? '分析基准日' : 'Analysis as of'} {analysis.as_of}</span>
                            )}
                          </div>

                          <div className="intel-stock-metrics-grid">
                            <div className="intel-stock-metric-card">
                              <span>{language === 'zh' ? '5日收益' : '5d return'}</span>
                              <strong>{formatIntelNumber(analysis.return_5d_pct)}%</strong>
                            </div>
                            <div className="intel-stock-metric-card">
                              <span>{language === 'zh' ? '20日收益' : '20d return'}</span>
                              <strong>{formatIntelNumber(analysis.return_20d_pct)}%</strong>
                            </div>
                            <div className="intel-stock-metric-card">
                              <span>{language === 'zh' ? '距支撑' : 'To support'}</span>
                              <strong>{formatIntelNumber(analysis.distance_to_support_pct)}%</strong>
                            </div>
                            <div className="intel-stock-metric-card">
                              <span>{language === 'zh' ? '距阻力' : 'To resistance'}</span>
                              <strong>{formatIntelNumber(analysis.distance_to_resistance_pct)}%</strong>
                            </div>
                          </div>

                          <div className="intel-stock-levels-grid">
                            <div className="intel-stock-levels-card">
                              <div className="intel-stock-levels-title">{language === 'zh' ? '均线' : 'Moving averages'}</div>
                              <div className="intel-stock-levels-list">
                                <span className="intel-chip">MA5 {formatIntelNumber(movingAverages.ma5)}</span>
                                <span className="intel-chip">MA10 {formatIntelNumber(movingAverages.ma10)}</span>
                                <span className="intel-chip">MA20 {formatIntelNumber(movingAverages.ma20)}</span>
                                <span className="intel-chip">MA60 {formatIntelNumber(movingAverages.ma60)}</span>
                              </div>
                            </div>
                            <div className="intel-stock-levels-card">
                              <div className="intel-stock-levels-title">{language === 'zh' ? '关键价位' : 'Key levels'}</div>
                              <div className="intel-stock-levels-list">
                                {supportLevels.slice(0, 2).map((level: number, index: number) => (
                                  <span key={`${item.symbol}-support-${index}`} className="intel-chip">
                                    {language === 'zh' ? '支撑' : 'Support'} {formatIntelNumber(level)}
                                  </span>
                                ))}
                                {resistanceLevels.slice(0, 2).map((level: number, index: number) => (
                                  <span key={`${item.symbol}-resistance-${index}`} className="intel-chip">
                                    {language === 'zh' ? '阻力' : 'Resistance'} {formatIntelNumber(level)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="intel-factors-grid">
                            <div className="intel-factor-card">
                              <div className="intel-factor-title">{language === 'zh' ? '看多因素' : 'Bullish factors'}</div>
                              {bullishFactors.length > 0 ? (
                                <ul className="intel-factor-list">
                                  {bullishFactors.map((factor: string) => (
                                    <li key={`${item.symbol}-bullish-${factor}`}>{factor}</li>
                                  ))}
                                </ul>
                              ) : (
                                <div className="intel-empty-inline">{language === 'zh' ? '暂无明显看多因素。' : 'No clear bullish factors.'}</div>
                              )}
                            </div>
                            <div className="intel-factor-card intel-factor-card-risk">
                              <div className="intel-factor-title">{language === 'zh' ? '风险因素' : 'Risk factors'}</div>
                              {riskFactors.length > 0 ? (
                                <ul className="intel-factor-list">
                                  {riskFactors.map((factor: string) => (
                                    <li key={`${item.symbol}-risk-${factor}`}>{factor}</li>
                                  ))}
                                </ul>
                              ) : (
                                <div className="intel-empty-inline">{language === 'zh' ? '暂无明显风险因素。' : 'No clear risk factors.'}</div>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            className="intel-history-toggle"
                            onClick={() => toggleStockHistory(item.symbol)}
                          >
                            {expandedStockHistory[item.symbol]
                              ? (language === 'zh' ? '收起历史' : 'Hide history')
                              : (language === 'zh' ? '展开历史' : 'Show history')}
                          </button>
                          {expandedStockHistory[item.symbol] && (
                            <div className="intel-history-panel">
                              {loadingStockHistory[item.symbol] ? (
                                <div className="intel-empty-inline">
                                  {language === 'zh' ? '正在加载历史快照...' : 'Loading history snapshots...'}
                                </div>
                              ) : (stockHistoryBySymbol[item.symbol] || []).length > 0 ? (
                                <div className="intel-history-list">
                                  {(stockHistoryBySymbol[item.symbol] || []).map((entry: any) => (
                                    <div key={entry.analysis_id} className="intel-history-item">
                                      <div className="intel-history-item-header">
                                        <span>{formatIntelTimestamp(entry.created_at, language)}</span>
                                        <span className={`intel-activity-badge ${entry.trend_status || 'quiet'}`}>{entry.signal}</span>
                                      </div>
                                      <div className="intel-chip-row">
                                        <span className="intel-chip">{language === 'zh' ? '评分' : 'Score'} {entry.signal_score}</span>
                                        <span className="intel-chip">{language === 'zh' ? '趋势' : 'Trend'} {entry.trend_status}</span>
                                        {entry.analysis?.return_5d_pct !== undefined && (
                                          <span className="intel-chip">{language === 'zh' ? '5日收益' : '5d return'} {formatIntelNumber(entry.analysis?.return_5d_pct)}%</span>
                                        )}
                                        {entry.analysis?.return_20d_pct !== undefined && (
                                          <span className="intel-chip">{language === 'zh' ? '20日收益' : '20d return'} {formatIntelNumber(entry.analysis?.return_20d_pct)}%</span>
                                        )}
                                      </div>
                                      <div className="intel-news-item-summary">{entry.summary}</div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="intel-empty-inline">
                                  {language === 'zh' ? '暂无历史快照。' : 'No historical snapshots yet.'}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </article>
                )}

                {currentCategory && (
                  <article className="intel-news-card intel-main-panel">
                    <div className="intel-news-card-header">
                      <div>
                        <div className="intel-news-title">{currentCategoryTitle}</div>
                        <div className="intel-news-description">{language === 'zh' ? currentCategory.description_zh : currentCategory.description}</div>
                      </div>
                      <div className={`intel-activity-badge ${currentCategory.summary?.activity_level || 'quiet'}`}>
                        {currentCategory.summary?.activity_level || (language === 'zh' ? '暂无' : 'N/A')}
                      </div>
                    </div>

                    <div className="intel-news-card-meta">
                      <span>{language === 'zh' ? '上次更新' : 'Last update'}: {formatIntelTimestamp(currentCategory.created_at, language)}</span>
                    </div>

                    <div className="intel-panel-tabs">
                      {categories.map((section) => (
                        <button
                          key={section.category}
                          type="button"
                          className={`intel-panel-tab ${section.category === currentCategory.category ? 'active' : ''}`}
                          onClick={() => setActiveNewsCategory(section.category)}
                        >
                          <span className="intel-panel-tab-label">
                            {section.category === 'equities'
                              ? (language === 'zh' ? '最新新闻' : 'Latest News')
                              : (language === 'zh' ? section.label_zh : section.label)}
                          </span>
                        </button>
                      ))}
                    </div>

                    {(() => {
                      const totalItems = currentCategory.items?.length || 0
                      const totalPages = Math.max(1, Math.ceil(totalItems / FINANCIAL_NEWS_PAGE_SIZE))
                      const currentPage = Math.min(newsPages[currentCategory.category] || 0, totalPages - 1)
                      const start = currentPage * FINANCIAL_NEWS_PAGE_SIZE
                      const pageItems = (currentCategory.items || []).slice(start, start + FINANCIAL_NEWS_PAGE_SIZE)

                      return pageItems.length ? (
                        <>
                          <div className="intel-news-list">
                            {pageItems.map((item) => (
                              <a
                                key={`${currentCategory.category}-${item.url || item.title}`}
                                className="intel-news-item"
                                href={item.url || undefined}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <div className="intel-news-item-title">{item.title}</div>
                                <div className="intel-news-item-meta">
                                  <span>{item.source}</span>
                                  <span>{formatIntelTimestamp(item.time_published, language)}</span>
                                </div>
                                {item.summary && <div className="intel-news-item-summary">{item.summary}</div>}
                                <div className="intel-chip-row">
                                  {item.overall_sentiment_label && (
                                    <span className="intel-chip">{item.overall_sentiment_label}</span>
                                  )}
                                  {(item.ticker_sentiment || []).slice(0, 4).map((ticker: any) => (
                                    <span key={`${item.title}-${ticker.ticker}`} className="intel-chip intel-chip-symbol">
                                      {ticker.ticker}
                                    </span>
                                  ))}
                                </div>
                              </a>
                            ))}
                          </div>
                          {totalPages > 1 && (
                            <div className="intel-pager">
                              <button
                                type="button"
                                className="intel-pager-button"
                                disabled={currentPage === 0}
                                onClick={() => setNewsPages((prev) => ({
                                  ...prev,
                                  [currentCategory.category]: Math.max(0, currentPage - 1)
                                }))}
                              >
                                {language === 'zh' ? '← 上一页' : '← Prev'}
                              </button>
                              <div className="intel-pager-status">
                                {language === 'zh'
                                  ? `第 ${currentPage + 1} / ${totalPages} 页`
                                  : `Page ${currentPage + 1} / ${totalPages}`}
                              </div>
                              <button
                                type="button"
                                className="intel-pager-button"
                                disabled={currentPage >= totalPages - 1}
                                onClick={() => setNewsPages((prev) => ({
                                  ...prev,
                                  [currentCategory.category]: Math.min(totalPages - 1, currentPage + 1)
                                }))}
                              >
                                {language === 'zh' ? '下一页 →' : 'Next →'}
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="intel-empty-inline">
                          {language === 'zh' ? '当前分类暂无快照内容。' : 'No snapshot content available for this category yet.'}
                        </div>
                      )
                    })()}
                  </article>
                )}
              </div>

              <aside className="intel-side-column">
                {macro?.available && (
                  <article className="intel-macro-card intel-side-panel">
                    <div className="intel-news-card-header">
                      <div>
                        <div className="intel-news-title">{language === 'zh' ? '宏观信号' : 'Macro Signals'}</div>
                        <div className="intel-news-description">
                          {language === 'zh'
                            ? (macro?.meta?.summary_zh || '统一后台快照生成的宏观状态。')
                            : (macro?.meta?.summary || 'A server-side macro regime snapshot.')}
                        </div>
                      </div>
                      <div className={`intel-activity-badge ${macro?.verdict || 'quiet'}`}>
                        {macro?.verdict || (language === 'zh' ? '暂无' : 'N/A')}
                      </div>
                    </div>
                    <div className="intel-news-card-meta">
                      <span>{language === 'zh' ? '上次更新' : 'Last update'}: {formatIntelTimestamp(macro?.created_at, language)}</span>
                    </div>
                    <div className="intel-macro-list">
                      {(macro?.signals || []).map((signal: any) => (
                        <div key={signal.id} className="intel-macro-row">
                          <div className="intel-macro-row-top">
                            <span className="intel-macro-label">{language === 'zh' ? signal.label_zh : signal.label}</span>
                            <span className={`intel-activity-badge ${signal.status || 'quiet'}`}>{signal.status}</span>
                          </div>
                          <div className="intel-macro-row-value">
                            {signal.value !== null && signal.value !== undefined
                              ? `${signal.value}${signal.unit === '%' ? '%' : ''}`
                              : (language === 'zh' ? '暂无' : 'N/A')}
                          </div>
                          <div className="intel-news-item-summary">
                            {language === 'zh' ? signal.explanation_zh : signal.explanation}
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                )}

                {etfFlows?.available && (
                  <article className="intel-etf-card intel-side-panel">
                    <div className="intel-news-card-header">
                      <div>
                        <div className="intel-news-title">{language === 'zh' ? 'ETF 流方向' : 'ETF Flow'}</div>
                      </div>
                      <div className={`intel-activity-badge ${etfFlows?.summary?.direction || 'quiet'}`}>
                        {etfFlows?.summary?.direction || (language === 'zh' ? '暂无' : 'N/A')}
                      </div>
                    </div>
                    <div className="intel-news-card-meta">
                      <span>{language === 'zh' ? '上次更新' : 'Last update'}: {formatIntelTimestamp(etfFlows?.created_at, language)}</span>
                    </div>
                    <div className="intel-etf-stack">
                      {(etfFlows?.etfs || []).slice(0, 8).map((etf: any) => (
                        <div key={etf.symbol} className="intel-etf-stack-item">
                          <div className="intel-etf-stack-top">
                            <div className="intel-etf-symbol">{etf.symbol}</div>
                            <div className={`intel-activity-badge ${etf.direction || 'quiet'}`}>{etf.direction}</div>
                          </div>
                          <div className="intel-etf-stack-metrics">
                            <div className="intel-etf-metric">
                              <span>{language === 'zh' ? '涨跌' : 'Change'}</span>
                              <strong>{etf.price_change_pct}%</strong>
                            </div>
                            <div className="intel-etf-metric">
                              <span>{language === 'zh' ? '量比' : 'Vol ratio'}</span>
                              <strong>{etf.volume_ratio}</strong>
                            </div>
                            <div className="intel-etf-metric">
                              <span>{language === 'zh' ? '流向分' : 'Flow score'}</span>
                              <strong>{etf.estimated_flow_score}</strong>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                )}
              </aside>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

// Signals Feed Page - Two-level structure (Grouped by Agent)
export function SignalsFeed({ token: _token }: { token?: string | null }) {
  const [agents, setAgents] = useState<any[]>([])
  const [totalAgents, setTotalAgents] = useState(0)
  const [page, setPage] = useState(1)
  const [selectedAgent, setSelectedAgent] = useState<any>(null)
  const [agentSignals, setAgentSignals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingSignals, setLoadingSignals] = useState(false)
  const [market, setMarket] = useState('all')
  const [signalType, setSignalType] = useState<'operation' | 'strategy' | 'discussion' | 'positions'>('operation') // Second level tab
  const [agentPositions, setAgentPositions] = useState<any[]>([])
  const [agentCash, setAgentCash] = useState<number>(0)
  const [loadingPositions, setLoadingPositions] = useState(false)
  const { t, language } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    loadAgents(page)

    // Refresh signals periodically
    const interval = setInterval(() => {
      loadAgents(page)
    }, REFRESH_INTERVAL)

    return () => clearInterval(interval)
  }, [market, page])

  useEffect(() => {
    setPage(1)
  }, [market])

  const loadAgents = async (pageToLoad = page) => {
    setLoading(true)
    try {
      const offset = (pageToLoad - 1) * SIGNALS_FEED_PAGE_SIZE
      const url = market === 'all'
        ? `${API_BASE}/signals/grouped?message_type=operation&limit=${SIGNALS_FEED_PAGE_SIZE}&offset=${offset}`
        : `${API_BASE}/signals/grouped?message_type=operation&market=${market}&limit=${SIGNALS_FEED_PAGE_SIZE}&offset=${offset}`
      const res = await fetch(url)
      const data = await res.json()
      setAgents(data.agents || [])
      setTotalAgents(data.total || 0)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const loadAgentSignals = async (agentId: number) => {
    setLoadingSignals(true)
    try {
      // Load different signal types based on tab
      const messageType = signalType === 'operation' ? 'operation' : signalType
      const res = await fetch(`${API_BASE}/signals/${agentId}?message_type=${messageType}&limit=50`)
      const data = await res.json()
      const signals = data.signals || []
      // Sort by executed_at (newest first)
      signals.sort((a: any, b: any) => {
        const timeA = a.executed_at ? new Date(a.executed_at).getTime() : 0
        const timeB = b.executed_at ? new Date(b.executed_at).getTime() : 0
        return timeB - timeA
      })
      setAgentSignals(signals)
    } catch (e) {
      console.error(e)
    }
    setLoadingSignals(false)
  }

  const loadAgentSummary = async (agentId: number) => {
    try {
      const res = await fetch(`${API_BASE}/agents/${agentId}/summary`)
      const data = await res.json()
      if (res.ok) {
        return {
          agent_id: data.agent_id || agentId,
          agent_name: data.agent_name || `Agent ${agentId}`
        }
      }
    } catch (e) {
      console.error(e)
    }
    return null
  }

  // Load positions for an agent
  const loadAgentPositions = async (agentId: number) => {
    setLoadingPositions(true)
    try {
      const res = await fetch(`${API_BASE}/agents/${agentId}/positions`)
      const data = await res.json()
      setAgentPositions(data.positions || [])
      setAgentCash(data.cash || 0)
    } catch (e) {
      console.error(e)
    }
    setLoadingPositions(false)
  }

  // Reload signals when tab changes
  useEffect(() => {
    if (selectedAgent) {
      if (signalType === 'positions') {
        loadAgentPositions(selectedAgent.agent_id)
      } else {
        loadAgentSignals(selectedAgent.agent_id)
      }
    }
  }, [signalType, selectedAgent])

  useEffect(() => {
    const agentIdParam = new URLSearchParams(location.search).get('agent')
    if (!agentIdParam) {
      if (selectedAgent) {
        setSelectedAgent(null)
        setAgentSignals([])
      }
      return
    }

    if (agents.length === 0) {
      return
    }

    const agentId = Number(agentIdParam)
    if (!Number.isFinite(agentId)) {
      return
    }

    if (selectedAgent?.agent_id === agentId) {
      return
    }

    const matchedAgent = agents.find((agent) => agent.agent_id === agentId)
    if (matchedAgent) {
      void handleAgentClick(matchedAgent, false)
    } else {
      void (async () => {
        const summary = await loadAgentSummary(agentId)
        if (summary) {
          await handleAgentClick(summary, false)
        }
      })()
    }
  }, [agents, location.search, selectedAgent])

  const handleAgentClick = async (agent: any, syncUrl = true) => {
    if (syncUrl) {
      navigate(`/market?agent=${agent.agent_id}`)
    }
    setSelectedAgent(agent)
    await loadAgentSignals(agent.agent_id)
  }

  const handleBack = () => {
    setSelectedAgent(null)
    setAgentSignals([])
    navigate('/market')
  }

  const getMarketLabel = (code: string) => MARKETS.find(m => m.value === code)?.[language === 'zh' ? 'labelZh' : 'label'] || code
  const totalPages = Math.max(1, Math.ceil(totalAgents / SIGNALS_FEED_PAGE_SIZE))

  // Convert action/side to display text (e.g., "long" -> "买入", "short" -> "做空")
  const getActionLabel = (action: string | undefined | null, isZh: boolean) => {
    if (!action) return ''
    const actionLower = action.toLowerCase()
    if (actionLower === 'buy') return isZh ? '买入' : 'Buy'
    if (actionLower === 'sell') return isZh ? '卖出' : 'Sell'
    if (actionLower === 'short') return isZh ? '做空' : 'Short'
    if (actionLower === 'cover') return isZh ? '平空' : 'Cover'
    if (actionLower === 'long') return isZh ? '做多' : 'Long'
    return action.toUpperCase()
  }

  // Format time display
  const formatTime = (timeStr: string | undefined | null) => {
    if (!timeStr) return null
    try {
      const date = new Date(timeStr)
      return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return timeStr
    }
  }

  return (
    <div>
      <div className="header">
        <div>
          <h1 className="header-title">{t.signals.operations}</h1>
          <p className="header-subtitle">{language === 'zh' ? '浏览交易操作信号' : 'Browse trading operation signals'}</p>
        </div>
      </div>


      <div className="market-tabs">
        {MARKETS.map((m) => (
          <button
            key={m.value}
            className={`market-tab ${market === m.value ? 'active' : ''} ${!m.supported ? 'disabled' : ''}`}
            onClick={() => m.supported && setMarket(m.value)}
            disabled={!m.supported}
          >
            {language === 'zh' ? m.labelZh : m.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : selectedAgent ? (
        // Second level: Show signals from selected agent
        <div>
          <button className="back-button" onClick={handleBack}>
            ← {language === 'zh' ? '返回' : 'Back'} | {selectedAgent.agent_name}
          </button>

          {/* Signal type tabs */}
          <div className="market-tabs">
            <button
              className={`market-tab ${signalType === 'positions' ? 'active' : ''}`}
              onClick={() => setSignalType('positions')}
            >
              {language === 'zh' ? '持仓' : 'Positions'}
            </button>
            <button
              className={`market-tab ${signalType === 'operation' ? 'active' : ''}`}
              onClick={() => setSignalType('operation')}
            >
              {language === 'zh' ? '交易信号' : 'Trading Signals'}
            </button>
            <button
              className={`market-tab ${signalType === 'strategy' ? 'active' : ''}`}
              onClick={() => setSignalType('strategy')}
            >
              {language === 'zh' ? '策略' : 'Strategies'}
            </button>
            <button
              className={`market-tab ${signalType === 'discussion' ? 'active' : ''}`}
              onClick={() => setSignalType('discussion')}
            >
              {language === 'zh' ? '讨论' : 'Discussions'}
            </button>
          </div>

          {/* Show positions if selected */}
          {signalType === 'positions' ? (
            loadingPositions ? (
              <div className="loading"><div className="spinner"></div></div>
            ) : (
              <>
                {/* Cash balance display */}
                {agentCash > 0 && (
                  <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {language === 'zh' ? '可用现金' : 'Available Cash'}
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--accent-primary)' }}>
                      ${agentCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                )}
                {agentPositions.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <div className="empty-title">{language === 'zh' ? '暂无持仓' : 'No positions'}</div>
                  </div>
                ) : (
                  <div className="card">
                    <div className="table-container">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>{language === 'zh' ? '标的' : 'Symbol'}</th>
                            <th>{language === 'zh' ? '方向' : 'Side'}</th>
                            <th>{language === 'zh' ? '数量' : 'Qty'}</th>
                            <th>{language === 'zh' ? '买入价' : 'Entry'}</th>
                            <th>{language === 'zh' ? '当前价' : 'Current'}</th>
                            <th>{language === 'zh' ? '盈亏' : 'PnL'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {agentPositions.map((pos, idx) => (
                            <tr key={idx}>
                              <td style={{ fontWeight: 600 }}>{getInstrumentLabel(pos)}</td>
                              <td>
                                <span className={`tag ${pos.side === 'long' ? 'signal-side long' : 'signal-side short'}`}>
                                  {pos.side === 'long' ? (language === 'zh' ? '做多' : 'Long') : (language === 'zh' ? '做空' : 'Short')}
                                </span>
                              </td>
                              <td>{Math.abs(pos.quantity)}</td>
                              <td>${pos.entry_price?.toLocaleString()}</td>
                              <td>${pos.current_price?.toLocaleString() || '-'}</td>
                              <td style={{ color: (pos.pnl || 0) >= 0 ? 'var(--success)' : 'var(--error)' }}>
                                {pos.pnl >= 0 ? '+' : ''}{pos.pnl?.toFixed(2) || '0.00'}
                              </td>
                              <td>
                                <span className="tag" style={{ background: 'var(--bg-tertiary)' }}>
                                  {language === 'zh' ? '交易信号' : 'Signal'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )
          ) : loadingSignals ? (
            <div className="loading"><div className="spinner"></div></div>
          ) : agentSignals.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <div className="empty-title">{t.signals.noSignals}</div>
            </div>
          ) : (
            <div className="signal-grid">
              {agentSignals.map((signal) => (
                <div key={signal.id} className="signal-card">
                  {signalType === 'operation' ? (
                    // Trading signals display (realtime: buy/sell/short/cover)
                    <>
                      <div className="signal-header">
                        <span className="signal-symbol">{getInstrumentLabel(signal)}</span>
                        <span className={`signal-side ${signal.action || signal.side}`}>
                          {getActionLabel(signal.action || signal.side, language === 'zh')}
                        </span>
                      </div>
                      <div className="signal-meta">
                        {signal.market === 'polymarket' && signal.outcome && (
                          <span className="signal-meta-item">🎯 {language === 'zh' ? 'Outcome' : 'Outcome'}: {signal.outcome}</span>
                        )}
                        <span className="signal-meta-item">💰 {language === 'zh' ? '价格' : 'Price'}: ${(signal.price || signal.entry_price)?.toLocaleString()}</span>
                        <span className="signal-meta-item">📦 {language === 'zh' ? '数量' : 'Qty'}: {signal.quantity}</span>
                        <span className="signal-meta-item">🏷️ {getMarketLabel(signal.market)}</span>
                        {/* Show executed time */}
                        {signal.executed_at && (
                          <span className="signal-meta-item">
                            🕐 {formatTime(signal.executed_at)}
                          </span>
                        )}
                      </div>
                      {signal.content && <p className="signal-content">{signal.content}</p>}
                    </>
                  ) : (
                    // Strategy/Discussion display - clickable to navigate to full page
                    <div
                      className="signal-header clickable"
                      onClick={() => {
                        if (signal.message_type === 'strategy') {
                          navigate(`/strategies?signal=${signal.id}`)
                        } else {
                          navigate(`/discussions?signal=${signal.id}`)
                        }
                      }}
                    >
                      <div className="signal-header">
                        <span className="signal-symbol">{signal.title}</span>
                        <span className="signal-side">{signal.message_type}</span>
                      </div>
                      <div className="signal-meta">
                        <span className="signal-meta-item">🏷️ {getMarketLabel(signal.market)}</span>
                        {signal.symbol && <span className="signal-meta-item">📌 {signal.symbol}</span>}
                      </div>
                      {signal.content && <p className="signal-content">{signal.content}</p>}
                    </div>
                  )}
                  {signal.tags?.length > 0 && (
                    <div className="tags">
                      {signal.tags.map((tag: string) => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : agents.length === 0 ? (
        // No agents
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <div className="empty-title">{t.signals.noSignals}</div>
        </div>
      ) : (
        // First level: Show agents grouped
        <>
          <div className="agent-grid">
            {agents.map((agent) => (
              <div
                key={agent.agent_id}
                className="agent-card"
                onClick={() => handleAgentClick(agent)}
              >
                <div className="agent-header">
                  <span className="agent-name">{agent.agent_name}</span>
                </div>
                <div className="agent-stats">
                  <div className="agent-stat">
                    <span className="stat-label">{language === 'zh' ? '持仓数' : 'Positions'}</span>
                    <span className="stat-value">{agent.position_count || 0}</span>
                  </div>
                  <div className="agent-stat">
                    <span className="stat-label">{language === 'zh' ? '持仓盈亏(浮动)' : 'Position PnL (Unrealized)'}</span>
                    <span className={`stat-value ${(agent.position_pnl || 0) >= 0 ? 'positive' : 'negative'}`}>
                      {(agent.position_pnl || 0) >= 0 ? '+' : ''}{agent.position_pnl?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
                <div className="agent-meta">
                  <span className="agent-last-signal">
                    {language === 'zh' ? '持仓: ' : 'Positions: '}
                    {(agent.positions || []).map((p: any) => getInstrumentLabel(p)).join(', ') || '-'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="card" style={{ marginTop: '20px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <button
                className="btn btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                {language === 'zh' ? '上一页' : 'Previous'}
              </button>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                {language === 'zh'
                  ? `第 ${page} / ${totalPages} 页，共 ${totalAgents} 位交易员`
                  : `Page ${page} / ${totalPages}, ${totalAgents} traders total`}
              </div>
              <button
                className="btn btn-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                {language === 'zh' ? '下一页' : 'Next'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Copy Trading Page
export function CopyTradingPage({ token }: { token: string }) {
  const [providers, setProviders] = useState<any[]>([])
  const [providerPage, setProviderPage] = useState(1)
  const [providerTotal, setProviderTotal] = useState(0)
  const [following, setFollowing] = useState<any[]>([])
  const [followingPage, setFollowingPage] = useState(1)
  const [followingTotal, setFollowingTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'discover' | 'following'>('discover')
  const navigate = useNavigate()
  const { language } = useLanguage()

  useEffect(() => {
    loadData(providerPage, followingPage)
    const interval = setInterval(() => loadData(providerPage, followingPage), REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [providerPage, followingPage])

  const loadData = async (providerPageToLoad = providerPage, followingPageToLoad = followingPage) => {
    try {
      const providerOffset = (providerPageToLoad - 1) * COPY_TRADING_PAGE_SIZE
      const res = await fetch(
        `${API_BASE}/profit/history?limit=${COPY_TRADING_PAGE_SIZE}&offset=${providerOffset}&include_history=false`
      )
      if (!res.ok) {
        console.error('Failed to load providers:', res.status)
        setProviders([])
        setProviderTotal(0)
      } else {
        const data = await res.json()
        setProviders(data.top_agents || [])
        setProviderTotal(data.total || 0)
      }

      if (token) {
        const followingOffset = (followingPageToLoad - 1) * COPY_TRADING_PAGE_SIZE
        const followRes = await fetch(`${API_BASE}/signals/following?limit=${COPY_TRADING_PAGE_SIZE}&offset=${followingOffset}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (followRes.ok) {
          const followData = await followRes.json()
          setFollowing(followData.following || [])
          setFollowingTotal(followData.total || 0)
        } else {
          const errorText = await followRes.text()
          console.error('Failed to load following:', followRes.status, errorText)
          setFollowing([])
          setFollowingTotal(0)
        }
      } else {
        setFollowing([])
        setFollowingTotal(0)
      }
    } catch (e) {
      console.error('Error loading copy trading data:', e)
    }
    setLoading(false)
  }

  const handleFollow = async (leaderId: number) => {
    if (!token) return
    try {
      const res = await fetch(`${API_BASE}/signals/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ leader_id: leaderId })
      })
      const data = await res.json()
      if (res.ok && (data.success || data.message === 'Already following')) {
        loadData(providerPage, followingPage)
      } else {
        console.error('Follow failed:', data)
      }
    } catch (e) {
      console.error('Follow error:', e)
    }
  }

  const handleUnfollow = async (leaderId: number) => {
    if (!token) return
    try {
      const res = await fetch(`${API_BASE}/signals/unfollow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ leader_id: leaderId })
      })
      const data = await res.json()
      if (data.success) {
        loadData(providerPage, followingPage)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const isFollowing = (leaderId: number) => {
    return following.some(f => f.leader_id === leaderId)
  }

  const getFollowedProvider = (leaderId: number) => {
    return providers.find(p => p.agent_id === leaderId)
  }

  const renderActivitySummary = (entity: any) => (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-muted)' }}>
      <span>{language === 'zh' ? `近7天交易 ${entity.recent_trade_count_7d || 0}` : `${entity.recent_trade_count_7d || 0} trades / 7d`}</span>
      <span>{language === 'zh' ? `近7天策略 ${entity.recent_strategy_count_7d || 0}` : `${entity.recent_strategy_count_7d || 0} strategies / 7d`}</span>
      <span>{language === 'zh' ? `近7天讨论 ${entity.recent_discussion_count_7d || 0}` : `${entity.recent_discussion_count_7d || 0} discussions / 7d`}</span>
      {entity.follower_count !== undefined && (
        <span>{language === 'zh' ? `跟随者 ${entity.follower_count}` : `${entity.follower_count} followers`}</span>
      )}
    </div>
  )

  const providerTotalPages = Math.max(1, Math.ceil(providerTotal / COPY_TRADING_PAGE_SIZE))
  const followingTotalPages = Math.max(1, Math.ceil(followingTotal / COPY_TRADING_PAGE_SIZE))
  const formatReturnPercent = (value: any) => `${Number(value || 0).toFixed(2)}%`

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>
  }

  return (
    <div>
      <div className="header">
        <div>
          <h1 className="header-title">{language === 'zh' ? '📋 跟单交易' : '📋 Copy Trading'}</h1>
          <p className="header-subtitle">
            {language === 'zh'
              ? '跟随优秀交易员，一键复制他们的交易'
              : 'Follow top traders and automatically copy their trades'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('discover')}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'discover' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
            color: activeTab === 'discover' ? 'var(--accent-contrast)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          {language === 'zh' ? '发现交易员' : 'Discover Traders'}
        </button>
        <button
          onClick={() => setActiveTab('following')}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'following' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
            color: activeTab === 'following' ? 'var(--accent-contrast)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          {language === 'zh' ? `我的跟单 (${followingTotal})` : `My Following (${followingTotal})`}
        </button>
      </div>

      {activeTab === 'discover' ? (
        /* Discover Traders */
        <div className="card">
          {providers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              {language === 'zh' ? '暂无交易员数据' : 'No traders available'}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '14px' }}>
              {providers.map((provider, index) => {
                const rank = (providerPage - 1) * COPY_TRADING_PAGE_SIZE + index + 1
                return (
                <div key={provider.agent_id} style={{ padding: '18px', border: '1px solid var(--border-color)', borderRadius: '14px', background: 'var(--bg-tertiary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-gradient)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                        #{rank}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{provider.name || `Agent ${provider.agent_id}`}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {language === 'zh' ? '最近活跃' : 'Recent activity'}: {provider.recent_activity_at ? new Date(provider.recent_activity_at).toLocaleString() : '-'}
                        </div>
                      </div>
                    </div>
                    {isFollowing(provider.agent_id) ? (
                      <button className="btn btn-ghost" onClick={() => handleUnfollow(provider.agent_id)}>
                        {language === 'zh' ? '取消跟单' : 'Unfollow'}
                      </button>
                    ) : (
                      <button className="btn btn-primary" onClick={() => handleFollow(provider.agent_id)}>
                        {language === 'zh' ? '立即跟单' : 'Follow Trader'}
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginTop: '14px', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{language === 'zh' ? '收益率' : 'Return'}</div>
                      <div style={{ fontWeight: 700, color: (provider.total_profit_percent || 0) >= 0 ? '#22c55e' : '#ef4444' }}>
                        {formatReturnPercent(provider.total_profit_percent)}
                        <span style={{ color: 'var(--text-muted)', marginLeft: '6px', fontSize: '12px', fontWeight: 500 }}>
                          ${(provider.total_profit || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{language === 'zh' ? '交易次数' : 'Trades'}</div>
                      <div style={{ fontWeight: 700 }}>{provider.trade_count || 0}</div>
                    </div>
                  </div>

                  {renderActivitySummary(provider)}

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
                    {provider.latest_strategy_signal_id && (
                      <button className="btn btn-ghost" style={{ fontSize: '12px', padding: '6px 10px' }} onClick={() => navigate(`/strategies?signal=${provider.latest_strategy_signal_id}`)}>
                        {language === 'zh' ? `看策略：${provider.latest_strategy_title || '最新策略'}` : `View strategy: ${provider.latest_strategy_title || 'Latest'}`}
                      </button>
                    )}
                    {provider.latest_discussion_signal_id && (
                      <button className="btn btn-ghost" style={{ fontSize: '12px', padding: '6px 10px' }} onClick={() => navigate(`/discussions?signal=${provider.latest_discussion_signal_id}`)}>
                        {language === 'zh' ? `看讨论：${provider.latest_discussion_title || '最新讨论'}` : `View discussion: ${provider.latest_discussion_title || 'Latest'}`}
                      </button>
                    )}
                  </div>
                </div>
                )
              })}
              {providerTotalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', paddingTop: '4px', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-secondary"
                    disabled={providerPage <= 1}
                    onClick={() => setProviderPage((current) => Math.max(1, current - 1))}
                  >
                    {language === 'zh' ? '上一页' : 'Previous'}
                  </button>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    {language === 'zh'
                      ? `第 ${providerPage} / ${providerTotalPages} 页，共 ${providerTotal} 位交易员`
                      : `Page ${providerPage} / ${providerTotalPages}, ${providerTotal} traders total`}
                  </div>
                  <button
                    className="btn btn-secondary"
                    disabled={providerPage >= providerTotalPages}
                    onClick={() => setProviderPage((current) => Math.min(providerTotalPages, current + 1))}
                  >
                    {language === 'zh' ? '下一页' : 'Next'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Following List */
        <div className="card">
          {following.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              {language === 'zh' ? '尚未跟单任何交易员' : 'Not following any traders yet'}
              <br />
              <button
                onClick={() => setActiveTab('discover')}
                style={{
                  marginTop: '16px',
                  padding: '8px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--accent-gradient)',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                {language === 'zh' ? '去发现' : 'Discover Traders'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {following.map(f => {
                const provider = getFollowedProvider(f.leader_id)
                return (
                  <div
                    key={f.leader_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px',
                      background: 'var(--bg-tertiary)',
                      borderRadius: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="user-avatar" style={{ width: 40, height: 40, fontSize: 16 }}>
                        {(f.leader_name || 'A').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{f.leader_name || `Agent ${f.leader_id}`}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {language === 'zh' ? '自 ' : 'Since '}
                          {new Date(f.subscribed_at).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US')}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {language === 'zh' ? '最近活跃' : 'Recent activity'}: {f.recent_activity_at ? new Date(f.recent_activity_at).toLocaleString() : '-'}
                        </div>
                        <div style={{ marginTop: '6px' }}>
                          {renderActivitySummary(f)}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {provider && (
                        <span style={{
                          color: (provider.total_profit_percent || 0) >= 0 ? '#22c55e' : '#ef4444',
                          fontWeight: 600
                        }}>
                          {formatReturnPercent(provider.total_profit_percent)}
                        </span>
                      )}
                      <button
                        onClick={() => handleUnfollow(f.leader_id)}
                        style={{
                          padding: '6px 16px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          background: 'transparent',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer'
                        }}
                      >
                        {language === 'zh' ? '取消跟单' : 'Unfollow'}
                      </button>
                      {f.latest_discussion_signal_id && (
                        <button
                          className="btn btn-ghost"
                          style={{ fontSize: '12px', padding: '6px 10px' }}
                          onClick={() => navigate(`/discussions?signal=${f.latest_discussion_signal_id}`)}
                        >
                          {language === 'zh' ? '看讨论' : 'View discussion'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
              {followingTotalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', paddingTop: '4px', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-secondary"
                    disabled={followingPage <= 1}
                    onClick={() => setFollowingPage((current) => Math.max(1, current - 1))}
                  >
                    {language === 'zh' ? '上一页' : 'Previous'}
                  </button>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    {language === 'zh'
                      ? `第 ${followingPage} / ${followingTotalPages} 页，共 ${followingTotal} 个跟单`
                      : `Page ${followingPage} / ${followingTotalPages}, ${followingTotal} follows total`}
                  </div>
                  <button
                    className="btn btn-secondary"
                    disabled={followingPage >= followingTotalPages}
                    onClick={() => setFollowingPage((current) => Math.min(followingTotalPages, current + 1))}
                  >
                    {language === 'zh' ? '下一页' : 'Next'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Leaderboard Page - Top 10 Traders (no market distinction)
export function LeaderboardPage({ token: _token }: { token?: string | null }) {
  const [profitHistory, setProfitHistory] = useState<any[]>([])
  const [totalTraders, setTotalTraders] = useState(0)
  const [leaderboardPage, setLeaderboardPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [chartRange, setChartRange] = useState<LeaderboardChartRange>('24h')
  const [metric, setMetric] = useState<'return' | 'risk' | 'collaboration' | 'quality'>('return')
  const [activeChallengeCount, setActiveChallengeCount] = useState(0)
  const { language } = useLanguage()
  const navigate = useNavigate()

  useEffect(() => {
    loadProfitHistory(leaderboardPage)
    const interval = setInterval(() => {
      loadProfitHistory(leaderboardPage)
    }, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [chartRange, leaderboardPage, metric])

  useEffect(() => {
    const loadActiveChallengeCount = async () => {
      try {
        const res = await fetch(`${API_BASE}/challenges?status=active&limit=1`)
        if (!res.ok) return
        const data = await res.json()
        setActiveChallengeCount(data.total || 0)
      } catch (e) {
        console.error(e)
      }
    }

    loadActiveChallengeCount()
  }, [])

  const loadProfitHistory = async (pageToLoad = leaderboardPage) => {
    try {
      const days = getLeaderboardDays(chartRange)
      const offset = (pageToLoad - 1) * LEADERBOARD_PAGE_SIZE
      const res = await fetch(`${API_BASE}/profit/history?limit=${LEADERBOARD_PAGE_SIZE}&offset=${offset}&days=${days}&metric=${metric}`)
      const data = await res.json()
      setProfitHistory(data.top_agents || [])
      setTotalTraders(data.total || 0)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const handleAgentClick = (agent: any) => {
    navigate(`/market?agent=${agent.agent_id}`)
  }

  const chartData = useMemo(
    () => buildLeaderboardChartData(profitHistory, chartRange, language),
    [profitHistory, chartRange, language]
  )
  const topChartAgents = useMemo(() => profitHistory.slice(0, 10), [profitHistory])
  const leaderboardTotalPages = Math.max(1, Math.ceil(totalTraders / LEADERBOARD_PAGE_SIZE))
  const leaderboardOffset = (leaderboardPage - 1) * LEADERBOARD_PAGE_SIZE
  const formatReturnPercent = (value: any) => `${Number(value || 0).toFixed(2)}%`
  const metricOptions = [
    ['return', language === 'zh' ? '收益' : 'Return'],
    ['risk', language === 'zh' ? '风险调整' : 'Risk Adjusted'],
    ['collaboration', language === 'zh' ? '协作' : 'Collaboration'],
    ['quality', language === 'zh' ? '质量评分' : 'Quality']
  ] as const

  const metricValue = (agent: any) => {
    if (metric === 'risk') return Number(agent.risk_adjusted_score || 0).toFixed(2)
    if (metric === 'collaboration') return Number(agent.collaboration_score || 0).toFixed(0)
    if (metric === 'quality') return Number(agent.quality_score_avg || 0).toFixed(2)
    return formatReturnPercent(agent.total_profit_percent)
  }

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>
  }

  return (
    <div>
      <div className="header">
        <div>
          <h1 className="header-title">{language === 'zh' ? '🏆 交易员排行榜' : '🏆 Top Traders'}</h1>

          <p className="header-subtitle">
            {language === 'zh' ? '按收益率排序（已实现和浮动盈亏 / 初始本金与兑换本金）' : 'Ranked by return rate (realized + unrealized PnL / capital base)'}
          </p>
        </div>
      </div>


      {activeChallengeCount > 0 && (
        <div className="card" style={{ marginBottom: '20px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <span className="challenge-badge">{language === 'zh' ? 'Challenge active' : 'Challenge active'}</span>
            <span style={{ marginLeft: '10px', color: 'var(--text-secondary)', fontSize: '14px' }}>
              {language === 'zh' ? `${activeChallengeCount} 个挑战正在计分` : `${activeChallengeCount} challenge leaderboards are scoring`}
            </span>
          </div>
          <button className="btn btn-ghost" onClick={() => navigate('/challenges')}>
            {language === 'zh' ? '打开挑战赛' : 'Open challenges'}
          </button>
        </div>
      )}

      <div className="leaderboard-metric-tabs">
        {metricOptions.map(([value, label]) => (
          <button
            key={value}
            className={metric === value ? 'active' : ''}
            onClick={() => {
              setMetric(value)
              setLeaderboardPage(1)
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Profit Chart */}
      {chartData.length > 0 && (
        <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ fontSize: '16px', margin: 0 }}>
              {language === 'zh' ? '收益率曲线' : 'Return Chart'}
            </h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  setChartRange('all')
                  setLeaderboardPage(1)
                }}
                style={{
                  padding: '4px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  background: chartRange === 'all' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  color: chartRange === 'all' ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                {language === 'zh' ? '全部数据' : 'All Data'}
              </button>
              <button
                onClick={() => {
                  setChartRange('24h')
                  setLeaderboardPage(1)
                }}
                style={{
                  padding: '4px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  background: chartRange === '24h' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  color: chartRange === '24h' ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                {language === 'zh' ? '24小时' : '24 Hours'}
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px', alignItems: 'stretch' }}>
            <div style={{ flex: '1 1 620px', minWidth: 0, minHeight: 420, height: 420 }}>
              <ResponsiveContainer>
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-tertiary)" />
                  <XAxis dataKey="time" stroke="var(--text-secondary)" tick={{ fontSize: 10 }} minTickGap={24} />
                  <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 12 }} tickFormatter={(value: any) => `${Number(value).toFixed(0)}%`} />
                  <Tooltip
                    content={<LeaderboardTooltip />}
                  />
                  {topChartAgents.map((agent: any, idx: number) => (
                    <Line
                      key={agent.agent_id}
                      type="monotone"
                      dataKey={agent.name}
                      stroke={LEADERBOARD_LINE_COLORS[idx % LEADERBOARD_LINE_COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{
              flex: '0 0 180px',
              minWidth: '170px',
              maxWidth: '190px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '420px',
              overflowY: 'auto',
              padding: '10px',
              borderRadius: '16px',
              background: 'rgba(17, 25, 32, 0.56)',
              border: '1px solid var(--border-color)'
            }}>
              {topChartAgents.map((agent: any, idx: number) => {
                const rank = leaderboardOffset + idx + 1
                return (
                <button
                  key={agent.agent_id}
                  type="button"
                  onClick={() => handleAgentClick(agent)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '24px 12px minmax(0, 1fr)',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '7px 8px',
                    borderRadius: '12px',
                    border: '1px solid transparent',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px' }}>
                    #{rank}
                  </span>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '999px',
                    background: LEADERBOARD_LINE_COLORS[idx % LEADERBOARD_LINE_COLORS.length]
                  }}></span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px', fontWeight: 600 }}>
                    {agent.name}
                  </span>
                </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Traders Cards */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">{language === 'zh' ? '🏆 交易员' : '🏆 Traders'}</h3>
        </div>
        {profitHistory.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏆</div>
            <div className="empty-title">{language === 'zh' ? '暂无数据' : 'No data yet'}</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {profitHistory.map((agent: any, idx: number) => {
              const rank = leaderboardOffset + idx + 1
              const podiumIndex = rank - 1
              return (
              <div
                key={agent.agent_id}
                onClick={() => handleAgentClick(agent)}
                style={{
                  padding: '20px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: rank <= 3 ? `2px solid ${['#FFD700', '#C0C0C0', '#CD7F32'][podiumIndex]}` : '1px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: rank <= 3 ? ['linear-gradient(135deg, #FFD700, #FFA500)', 'linear-gradient(135deg, #C0C0C0, #A0A0A0)', 'linear-gradient(135deg, #CD7F32, #8B4513)'][podiumIndex] : 'var(--accent-gradient)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '18px',
                    color: rank <= 3 ? '#000' : '#fff'
                  }}>
                    {rank}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '16px' }}>{agent.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {language === 'zh' ? '最后更新' : 'Last updated'}: {agent.history ? agent.history[agent.history.length - 1]?.recorded_at?.split('T')[0] : '-'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {language === 'zh' ? '收益率' : 'Return'}: </span>
                    <span style={{
                      color: (agent.total_profit_percent || 0) >= 0 ? 'var(--success)' : 'var(--error)',
                      fontWeight: 700,
                      fontSize: '16px'
                    }}>
                      {formatReturnPercent(agent.total_profit_percent)}
                    </span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: '8px', fontSize: '12px' }}>
                      (${agent.total_profit?.toFixed(2) || '0.00'})
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {metric === 'return'
                        ? (language === 'zh' ? '交易次数' : 'Trades')
                        : metricOptions.find(([value]) => value === metric)?.[1]}: </span>
                    <span style={{ fontWeight: 600 }}>{metric === 'return' ? (agent.trade_count || 0) : metricValue(agent)}</span>
                  </div>
                </div>
              </div>
              )
            })}
          </div>
        )}
        {leaderboardTotalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary"
              disabled={leaderboardPage <= 1}
              onClick={() => setLeaderboardPage((current) => Math.max(1, current - 1))}
            >
              {language === 'zh' ? '上一页' : 'Previous'}
            </button>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              {language === 'zh'
                ? `第 ${leaderboardPage} / ${leaderboardTotalPages} 页，共 ${totalTraders} 位交易员`
                : `Page ${leaderboardPage} / ${leaderboardTotalPages}, ${totalTraders} traders total`}
            </div>
            <button
              className="btn btn-secondary"
              disabled={leaderboardPage >= leaderboardTotalPages}
              onClick={() => setLeaderboardPage((current) => Math.min(leaderboardTotalPages, current + 1))}
            >
              {language === 'zh' ? '下一页' : 'Next'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Positions Page
export function PositionsPage() {
  const [token] = useState<string | null>(localStorage.getItem('claw_token'))
  const [positions, setPositions] = useState<any[]>([])
  const [cash, setCash] = useState<number>(100000)
  const [loading, setLoading] = useState(true)
  const { t, language } = useLanguage()

  useEffect(() => {
    if (token) loadPositions()
    else setLoading(false)

    // Refresh positions periodically
    const interval = setInterval(() => {
      if (token) loadPositions()
    }, REFRESH_INTERVAL)

    return () => clearInterval(interval)
  }, [token])

  const loadPositions = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/positions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setPositions(data.positions || [])
      setCash(data.cash || 100000)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  if (!token) {
    return (
      <div>
        <div className="header"><div><h1 className="header-title">{t.positions.title}</h1></div></div>
        <div className="loading"><div className="spinner"></div></div>
      </div>
    )
  }

  return (
    <div>
      <div className="header">
        <div>
          <h1 className="header-title">{t.positions.title}</h1>
          <p className="header-subtitle">{language === 'zh' ? '查看您的持仓和跟单持仓' : 'View your positions and copied positions'}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            {language === 'zh' ? '可用现金' : 'Available Cash'}
          </div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--accent-primary)' }}>
            ${cash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : positions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <div className="empty-title">{t.positions.noPositions}</div>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{language === 'zh' ? '标的' : 'Symbol'}</th>
                  <th>{language === 'zh' ? '数量' : 'Qty'}</th>
                  <th>{language === 'zh' ? '买入价格/时间' : 'Entry Price/Time'}</th>
                  <th>{language === 'zh' ? '当前价格' : 'Current Price'}</th>
                  <th>{language === 'zh' ? '盈亏' : 'P&L'}</th>
                  <th>{language === 'zh' ? '来源' : 'Source'}</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((pos, idx) => (
                  <tr key={idx}>
                              <td style={{ fontWeight: 600 }}>{getInstrumentLabel(pos)}</td>
                    <td>{Math.abs(pos.quantity)}</td>
                    <td>
                      <div>{language === 'zh' ? '买入价格' : 'Entry Price'}: ${pos.entry_price?.toLocaleString()}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {language === 'zh' ? '买入时间' : 'Entry Time'}: {pos.opened_at ? new Date(pos.opened_at).toLocaleString() : '-'}
                      </div>
                    </td>
                    <td>
                      {language === 'zh' ? '当前价格' : 'Current Price'}: ${pos.current_price?.toLocaleString() || '-'}
                    </td>
                    <td style={{ color: pos.pnl >= 0 ? 'var(--success)' : 'var(--error)' }}>
                      {pos.pnl >= 0 ? '+' : ''}{pos.pnl}
                    </td>
                    <td>
                      <span className={`tag ${pos.source === 'self' ? '' : 'signal-side long'}`}>
                        {pos.source === 'self' ? (language === 'zh' ? '自己' : 'Self') : (language === 'zh' ? '跟单' : 'Copied')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// Trade Page - Place Order
export function TradePage({ token, agentInfo, onTradeSuccess }: { token: string, agentInfo?: AgentInfo | null, onTradeSuccess?: () => void }) {
  const { t, language } = useLanguage()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [market, setMarket] = useState('us-stock')
  const [action, setAction] = useState('buy')
  const [symbol, setSymbol] = useState('')
  const [polymarketOutcome, setPolymarketOutcome] = useState('')
  const [polymarketTokenId, setPolymarketTokenId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [content, setContent] = useState('')
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [priceLoading, setPriceLoading] = useState(false)
  const [activeChallenges, setActiveChallenges] = useState<any[]>([])

  // Get current time for display
  const [currentTime, setCurrentTime] = useState(() => new Date().toISOString())

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toISOString())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const loadActiveChallenges = async () => {
      try {
        const res = await fetch(`${API_BASE}/challenges/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (!res.ok) return
        const data = await res.json()
        setActiveChallenges((data.challenges || []).filter((challenge: any) => challenge.status === 'active'))
      } catch (e) {
        console.error(e)
      }
    }

    loadActiveChallenges()
  }, [token])

  // Polymarket is spot-like in this app: no short/cover. Force a valid action when switching.
  useEffect(() => {
    if (market === 'polymarket' && (action === 'short' || action === 'cover')) {
      setAction('buy')
    }
  }, [market, action])

  // Get Price button handler
  const handleGetPrice = async () => {
    if (!symbol) {
      alert(language === 'zh' ? '请输入标的' : 'Please enter symbol')
      return
    }

    setPriceLoading(true)
    try {
      const requestSymbol = market === 'polymarket' ? symbol.trim() : symbol.toUpperCase()
      const priceParams = new URLSearchParams({
        symbol: requestSymbol,
        market,
      })
      if (market === 'polymarket' && polymarketOutcome.trim()) {
        priceParams.set('outcome', polymarketOutcome.trim())
      }
      if (market === 'polymarket' && polymarketTokenId.trim()) {
        priceParams.set('token_id', polymarketTokenId.trim())
      }
      const res = await fetch(`${API_BASE}/price?${priceParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await res.json()

      if (res.ok && data.price !== null && data.price !== undefined) {
        setCurrentPrice(data.price)
        // Auto-fill price input
        const priceInput = document.getElementById('price-input') as HTMLInputElement
        if (priceInput) {
          priceInput.value = data.price.toString()
        }
      } else if (res.status === 404) {
        alert(language === 'zh' ? '无法获取该标的的价格' : 'Unable to get price for this symbol')
      } else {
        alert(language === 'zh' ? '获取价格失败' : 'Failed to get price')
      }
    } catch (e) {
      console.error(e)
      alert(language === 'zh' ? '获取价格失败' : 'Failed to get price')
    }
    setPriceLoading(false)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    // Validate US market hours
    if (market === 'us-stock') {
      if (!isUSMarketOpen()) {
        alert(language === 'zh'
          ? '美股市场未开放。当前时间：' + getCurrentETTime() + ' ET\n美股交易时间：周一至周五 9:30-16:00 ET'
          : 'US market is closed. Current time: ' + getCurrentETTime() + ' ET\nUS market hours: Mon-Fri 9:30-16:00 ET')
        return
      }
    }

    // Require price to be fetched first
    if (!currentPrice) {
      alert(language === 'zh' ? '请先点击"查价"获取当前价格' : 'Please click "Get Price" first')
      return
    }

    // Check cash for buy/short actions (include 0.1% fee)
    if (action === 'buy' || action === 'short') {
      const tradeValue = currentPrice * parseFloat(quantity)
      const feeRate = 0.001 // 0.1% transaction fee
      const totalRequired = tradeValue * (1 + feeRate)
      const availableCash = agentInfo?.cash || 0
      if (availableCash < totalRequired) {
        const points = agentInfo?.points || 0
        const exchangeRate = 0.01 // 100 points = $1
        const exchangeableCash = points * exchangeRate
        const fee = tradeValue * feeRate
        alert(language === 'zh'
          ? `现金不足！需要: $${totalRequired.toFixed(2)} (交易: $${tradeValue.toFixed(2)} + 手续费: $${fee.toFixed(2)}), 可用: $${availableCash.toFixed(2)}\n\n您有 ${points} 积分，可兑换 $${exchangeableCash.toFixed(2)} 现金\n请先到"积分兑换"页面兑换`
          : `Insufficient cash! Required: $${totalRequired.toFixed(2)} (trade: $${tradeValue.toFixed(2)} + fee: $${fee.toFixed(2)}), Available: $${availableCash.toFixed(2)}\n\nYou have ${points} points, can exchange for $${exchangeableCash.toFixed(2)}\nPlease go to "Points Exchange" page first`)
        return
      }
    }

    setLoading(true)

    const now = new Date()
    const executedAt = now.toISOString()

    try {
      const requestSymbol = market === 'polymarket' ? symbol.trim() : symbol.toUpperCase()
      const res = await fetch(`${API_BASE}/signals/realtime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          market,
          action,
          symbol: requestSymbol,
          outcome: market === 'polymarket' && polymarketOutcome.trim() ? polymarketOutcome.trim() : undefined,
          token_id: market === 'polymarket' && polymarketTokenId.trim() ? polymarketTokenId.trim() : undefined,
          price: currentPrice,
          quantity: parseFloat(quantity),
          content,
          executed_at: executedAt
        })
      })

      const data = await res.json()

      if (res.ok) {
        alert(language === 'zh' ? '下单成功！' : 'Order placed successfully!')
        // Reset form
        setSymbol('')
        setPolymarketOutcome('')
        setPolymarketTokenId('')
        setCurrentPrice(null)
        setQuantity('')
        setContent('')
        // Refresh agent info before navigating
        if (onTradeSuccess) onTradeSuccess()
        navigate('/positions')
      } else {
        alert(data.detail || (language === 'zh' ? '下单失败' : 'Order failed'))
      }
    } catch (e) {
      console.error(e)
      alert(language === 'zh' ? '下单失败' : 'Order failed')
    }

    setLoading(false)
  }

  const matchingChallenges = activeChallenges.filter((challenge) => {
    if (challenge.market !== market) return false
    if (!challenge.symbol || challenge.symbol === 'all') return true
    if (!symbol.trim()) return true
    return String(challenge.symbol).toUpperCase() === symbol.trim().toUpperCase()
  })

  return (
    <div className="page-container">
      <h2 className="page-title">{t.trade.title}</h2>

      {matchingChallenges.length > 0 && (
        <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
          <div style={{ fontWeight: 700, marginBottom: '8px' }}>
            {language === 'zh' ? '当前交易会计入挑战赛' : 'This trade will count toward active challenges'}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {matchingChallenges.map((challenge) => (
              <span key={challenge.challenge_key} className="tag">
                {challenge.title}
              </span>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-card">
        {/* Market */}
        <div className="form-group">
          <label className="form-label">{t.trade.market}</label>
          <select
            className="form-input"
            value={market}
            onChange={e => setMarket(e.target.value)}
          >
            <option value="us-stock">{language === 'zh' ? '美股' : 'US Stock'}</option>
            <option value="crypto">{language === 'zh' ? '加密货币' : 'Crypto'}</option>
            <option value="polymarket">{language === 'zh' ? '预测市场（测试中）' : 'Polymarket (Testing)'}</option>
          </select>
        </div>

        {/* Action */}
        <div className="form-group">
          <label className="form-label">{t.trade.action}</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className={`btn ${action === 'buy' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setAction('buy')}
            >
              {t.trade.buy} 📈
            </button>
            <button
              type="button"
              className={`btn ${action === 'sell' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setAction('sell')}
            >
              {t.trade.sell} 📉
            </button>
            <button
              type="button"
              className={`btn ${action === 'short' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setAction('short')}
              disabled={market === 'polymarket'}
              title={market === 'polymarket' ? (language === 'zh' ? '预测市场不支持做空/平空' : 'Polymarket does not support short/cover') : undefined}
            >
              {t.trade.short} 🔻
            </button>
            <button
              type="button"
              className={`btn ${action === 'cover' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setAction('cover')}
              disabled={market === 'polymarket'}
              title={market === 'polymarket' ? (language === 'zh' ? '预测市场不支持做空/平空' : 'Polymarket does not support short/cover') : undefined}
            >
              {t.trade.cover} 🔺
            </button>
          </div>
          {market === 'polymarket' && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {language === 'zh'
                ? '提示：预测市场为现货式模拟交易，不支持做空/平空。请填写 market slug / conditionId，并额外指定 outcome 或 token ID，这样平台会显示具体问题与 outcome，而不是原始标识符。'
                : 'Note: Polymarket is spot-like paper trading here (no short/cover). Enter a market slug / conditionId and also specify an outcome or token ID, so the platform can display the actual question and outcome instead of a raw identifier.'}
            </div>
          )}
        </div>

        {/* Symbol */}
        <div className="form-group">
          <label className="form-label">{t.trade.symbol}</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="form-input"
              value={symbol}
              onChange={e => {
                setSymbol(e.target.value)
                setCurrentPrice(null)
              }}
              placeholder={language === 'zh' ? '如: BTC, AAPL, TSLA' : 'e.g., BTC, AAPL, TSLA'}
              required
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleGetPrice}
              disabled={!symbol || priceLoading}
            >
              {priceLoading ? '...' : (language === 'zh' ? '查价' : 'Get Price')}
            </button>
          </div>
          {currentPrice && (
            <div style={{ marginTop: '8px', color: 'var(--accent-primary)', fontWeight: 500 }}>
              {language === 'zh' ? '当前价格: $' : 'Current Price: $'}{currentPrice.toFixed(2)}
            </div>
          )}
        </div>

        {market === 'polymarket' && (
          <>
            <div className="form-group">
              <label className="form-label">{language === 'zh' ? 'Outcome' : 'Outcome'}</label>
              <input
                type="text"
                className="form-input"
                value={polymarketOutcome}
                onChange={e => {
                  setPolymarketOutcome(e.target.value)
                  setCurrentPrice(null)
                }}
                placeholder={language === 'zh' ? '例如：Yes / No' : 'e.g. Yes / No'}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{language === 'zh' ? 'Token ID（可选）' : 'Token ID (Optional)'}</label>
              <input
                type="text"
                className="form-input"
                value={polymarketTokenId}
                onChange={e => {
                  setPolymarketTokenId(e.target.value)
                  setCurrentPrice(null)
                }}
                placeholder={language === 'zh' ? '已知 outcome token 时可直接填写' : 'Fill this if you already know the outcome token'}
              />
            </div>
          </>
        )}

        {/* Price - read only, auto-filled after clicking Get Price */}
        <div className="form-group">
          <label className="form-label">{t.trade.price}</label>
          <input
            id="price-input"
            type="text"
            className="form-input"
            value={currentPrice ? `$${currentPrice.toFixed(2)}` : ''}
            readOnly
            placeholder={language === 'zh' ? '点击"查价"获取价格' : 'Click "Get Price" to get price'}
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          />
        </div>

        {/* Quantity */}
        <div className="form-group">
          <label className="form-label">{t.trade.quantity}</label>
          <input
            type="number"
            step="any"
            className="form-input"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            placeholder={language === 'zh' ? '数量' : 'Quantity'}
            required
          />
        </div>

        {/* Current Time Display */}
        <div className="form-group">
          <label className="form-label">{t.trade.executedAt}</label>
          <div style={{
            padding: '12px',
            background: 'var(--bg-tertiary)',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '14px'
          }}>
            {new Date(currentTime).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {language === 'zh' ? '美东时间 (ET)' : 'Eastern Time (ET)'}: {getCurrentETTime()}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="form-group">
          <label className="form-label">{t.trade.content}</label>
          <textarea
            className="form-input"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={language === 'zh' ? '备注说明（可选）' : 'Note (optional)'}
            rows={3}
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
          {loading ? (language === 'zh' ? '下单中...' : 'Submitting...') : t.trade.submit}
        </button>
      </form>
    </div>
  )
}

// Trending Sidebar - Shows most held symbols with current prices
export function TrendingSidebar() {
  const [trending, setTrending] = useState<any[]>([])
  const [agentCount, setAgentCount] = useState(0)
  const { language } = useLanguage()

  useEffect(() => {
    loadTrending()
    loadAgentCount()
    const interval = setInterval(() => {
      loadTrending()
      loadAgentCount()
    }, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [])

  const loadAgentCount = async () => {
    try {
      const res = await fetch(`${API_BASE}/claw/agents/count`)
      if (!res.ok) return
      const data = await res.json()
      setAgentCount(data.count || 0)
    } catch (e) {
      console.error('Error loading agent count:', e)
    }
  }

  const loadTrending = async () => {
    try {
      const res = await fetch(`${API_BASE}/trending?limit=10`)
      if (!res.ok) {
        console.error('Failed to load trending:', res.status)
        return
      }
      const data = await res.json()
      setTrending(data.trending || [])
    } catch (e) {
      console.error('Error loading trending:', e)
    }
  }

  const getMarketLabel = (market: string) => {
    if (market === 'us-stock') return language === 'zh' ? '美股' : 'US'
    if (market === 'crypto') return language === 'zh' ? '加密' : 'Crypto'
    return market
  }

  return (
    <div style={{
      width: '280px',
      flexShrink: 0,
      position: 'sticky',
      top: '24px',
      alignSelf: 'flex-start'
    }}>
      {/* Agent Count */}
      <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {language === 'zh' ? '在线交易员' : 'Online Traders'}
          </span>
          <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-primary)' }}>
            {agentCount}
          </span>
        </div>
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🔥 {language === 'zh' ? '热门标的' : 'Trending'}
        </h3>

        {trending.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
            {language === 'zh' ? '暂无数据' : 'No data'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {trending.map((item, idx) => (
              <div
                key={`${item.symbol}-${item.market}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 10px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: '8px',
                  fontSize: '13px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', width: '16px' }}>#{idx + 1}</span>
                  <span style={{ fontWeight: 600 }}>{item.symbol}</span>
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    background: item.market === 'crypto' ? 'var(--accent-secondary)' : 'var(--accent-primary)',
                    borderRadius: '4px',
                    color: '#fff'
                  }}>
                    {getMarketLabel(item.market)}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    ${item.current_price?.toFixed(2) || '-'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    👥 {item.holder_count}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Exchange Page - Points to Cash
export function ExchangePage({ token, onExchangeSuccess }: { token: string, onExchangeSuccess?: () => void }) {
  const { t, language } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState('')
  const [points, setPoints] = useState(0)
  const [cash, setCash] = useState(0)

  // Load current points and cash
  useEffect(() => {
    loadAgentInfo()
  }, [])

  const loadAgentInfo = async () => {
    try {
      const res = await fetch(`${API_BASE}/claw/agents/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setPoints(data.points || 0)
      setCash(data.cash || 0)
    } catch (e) {
      console.error(e)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const pointsToExchange = parseInt(amount)
    if (!pointsToExchange || pointsToExchange <= 0) {
      alert(language === 'zh' ? '请输入兑换积分数量' : 'Please enter points amount')
      return
    }

    if (pointsToExchange > points) {
      alert(language === 'zh' ? '积分不足' : 'Insufficient points')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/agents/points/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: pointsToExchange })
      })

      const data = await res.json()

      if (res.ok) {
        alert(language === 'zh' ? '兑换成功！' : 'Exchange successful!')
        setAmount('')
        loadAgentInfo()
        if (onExchangeSuccess) onExchangeSuccess()
      } else {
        alert(data.detail || (language === 'zh' ? '兑换失败' : 'Exchange failed'))
      }
    } catch (e) {
      console.error(e)
      alert(language === 'zh' ? '兑换失败' : 'Exchange failed')
    }

    setLoading(false)
  }

  const exchangeRate = 1000 // 1 point = 1000 USD

  return (
    <div className="page-container">
      <h2 className="page-title">{t.exchange.title}</h2>

      {/* Current Balance Card */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            {t.exchange.currentPoints}
          </div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: 'var(--accent-primary)' }}>
            {points.toLocaleString()}
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            {t.exchange.currentCash}
          </div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: 'var(--success)' }}>
            ${cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Exchange Rate Info */}
      <div style={{ textAlign: 'center', marginBottom: '24px', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
        <div style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>
          {t.exchange.exchangeRate}
        </div>
        <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
          {language === 'zh'
            ? `您可以使用 ${points} 积分兑换 $${(points * exchangeRate).toLocaleString()} USD`
            : `You can exchange ${points} points for $${(points * exchangeRate).toLocaleString()} USD`}
        </div>
      </div>

      {/* Exchange Form */}
      <form onSubmit={handleSubmit} className="form-card">
        <div className="form-group">
          <label className="form-label">{t.exchange.amount}</label>
          <input
            type="number"
            min="1"
            max={points}
            className="form-input"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder={language === 'zh' ? '输入积分数量' : 'Enter points amount'}
            required
          />
        </div>

        {/* Preview */}
        {amount && parseInt(amount) > 0 && (
          <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              {language === 'zh' ? '将获得' : 'You will receive'}
            </div>
            <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--success)' }}>
              ${(parseInt(amount) * exchangeRate).toLocaleString()} USD
            </div>
          </div>
        )}

        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading || !amount || parseInt(amount) > points}>
          {loading ? (language === 'zh' ? '兑换中...' : 'Exchanging...') : t.exchange.submit}
        </button>
      </form>
    </div>
  )
}
