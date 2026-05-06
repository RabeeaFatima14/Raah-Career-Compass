import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createSession } from '../api/client'

const careerCards = [
  { emoji: '🩺', label: 'Medicine',    title: 'MBBS & beyond',  sub: 'MDCAT ready',    bg: '#f0f5fb', style: { left: '2%',  top: '12%',  transform: 'rotate(-4deg)' }, delay: '0.05s' },
  { emoji: '💻', label: 'Tech',        title: 'Software & AI',  sub: 'PSEB certified', bg: '#e8f5ef', style: { left: '8%',  bottom: '12%', transform: 'rotate(3deg)'  }, delay: '0.15s' },
  { emoji: '⚖️', label: 'Law & CSS',   title: 'Civil Service',  sub: 'NTS pathway',    bg: '#fdf5e0', style: { left: '20%', top: '8%',   transform: 'rotate(-2deg)' }, delay: '0.1s'  },
  { emoji: '🎨', label: 'Creative',    title: 'Design & Arts',  sub: 'portfolio.png',  bg: '#fbe8f0', style: { right: '2%', top: '10%',  transform: 'rotate(5deg)'  }, delay: '0.2s'  },
  { emoji: '📊', label: 'Business',    title: 'Finance & CA',   sub: 'ICAP track',     bg: '#f5eeff', style: { right: '9%', bottom: '10%', transform: 'rotate(-3deg)'}, delay: '0.25s' },
  { emoji: '🏗️', label: 'Engineering', title: 'ECAT Pathway',   sub: 'NUST, UET',      bg: '#e8f0fb', style: { right: '21%',top: '7%',   transform: 'rotate(2deg)'  }, delay: '0.3s'  },
]

