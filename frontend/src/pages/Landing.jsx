import { useNavigate } from 'react-router-dom'
import { createSession } from '../api/client'
import { useState } from 'react'
import GoogleBadge from '../components/GoogleBadge'

export default function Landing() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const start = async () => {
    setLoading(true)
    try {
      const res = await createSession()
      localStorage.setItem('session_id', res.data.session_id)
      navigate('/chat')
    } catch {
      const sid = 'local-' + Date.now()
      localStorage.setItem('session_id', sid)
      navigate('/chat')
    }
  }

  const features = [
    { icon: '💬', title: 'AI Chat', desc: 'Talk naturally about your dreams and interests' },
    { icon: '🧠', title: 'Personality', desc: 'MBTI + Enneagram personality assessment' },
    { icon: '🗺️', title: 'Roadmap', desc: '3 realistic career paths with action steps' },
    { icon: '📰', title: 'Live Trends', desc: 'Pakistan job market insights from real news' },
  ]

  const steps = [
    { num: '01', title: 'Chat with Raah', desc: 'Tell our AI about your interests and dreams' },
    { num: '02', title: 'Discover Yourself', desc: 'Take a quick personality assessment' },
    { num: '03', title: 'Share Your Background', desc: 'Help us understand your situation' },
    { num: '04', title: 'Get Your Roadmap', desc: 'Receive 3 personalized career paths' },
  ]

  return (
    <div style={{ minHeight: '100vh', overflow: 'hidden' }}>
      {/* Background Effects */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse 600px 400px at 20% 30%, rgba(108,99,255,0.12) 0%, transparent 70%),
          radial-gradient(ellipse 500px 300px at 80% 70%, rgba(255,101,132,0.08) 0%, transparent 70%),
          radial-gradient(ellipse 300px 300px at 50% 50%, rgba(0,212,170,0.04) 0%, transparent 70%)
        `
      }} />

      {/* Hero */}
      <section style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh', padding: '40px 20px',
        textAlign: 'center'
      }}>
        <div className="animate-in" style={{ marginBottom: '32px' }}>
          <GoogleBadge />
        </div>

        <div className="animate-in animate-in-delay-1" style={{
          width: '80px', height: '3px',
          background: 'linear-gradient(90deg, var(--accent), var(--accent2))',
          marginBottom: '32px', borderRadius: '2px'
        }} />

        <div style={{ maxWidth: '680px' }}>
          <div className="animate-in animate-in-delay-1" style={{
            fontSize: '15px', fontWeight: 600, color: 'var(--accent)',
            textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '24px'
          }}>
            <span className="urdu" style={{ fontSize: '22px', marginRight: '12px' }}>راہ</span>
            Raah
          </div>

          <h1 className="animate-in animate-in-delay-2" style={{
            fontSize: 'clamp(40px, 7vw, 68px)', lineHeight: 1.08,
            marginBottom: '28px', fontWeight: 900
          }}>
            Your Path,<br />
            <span className="gradient-text">Your Future</span>
          </h1>

          <p className="animate-in animate-in-delay-3" style={{
            fontSize: '18px', color: 'var(--text-muted)', lineHeight: 1.7,
            marginBottom: '20px', maxWidth: '520px', margin: '0 auto 20px'
          }}>
            Pakistan's first AI career companion built for teenagers.
            Real roadmaps. Real opportunities. Built for <strong style={{ color: 'var(--text)' }}>your reality</strong>.
          </p>

          <div className="animate-in animate-in-delay-3" style={{
            fontSize: '14px', color: 'var(--text-muted)', marginBottom: '40px',
            padding: '12px 24px', background: 'var(--surface)',
            borderRadius: '100px', border: '1px solid var(--border)',
            display: 'inline-flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center'
          }}>
            <span>✨ Free to use</span>
            <span style={{ color: 'var(--border)' }}>·</span>
            <span>⏱ Takes 8 minutes</span>
            <span style={{ color: 'var(--border)' }}>·</span>
            <span>🎯 Ages 13–20</span>
          </div>

          <div className="animate-in animate-in-delay-4">
            <button className="btn" onClick={start} disabled={loading}
              id="start-journey-btn"
              style={{
                fontSize: '18px', padding: '20px 52px', borderRadius: '14px',
                animation: loading ? 'none' : 'glow 3s ease-in-out infinite'
              }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ animation: 'pulse 1s infinite' }}>⏳</span> Starting...
                </span>
              ) : 'Find My Path →'}
            </button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="animate-in animate-in-delay-5" style={{
          position: 'absolute', bottom: '32px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
          color: 'var(--text-muted)', fontSize: '12px', letterSpacing: '1px',
          animation: 'float 3s ease-in-out infinite'
        }}>
          <span>EXPLORE</span>
          <span style={{ fontSize: '18px' }}>↓</span>
        </div>
      </section>

      {/* Features */}
      <section style={{
        position: 'relative', zIndex: 1,
        padding: '80px 20px', maxWidth: '900px', margin: '0 auto'
      }}>
        <h2 className="animate-in" style={{
          fontSize: '36px', textAlign: 'center', marginBottom: '16px'
        }}>
          What <span className="gradient-text">Raah</span> Does For You
        </h2>
        <p style={{
          textAlign: 'center', color: 'var(--text-muted)', marginBottom: '48px',
          fontSize: '16px', maxWidth: '500px', margin: '0 auto 48px'
        }}>
          AI-powered career guidance designed specifically for Pakistani youth
        </p>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          {features.map((f, i) => (
            <div key={f.title} className="card" style={{
              textAlign: 'center', padding: '32px 20px',
              animation: `fadeInUp 0.6s ease-out ${i * 0.1 + 0.2}s forwards`,
              opacity: 0, cursor: 'default'
            }}>
              <div style={{
                fontSize: '36px', marginBottom: '16px',
                animation: `float ${3 + i * 0.5}s ease-in-out infinite`
              }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '8px' }}>{f.title}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section style={{
        position: 'relative', zIndex: 1,
        padding: '60px 20px 100px', maxWidth: '700px', margin: '0 auto'
      }}>
        <h2 style={{ fontSize: '36px', textAlign: 'center', marginBottom: '48px' }}>
          How It <span className="gradient-text">Works</span>
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {steps.map((s, i) => (
            <div key={s.num} style={{
              display: 'flex', alignItems: 'center', gap: '24px',
              padding: '24px', borderRadius: '16px',
              background: 'var(--surface)', border: '1px solid var(--border)',
              animation: `fadeInUp 0.6s ease-out ${i * 0.15}s forwards`,
              opacity: 0
            }}>
              <div style={{
                fontSize: '28px', fontWeight: 900, color: 'var(--accent)',
                fontFamily: 'Playfair Display, serif',
                minWidth: '48px', opacity: 0.6
              }}>{s.num}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '4px' }}>{s.title}</div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <button className="btn" onClick={start} disabled={loading}
            style={{ fontSize: '17px', padding: '18px 44px' }}>
            {loading ? 'Starting...' : 'Start Now — It\'s Free →'}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)', padding: '32px 20px',
        textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px'
      }}>
        <div style={{ marginBottom: '8px' }}>
          <span className="urdu" style={{ fontSize: '16px' }}>راہ</span> · Built with ❤️ for Pakistani Youth
        </div>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <GoogleBadge />
        </div>
      </footer>
    </div>
  )
}