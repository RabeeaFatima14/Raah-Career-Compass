import { useState, useEffect } from 'react'
import { getOpportunities, getTrends } from '../api/client'
import OpportunityCard from '../components/OpportunityCard'
import ProgressBar from '../components/ProgressBar'
import GoogleBadge from '../components/GoogleBadge'

const PATH_COLORS = { safe: 'var(--safe)', growth: 'var(--growth)', ambitious: 'var(--ambitious)' }
const PATH_ICONS = { safe: '🛡️', growth: '📈', ambitious: '🚀' }
const PATH_LABELS = { safe: 'Safe Path', growth: 'Growth Path', ambitious: 'Ambitious Path' }

export default function Roadmap() {
  const [roadmap, setRoadmap] = useState(null)
  const [opportunities, setOpportunities] = useState([])
  const [trends, setTrends] = useState([])
  const [active, setActive] = useState(0)
  const [showTrends, setShowTrends] = useState(false)

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('roadmap') || 'null')
    setRoadmap(data)
    const city = localStorage.getItem('user_city') || 'islamabad'
    getOpportunities(city).then(res => setOpportunities(res.data)).catch(() => {})
    getTrends().then(res => setTrends(res.data?.trends || [])).catch(() => {})
  }, [])

  const handlePrint = () => {
    window.print()
  }

  const handleShare = async () => {
    const text = `Check out my personalized career roadmap from Raah (راہ) — Pakistan's AI career companion! My top career match: ${roadmap?.paths?.[0]?.title || 'Career Path'}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'My Raah Career Roadmap', text, url: window.location.href })
      } catch {}
    } else {
      navigator.clipboard?.writeText(text).then(() => {
        alert('Copied to clipboard! Share it with your friends.')
      })
    }
  }

  const startOver = () => {
    if (window.confirm('Start a completely new assessment? All your current data will be cleared.')) {
      localStorage.clear()
      window.location.href = '/'
    }
  }

  if (!roadmap) return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', gap: '16px'
    }}>
      <div style={{ fontSize: '48px' }}>🧭</div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>No roadmap found. Please start over.</p>
      <button className="btn" onClick={() => window.location.href = '/'}>Start Over</button>
    </div>
  )

  const paths = roadmap.paths || []
  const path = paths[active]
  const color = path ? PATH_COLORS[path.id] || 'var(--accent)' : 'var(--accent)'
  const personality = JSON.parse(localStorage.getItem('personality') || 'null')

  return (
    <div style={{
      maxWidth: '860px', margin: '0 auto', padding: '20px 20px 80px',
      animation: 'fadeInUp 0.6s ease-out'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <ProgressBar step={3} total={4} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-ghost btn btn-sm" onClick={handlePrint} title="Download as PDF">
            🖨️ Print
          </button>
          <button className="btn-ghost btn btn-sm" onClick={handleShare} title="Share your roadmap">
            📤 Share
          </button>
          <button className="btn-ghost btn btn-sm" onClick={startOver}>
            ↺ New
          </button>
        </div>
      </div>

      {/* Header */}
      <div style={{ marginTop: '32px', marginBottom: '32px' }}>
        <div style={{
          fontSize: '13px', color: 'var(--accent)', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px'
        }}>
          Your Personalized Career Roadmap
        </div>
        <h1 style={{
          fontSize: 'clamp(28px, 5vw, 44px)', marginBottom: '16px', lineHeight: 1.15
        }}>
          {roadmap.user_name}'s <span className="gradient-text">Future Paths</span>
        </h1>

        {/* Personality + Income Context */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {personality && (
            <div style={{
              padding: '8px 16px', background: 'rgba(108,99,255,0.08)',
              border: '1px solid rgba(108,99,255,0.2)', borderRadius: '100px',
              fontSize: '13px', color: 'var(--accent)', fontWeight: 600
            }}>
              🧠 {personality.type} {personality.enneagram ? `· ${personality.enneagram}` : ''}
            </div>
          )}
          {roadmap.personality_summary && !personality && (
            <div style={{
              padding: '8px 16px', background: 'rgba(108,99,255,0.08)',
              border: '1px solid rgba(108,99,255,0.2)', borderRadius: '100px',
              fontSize: '13px', color: 'var(--accent)', fontWeight: 600
            }}>
              🧠 {roadmap.personality_summary}
            </div>
          )}
        </div>

        <div style={{
          background: 'rgba(244,200,66,0.06)', border: '1px solid rgba(244,200,66,0.2)',
          borderRadius: '12px', padding: '14px 18px',
          fontSize: '14px', color: 'var(--gold)', lineHeight: 1.6,
          display: 'flex', gap: '10px'
        }}>
          <span style={{ flexShrink: 0 }}>📊</span>
          <span>{roadmap.income_reality_check}</span>
        </div>
      </div>

      {/* Path Selector Tabs */}
      <div style={{
        display: 'flex', gap: '10px', marginBottom: '32px', flexWrap: 'wrap'
      }}>
        {paths.map((p, i) => {
          const isActive = active === i
          const pathColor = PATH_COLORS[p.id] || 'var(--accent)'
          return (
            <button key={i} onClick={() => setActive(i)}
              id={`path-tab-${p.id}`}
              style={{
                padding: '12px 24px', borderRadius: '12px', cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '14px',
                background: isActive ? pathColor : 'var(--surface)',
                color: isActive ? '#000' : 'var(--text-muted)',
                border: isActive ? 'none' : '1px solid var(--border)',
                transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                transform: isActive ? 'scale(1.02)' : 'scale(1)',
                boxShadow: isActive ? `0 4px 20px ${pathColor}40` : 'none',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
              {PATH_ICONS[p.id]} {PATH_LABELS[p.id] || p.id}
            </button>
          )
        })}
      </div>

      {path && (
        <div key={active} style={{ animation: 'fadeInUp 0.4s ease-out' }}>
          {/* Path Hero Card */}
          <div className="card" style={{
            borderColor: color, marginBottom: '20px',
            borderWidth: '1px', borderStyle: 'solid',
            background: `linear-gradient(135deg, var(--surface) 0%, rgba(0,0,0,0) 100%)`
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px'
                }}>
                  {PATH_ICONS[path.id]} {PATH_LABELS[path.id]}
                </div>
                <h2 style={{ fontSize: '30px', marginBottom: '8px', color }}>{path.title}</h2>
                <p style={{ color: 'var(--text-soft)', fontStyle: 'italic', fontSize: '15px' }}>
                  {path.tagline}
                </p>
              </div>
              <div style={{
                textAlign: 'right', padding: '16px 20px',
                background: 'var(--surface2)', borderRadius: '12px',
                minWidth: '160px'
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Expected Income
                </div>
                <div style={{ color, fontWeight: 700, fontSize: '18px' }}>
                  {path.realistic_monthly_income?.entry_level}
                </div>
                <div style={{
                  fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px',
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px'
                }}>
                  <span>→</span> {path.realistic_monthly_income?.after_5_years}
                  <span style={{ fontSize: '10px' }}>after 5 yrs</span>
                </div>
              </div>
            </div>

            <div style={{
              marginTop: '16px', padding: '14px 18px',
              background: 'var(--surface2)', borderRadius: '10px',
              fontSize: '14px', color: 'var(--text-soft)', lineHeight: 1.6,
              display: 'flex', gap: '10px'
            }}>
              <span style={{ flexShrink: 0 }}>💡</span>
              <span>{path.personality_fit}</span>
            </div>
          </div>

          {/* Education Route */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '20px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              🎓 Education Route
            </h3>
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{
                color, fontWeight: 700, fontSize: '17px',
                padding: '6px 14px', background: `${color}10`, borderRadius: '8px'
              }}>
                {path.education_route?.degree}
              </span>
              <span style={{
                color: 'var(--text-muted)', fontSize: '13px',
                padding: '6px 12px', background: 'var(--surface2)', borderRadius: '8px'
              }}>
                ⏱ {path.education_route?.duration}
              </span>
            </div>

            {/* Universities */}
            {path.education_route?.best_universities?.map((uni, i) => (
              <div key={i} style={{
                padding: '14px 16px', background: 'var(--surface2)', borderRadius: '10px',
                marginBottom: '8px', fontSize: '14px',
                borderLeft: `3px solid ${color}`
              }}>
                <div style={{ fontWeight: 700, marginBottom: '6px', fontSize: '15px' }}>
                  🏛️ {uni.name} — {uni.city}
                </div>
                <div style={{
                  color: 'var(--text-muted)', display: 'flex', gap: '16px', flexWrap: 'wrap',
                  fontSize: '13px'
                }}>
                  <span>📝 {uni.admission_test}</span>
                  <span>💰 {uni.fee_per_semester}/semester</span>
                </div>
              </div>
            ))}

            {/* Scholarships */}
            {path.education_route?.scholarships?.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <div style={{
                  fontSize: '12px', color: 'var(--safe)', fontWeight: 600, marginBottom: '10px',
                  textTransform: 'uppercase', letterSpacing: '1px'
                }}>
                  💰 Available Scholarships
                </div>
                {path.education_route.scholarships.map((s, i) => (
                  <div key={i} style={{
                    padding: '14px 16px', background: 'rgba(74,222,128,0.04)',
                    border: '1px solid rgba(74,222,128,0.15)',
                    borderRadius: '10px', marginBottom: '8px', fontSize: '14px'
                  }}>
                    <div style={{ fontWeight: 700, color: 'var(--safe)', marginBottom: '4px' }}>
                      {s.name} — {s.amount}
                    </div>
                    <div style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>{s.eligibility}</div>
                    <div style={{ color: 'var(--accent)', marginTop: '6px', fontSize: '13px' }}>
                      📎 Apply: {s.apply_at}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Free Resources */}
          {path.free_resources?.length > 0 && (
            <div className="card" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                📚 Free Resources to Start Now
              </h3>
              {path.free_resources.map((r, i) => (
                <div key={i} style={{
                  padding: '14px 16px', background: 'var(--surface2)', borderRadius: '10px',
                  marginBottom: '8px', fontSize: '14px',
                  borderLeft: '3px solid var(--accent)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: '4px' }}>{r.title}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{r.why}</div>
                    </div>
                    <span style={{
                      padding: '4px 10px', background: 'rgba(108,99,255,0.1)',
                      borderRadius: '6px', fontSize: '11px', color: 'var(--accent)',
                      fontWeight: 600, whiteSpace: 'nowrap'
                    }}>{r.type}</span>
                  </div>
                  {r.url && (
                    <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--accent)', wordBreak: 'break-all' }}>
                      🔗 {r.url}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Roadmap Timeline */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              🗓️ Your Step-by-Step Roadmap
            </h3>
            {[
              ['This Month (Free!)', path.roadmap?.this_month, '🟢', 'rgba(74,222,128,0.08)'],
              ['Next 6 Months', path.roadmap?.next_6_months, '🔵', 'rgba(96,165,250,0.08)'],
              ['Years 1–2', path.roadmap?.year_1_2, '🟣', 'rgba(168,85,247,0.08)'],
              ['Years 3–5', path.roadmap?.year_3_5, '⚡', 'rgba(244,200,66,0.08)'],
            ].map(([label, items, emoji, bg]) => items?.length > 0 && (
              <div key={label} style={{ marginBottom: '28px' }}>
                <div style={{
                  fontWeight: 700, marginBottom: '12px', display: 'flex',
                  alignItems: 'center', gap: '10px', fontSize: '15px'
                }}>
                  {emoji} {label}
                </div>
                {items.map((item, i) => (
                  <div key={i} style={{
                    padding: '12px 16px',
                    background: bg,
                    borderRadius: '10px',
                    marginBottom: '6px',
                    fontSize: '14px',
                    lineHeight: 1.6,
                    borderLeft: `3px solid ${color}`,
                    display: 'flex', alignItems: 'flex-start', gap: '10px'
                  }}>
                    <span style={{ color, flexShrink: 0, fontSize: '12px', marginTop: '3px' }}>▸</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            ))}

            {/* First Job */}
            <div style={{
              padding: '18px', background: `linear-gradient(135deg, ${color}08, ${color}15)`,
              borderRadius: '12px', borderLeft: `4px solid ${color}`
            }}>
              <div style={{
                fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px',
                textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600
              }}>🎯 First Job Target</div>
              <div style={{ fontSize: '16px', lineHeight: 1.6 }}>{path.roadmap?.first_job}</div>
            </div>
          </div>

          {/* Warning + Competition */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div className="card" style={{ borderColor: 'rgba(244,200,66,0.2)' }}>
              <div style={{ fontSize: '12px', color: 'var(--gold)', fontWeight: 600, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ⚠️ Critical Warning
              </div>
              <div style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-soft)' }}>
                {path.dont_mess_up}
              </div>
            </div>
            <div className="card">
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📊 Competition Reality
              </div>
              <div style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-soft)' }}>
                {path.competition_reality}
              </div>
            </div>
          </div>

          {/* Volunteering from Roadmap */}
          {path.volunteering_now?.length > 0 && (
            <div className="card" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>🤝 Start Volunteering Now</h3>
              {path.volunteering_now.map((v, i) => (
                <div key={i} style={{
                  padding: '14px 16px', background: 'var(--surface2)', borderRadius: '10px',
                  marginBottom: '8px', fontSize: '14px'
                }}>
                  <div style={{ fontWeight: 700, marginBottom: '4px' }}>{v.org}</div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>{v.type} · {v.city}</div>
                  <div style={{ color: 'var(--accent)', fontSize: '13px' }}>📎 {v.how_to_join}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Immediate Action */}
      <div style={{
        padding: '28px', marginBottom: '28px',
        background: 'linear-gradient(135deg, rgba(108,99,255,0.1), rgba(255,101,132,0.1))',
        border: '1px solid rgba(108,99,255,0.25)', borderRadius: '16px',
        animation: 'glow 4s ease-in-out infinite'
      }}>
        <div style={{
          fontSize: '12px', color: 'var(--accent)', fontWeight: 700, marginBottom: '10px',
          textTransform: 'uppercase', letterSpacing: '1.5px'
        }}>
          🎯 Your #1 Action for Tomorrow
        </div>
        <div style={{ fontSize: '18px', lineHeight: 1.7, fontWeight: 500 }}>
          {roadmap.immediate_action}
        </div>
      </div>

      {/* Local Opportunities */}
      {opportunities.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>
            🤝 Opportunities Near You
          </h2>
          {opportunities.map((opp, i) => <OpportunityCard key={i} opp={opp} />)}
        </div>
      )}

      {/* Trends */}
      {trends.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <button onClick={() => setShowTrends(!showTrends)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text)', fontFamily: 'Playfair Display, serif',
              fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px',
              marginBottom: '16px', padding: 0
            }}>
            📰 Pakistan Career Trends
            <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontFamily: 'DM Sans, sans-serif' }}>
              {showTrends ? '▾' : '▸'}
            </span>
          </button>
          {showTrends && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', animation: 'fadeInUp 0.4s ease-out' }}>
              {trends.map((t, i) => (
                <div key={i} className="card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: '6px' }}>{t.trend}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{t.description}</div>
                    </div>
                    <span style={{
                      padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                      background: t.opportunity_level === 'high' ? 'rgba(74,222,128,0.1)' : 'rgba(244,200,66,0.1)',
                      color: t.opportunity_level === 'high' ? 'var(--safe)' : 'var(--gold)',
                      whiteSpace: 'nowrap'
                    }}>
                      {t.opportunity_level?.toUpperCase()}
                    </span>
                  </div>
                  {t.relevant_fields?.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                      {t.relevant_fields.map((f, j) => (
                        <span key={j} style={{
                          padding: '3px 10px', background: 'var(--surface2)',
                          borderRadius: '6px', fontSize: '11px', color: 'var(--text-soft)'
                        }}>{f}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Motivational Note */}
      <div className="card" style={{
        textAlign: 'center', padding: '36px 28px',
        background: 'linear-gradient(135deg, var(--surface), var(--surface2))',
        borderColor: 'var(--border-glow)'
      }}>
        <div style={{ fontSize: '36px', marginBottom: '16px' }}>💬</div>
        <p style={{
          fontSize: '18px', lineHeight: 1.8, color: 'var(--text-soft)',
          fontStyle: 'italic', maxWidth: '500px', margin: '0 auto 20px'
        }}>
          "{roadmap.motivational_note}"
        </p>
        <GoogleBadge />
      </div>

      {/* Final CTA */}
      <div style={{
        textAlign: 'center', marginTop: '40px', padding: '24px',
        fontSize: '14px', color: 'var(--text-muted)'
      }}>
        <button className="btn" onClick={handlePrint} style={{ marginRight: '12px' }}>
          🖨️ Save as PDF
        </button>
        <button className="btn-ghost btn" onClick={startOver}>
          ↺ Start New Assessment
        </button>
      </div>
    </div>
  )
}