import { useState } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { ArrowRightCircle, Zap, LockKeyhole, Fingerprint, Menu, X } from 'lucide-react'

function Logo() {
  return (
    <svg width={32} height={32} viewBox="0 0 256 256" fill="#192837" xmlns="http://www.w3.org/2000/svg">
      <path d="M 64 128 L 64.5 128 L 32 95 L 0 64 L 0 0 L 64 0 L 128 64 L 128 64.5 L 161 32 L 192 0 L 256 0 L 256 64 L 192 128 L 128 128 L 128 192 L 96 223 L 63.5 256 L 0 256 L 0 192 Z M 256 192 L 224 223 L 191.5 256 L 128 256 L 128 192 L 192 128 L 256 128 Z" />
    </svg>
  )
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
}

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Markets', href: '#markets' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Quick Start', href: '#quick-start' },
  { label: 'GitHub', href: 'https://github.com/HungYann/AlphaAgent' },
]

export default function Hero() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="relative w-full overflow-hidden" style={{ height: '100dvh', minHeight: '100vh' }}>
      <video
        autoPlay muted loop playsInline
        className="absolute inset-0 z-0 w-full h-full object-cover"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260606_131516_eca35265-ea66-4fbd-8d52-22aae6e1a503.mp4"
      />

      {/* Navbar */}
      <nav className="relative z-10 flex justify-between items-center px-5 sm:px-8 py-4 sm:py-5" style={{ maxWidth: 1280, margin: '0 auto' }}>
        <Logo />
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(link => (
            <a key={link.label} href={link.href}
              className="text-sm font-medium transition-opacity hover:opacity-70"
              style={{ color: 'var(--color-text)', textDecoration: 'none' }}
              target={link.href.startsWith('http') ? '_blank' : undefined}
              rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
            >{link.label}</a>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-3">
          <a href="https://github.com/HungYann/AlphaAgent" target="_blank" rel="noreferrer"
            className="text-sm font-semibold px-5 py-2.5 rounded-full text-white transition-all hover:shadow-lg"
            style={{ background: '#7342E2', textDecoration: 'none' }}>
            Get Started
          </a>
          <a href="#quick-start"
            className="text-sm font-semibold px-5 py-2.5 rounded-full transition-all hover:shadow-md"
            style={{ background: '#F2F2EE', color: 'var(--color-text)', textDecoration: 'none' }}>
            Quick Start
          </a>
        </div>
        <button className="md:hidden p-1" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <Menu size={24} color="#192837" />
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-20"
              style={{ background: 'rgba(25,40,55,0.35)', backdropFilter: 'blur(4px)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              className="fixed top-0 right-0 z-30 flex flex-col"
              style={{ width: 'min(88vw, 360px)', height: '100dvh', background: '#CFC8C5', boxShadow: '-12px 0 48px rgba(25,40,55,0.18)' }}
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex justify-between items-center px-6 py-5">
                <Logo />
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center rounded-full"
                  style={{ width: 40, height: 40, background: 'rgba(25,40,55,0.1)' }}
                  aria-label="Close menu">
                  <X size={20} color="#192837" />
                </motion.button>
              </div>
              <div style={{ height: 1, background: 'rgba(25,40,55,0.12)', margin: '0 24px' }} />
              <div className="flex flex-col px-3 py-4 gap-1 flex-1">
                {NAV_LINKS.map((link, i) => (
                  <motion.a key={link.label} href={link.href}
                    className="rounded-xl px-4 py-3 font-medium hover:bg-black/10 transition-colors"
                    style={{ fontSize: '1.1rem', color: 'var(--color-text)', textDecoration: 'none' }}
                    initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.18 + i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    onClick={() => setMenuOpen(false)}
                    target={link.href.startsWith('http') ? '_blank' : undefined}
                    rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
                  >{link.label}</motion.a>
                ))}
              </div>
              <div className="flex flex-col gap-3 px-6 pb-8">
                <a href="https://github.com/HungYann/AlphaAgent" target="_blank" rel="noreferrer"
                  className="w-full rounded-full font-semibold text-white text-center"
                  style={{ background: '#7342E2', fontSize: '0.95rem', padding: '14px 0', textDecoration: 'none', display: 'block' }}>
                  Get Started on GitHub
                </a>
                <a href="#quick-start"
                  className="w-full rounded-full font-semibold text-center"
                  style={{ background: '#F2F2EE', color: 'var(--color-text)', fontSize: '0.95rem', padding: '14px 0', textDecoration: 'none', display: 'block' }}
                  onClick={() => setMenuOpen(false)}>
                  Quick Start
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center text-center"
        style={{ maxWidth: 1280, margin: '0 auto', paddingTop: 'clamp(40px, 8vw, 72px)', paddingBottom: 48, paddingLeft: 20, paddingRight: 20 }}>
        <div style={{ maxWidth: 660 }}>
          <motion.h1
            custom={0} variants={fadeUp} initial="hidden" animate="visible"
            style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.65rem, 5vw, 3rem)', lineHeight: 1.05, letterSpacing: '-0.01em', color: 'var(--color-text)', textAlign: 'center', margin: '0 0 20px' }}>
            <span style={{ whiteSpace: 'nowrap' }}>
              Trade{' '}
              <Zap size={24} color="#192837" style={{ display: 'inline', verticalAlign: 'middle', position: 'relative', top: -2, margin: '0 4px' }} />
              {' '}Smarter with{' '}
              <LockKeyhole size={24} color="#192837" style={{ display: 'inline', verticalAlign: 'middle', position: 'relative', top: -2, margin: '0 4px' }} />
              {' '}Your Own AI
            </span>
            <br />
            <span>
              100% Local & Private{' '}
              <Fingerprint size={24} color="#192837" style={{ display: 'inline', verticalAlign: 'middle', position: 'relative', top: -2, marginLeft: 6 }} />
            </span>
          </motion.h1>

          <motion.p
            custom={1} variants={fadeUp} initial="hidden" animate="visible"
            style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)', color: 'var(--color-text)', opacity: 0.8, maxWidth: 560, lineHeight: 1.65, textAlign: 'center', margin: '0 auto 32px' }}>
            Self-hosted AI trading platform — no login, no cloud dependency, runs 24/7 on your machine.
            Supports Claude, GPT-4o, DeepSeek, or the built-in Buffett skill.
          </motion.p>

          <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="flex justify-center">
            <motion.a
              href="https://github.com/HungYann/AlphaAgent"
              target="_blank" rel="noreferrer"
              whileHover={{ scale: 1.04, filter: 'brightness(1.1)' }}
              whileTap={{ scale: 0.96 }}
              style={{ borderRadius: 50, background: '#7342E2', color: '#fff', fontSize: 'clamp(0.9rem, 2vw, 1rem)', padding: '17px 24px', minWidth: 210, boxShadow: '0 4px 24px rgba(115,66,226,0.28)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, fontWeight: 600, textDecoration: 'none' }}>
              View on GitHub
              <ArrowRightCircle size={20} />
            </motion.a>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