export default function Landing() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const start = async () => {
    setLoading(true)
    try {
      const res = await createSession()
      localStorage.setItem('session_id', res.data.session_id)
    } catch {
      localStorage.setItem('session_id', 'local-' + Date.now())
    }
    navigate('/chat')
  }

  const features = [
    { icon: '💬', title: 'Guided Questions', desc: 'Answer a short, local onboarding questionnaire' },
    { icon: '🧠', title: 'Personality', desc: 'MBTI + Enneagram personality assessment' },
    { icon: '🗺️', title: 'Roadmap', desc: '3 realistic career paths with action steps' },
    { icon: '📰', title: 'Live Trends', desc: 'Pakistan job market insights from real news' },
  ]

  const steps = [
    { num: '01', title: 'Answer Guided Questions', desc: 'Tell Raah about your interests and strengths' },
    { num: '02', title: 'Discover Yourself', desc: 'Enter your personality results' },
    { num: '03', title: 'Share Your Background', desc: 'Help us understand your situation' },
    { num: '04', title: 'Get Your Roadmap', desc: 'Receive 3 personalized career paths' },
  ]

  return (
    <>
      {/* ── Hero ── */}
      <div style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {/* Floating career cards */}
        {careerCards.map((card, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: '120px',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 6px 22px rgba(90,60,30,0.14), 0 1px 4px rgba(90,60,30,0.08)',
            border: '1.5px solid rgba(196,140,120,0.18)',
            overflow: 'visible',
            animation: `floatIn 0.7s ease ${card.delay} both`,
            zIndex: 5,
            ...card.style,
          }}>
            {/* Tape */}
            <div style={{
              position: 'absolute', top: '-8px', left: '50%',
              transform: 'translateX(-50%)',
              width: '36px', height: '14px',
              background: 'rgba(234,194,100,0.6)',
              borderRadius: '2px', zIndex: 10,
            }} />
            {/* Emoji */}
            <div style={{
              background: card.bg, width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '36px', padding: '18px 0 10px',
              borderRadius: '7px 7px 0 0',
            }}>
              {card.emoji}
            </div>
            {/* Text */}
            <div style={{ padding: '8px 10px 10px' }}>
              <div style={{ fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9a7d5a', marginBottom: '3px', fontWeight: 500 }}>
                {card.label}
              </div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '12px', fontWeight: 700, color: '#1a1208', lineHeight: 1.2 }}>
                {card.title}
              </div>
              <div style={{ fontSize: '9px', color: '#c0a080', marginTop: '2px', fontStyle: 'italic' }}>
                {card.sub}
              </div>
            </div>
          </div>
        ))}

        {/* Center text */}
        <div style={{ textAlign: 'center', zIndex: 10, position: 'relative', padding: '0 20px' }}>
          <div style={{
            display: 'inline-block',
            background: '#e8b84b',
            padding: '6px 32px 10px',
            borderRadius: '4px',
            fontFamily: "'Noto Nastaliq Urdu', serif",
            fontSize: '30px', fontWeight: 700, color: '#1a1208', lineHeight: 1.4,
            boxShadow: '3px 3px 0 rgba(0,0,0,0.12)', marginBottom: '4px',
          }}>راہ</div>
          <div style={{
            fontFamily: "'Playfair Display', serif", fontWeight: 700,
            fontSize: 'clamp(42px, 7vw, 68px)', color: '#1a1208',
            lineHeight: 1.05, letterSpacing: '-0.5px', display: 'block',
          }}>
            Career Compass
          </div>
          <div style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: '14px',
            color: '#5a4a38', letterSpacing: '0.08em',
            textTransform: 'lowercase', marginTop: '12px',
          }}>
            <em>find your path</em> — Pakistan's AI career guide for youth
          </div>
          <button
            onClick={start}
            disabled={loading}
            style={{
              display: 'inline-block', marginTop: '24px',
              padding: '14px 36px', background: '#1a1208', color: '#faf5ee',
              fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 500,
              letterSpacing: '0.06em', borderRadius: '100px', border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'background 0.2s, transform 0.15s',
            }}
            onMouseEnter={e => { if (!loading) e.target.style.background = '#3d2e1a' }}
            onMouseLeave={e => { e.target.style.background = '#1a1208' }}
          >
            {loading ? 'Starting...' : 'start your journey →'}
          </button>
        </div>

        {/* Bottom badge */}
        <div style={{
          position: 'absolute', bottom: '20px', right: '22px',
          background: 'rgba(255,255,255,0.80)', border: '1px solid rgba(196,140,120,0.3)',
          borderRadius: '100px', padding: '5px 14px', fontSize: '10px',
          color: '#7a5c3a', letterSpacing: '0.05em', zIndex: 20,
        }}>
          Raah v2.0 · Hackathon 2026
        </div>
      </div>

      {/* ── Features ── */}
      <section style={{ padding: '72px 24px 0', maxWidth: '900px', margin: '0 auto' }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px, 4vw, 38px)',
          textAlign: 'center', marginBottom: '12px', color: '#1a1208',
        }}>What Raah Does For You</h2>
        <p style={{ textAlign: 'center', color: '#5a4a38', marginBottom: '36px', fontSize: '15px', lineHeight: 1.7 }}>
          AI-powered career guidance designed specifically for Pakistani youth.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {features.map(f => (
            <div key={f.title} style={{
              background: 'white', border: '1.5px solid rgba(196,140,120,0.22)',
              borderRadius: '16px', padding: '26px 18px', textAlign: 'center',
              boxShadow: '0 4px 20px rgba(90,60,30,0.08)',
            }}>
              <div style={{ fontSize: '34px', marginBottom: '14px' }}>{f.icon}</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '16px', marginBottom: '8px', color: '#1a1208' }}>{f.title}</div>
              <div style={{ fontSize: '13px', color: '#5a4a38', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ padding: '64px 24px 80px', maxWidth: '700px', margin: '0 auto' }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px, 4vw, 38px)',
          textAlign: 'center', marginBottom: '32px', color: '#1a1208',
        }}>How It Works</h2>
        <div style={{ display: 'grid', gap: '16px' }}>
          {steps.map(s => (
            <div key={s.num} style={{
              background: 'white', border: '1.5px solid rgba(196,140,120,0.22)',
              borderRadius: '16px', padding: '22px 24px',
              display: 'flex', gap: '22px', alignItems: 'center',
              boxShadow: '0 4px 20px rgba(90,60,30,0.08)',
            }}>
              <div style={{
                fontFamily: "'Playfair Display', serif", fontSize: '28px',
                fontWeight: 900, color: '#e8b84b', minWidth: '52px',
              }}>{s.num}</div>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '16px', marginBottom: '6px', color: '#1a1208' }}>{s.title}</div>
                <div style={{ fontSize: '14px', color: '#5a4a38' }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '44px' }}>
          <button
            onClick={start}
            disabled={loading}
            style={{
              padding: '16px 44px', background: '#e8b84b', color: '#1a1208',
              fontFamily: "'DM Sans', sans-serif", fontSize: '16px', fontWeight: 600,
              letterSpacing: '0.05em', borderRadius: '100px', border: 'none', cursor: 'pointer',
              boxShadow: '0 2px 12px rgba(232,184,75,0.35)', transition: 'background 0.2s',
            }}
          >
            {loading ? 'Starting...' : "Start Now — It's Free →"}
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ textAlign: 'center', padding: '0 20px 48px', color: '#9a7d5a', fontSize: '13px' }}>
        <div style={{ marginBottom: '8px' }}>
          <span style={{ fontFamily: "'Noto Nastaliq Urdu', serif", fontSize: '16px' }}>راہ</span> · Built with ❤️ for Pakistani Youth
        </div>
      </footer>

      <style>{`
        @keyframes floatIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}