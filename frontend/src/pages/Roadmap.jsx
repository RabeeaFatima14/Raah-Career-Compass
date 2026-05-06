import { useState, useEffect } from 'react'
import { getOpportunities, getTrends } from '../api/client'
import OpportunityCard from '../components/OpportunityCard'
import ProgressBar from '../components/ProgressBar'
import GoogleBadge from '../components/GoogleBadge'

const PATH_META = {
  safe:      { icon: '🛡️', label: 'Safe Path',      tab: { background: '#e8f5ef', borderColor: 'rgba(100,155,140,0.4)', color: '#1f5c46' }, accent: '#2f7a5a' },
  growth:    { icon: '📈', label: 'Growth Path',    tab: { background: '#ede8f5', borderColor: 'rgba(150,120,200,0.4)', color: '#4a3870' }, accent: '#4a70b0' },
  ambitious: { icon: '🚀', label: 'Ambitious Path', tab: { background: '#f2ddd5', borderColor: 'rgba(196,140,120,0.4)', color: '#7a3a28' }, accent: '#b05060' },
}

const card = (extra = {}) => ({
  background: 'white',
  border: '1.5px solid rgba(196,140,120,0.22)',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 4px 20px rgba(90,60,30,0.08)',
  marginBottom: '18px',
  ...extra,
})

const sectionLabel = (color = '#9a7d5a') => ({
  fontSize: '11px', fontWeight: 700, color,
  textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '12px',
})

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

  const handlePrint = () => window.print()

  const handleShare = async () => {
    const text = `Check out my personalized career roadmap from Raah (راہ) — Pakistan's AI career companion! My top career match: ${roadmap?.paths?.[0]?.title || 'Career Path'}`
    if (navigator.share) {
      try { await navigator.share({ title: 'My Raah Career Roadmap', text, url: window.location.href }) } catch {}
    } else {
      navigator.clipboard?.writeText(text).then(() => alert('Copied to clipboard!'))
    }
  }

  const startOver = () => {
    if (window.confirm('Start a new assessment? All current data will be cleared.')) {
      localStorage.clear(); window.location.href = '/'
    }
  }

  // ── No roadmap ──
  if (!roadmap) return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', gap: '16px', padding: '40px 20px',
    }}>
      <div style={{ fontSize: '48px' }}>🧭</div>
      <p style={{ color: '#5a4a38', marginBottom: '16px' }}>No roadmap found. Please start over.</p>
      <button
        onClick={() => window.location.href = '/'}
        style={{
          padding: '12px 32px', background: '#1a1208', color: '#faf5ee',
          border: 'none', borderRadius: '100px', cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 600,
        }}
      >Start Over</button>
    </div>
  )

  const paths = roadmap.paths || []
  const path = paths[active]
  const meta = PATH_META[path?.id] || PATH_META.safe
  const accent = meta.accent
  const personality = JSON.parse(localStorage.getItem('personality') || 'null')

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '24px 20px 80px' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
        <ProgressBar step={3} total={4} />
        <div style={{ display: 'flex', gap: '8px' }}>
          {[['🖨️ Print', handlePrint], ['📤 Share', handleShare], ['↺ New', startOver]].map(([label, fn]) => (
            <button key={label} onClick={fn} style={{
              padding: '9px 16px', background: 'white',
              border: '1.5px solid rgba(196,140,120,0.3)', borderRadius: '100px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 500,
              color: '#1a1208', cursor: 'pointer',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Header */}
      <div style={{ marginTop: '28px', marginBottom: '28px' }}>
        <div style={{
          fontSize: '11px', color: '#c48c78', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px',
        }}>Your Personalized Career Roadmap</div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(26px, 5vw, 42px)', color: '#1a1208',
          marginBottom: '16px', lineHeight: 1.15,
        }}>
          {roadmap.user_name}'s <em>Future Paths</em>
        </h1>

        {/* Personality pill */}
        {personality && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '8px 18px', background: '#fdf0cc', border: '1px solid #e8d48a',
            borderRadius: '100px', fontSize: '13px', color: '#7a5c1a',
            fontWeight: 600, marginBottom: '14px',
          }}>
            🧠 {personality.type}{personality.enneagram ? ` · ${personality.enneagram}` : ''}
          </div>
        )}

        {/* Income reality */}
        {roadmap.income_reality_check && (
          <div style={{
            background: '#fdf0cc', border: '1px solid #e8d48a',
            borderRadius: '12px', padding: '14px 18px',
            fontSize: '14px', color: '#7a5c1a', lineHeight: 1.6,
            display: 'flex', gap: '10px',
          }}>
            <span style={{ flexShrink: 0 }}>📊</span>
            <span>{roadmap.income_reality_check}</span>
          </div>
        )}
      </div>

      {/* Path tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '28px', flexWrap: 'wrap' }}>
        {paths.map((p, i) => {
          const m = PATH_META[p.id] || PATH_META.safe
          const isActive = active === i
          return (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                padding: '11px 22px', borderRadius: '100px', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '14px',
                border: '1.5px solid',
                ...(isActive ? m.tab : { background: 'white', borderColor: 'rgba(196,140,120,0.25)', color: '#5a4a38' }),
                transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', gap: '7px',
              }}
            >{m.icon} {m.label}</button>
          )
        })}
      </div>

      {path && (
        <div key={active}>

          {/* ── Path hero ── */}
          <div style={{ ...card({ borderLeft: `4px solid ${accent}`, marginBottom: '18px' }) }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#9a7d5a', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px' }}>
                  {meta.icon} {meta.label}
                </div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', marginBottom: '6px', color: accent }}>
                  {path.title}
                </h2>
                <p style={{ color: '#5a4a38', fontStyle: 'italic', fontSize: '15px' }}>{path.tagline}</p>
              </div>
              <div style={{
                textAlign: 'right', padding: '16px 20px',
                background: '#f5f0e8', borderRadius: '12px', minWidth: '160px',
              }}>
                <div style={{ fontSize: '11px', color: '#9a7d5a', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Expected Income</div>
                <div style={{ color: accent, fontWeight: 700, fontSize: '18px' }}>{path.realistic_monthly_income?.entry_level}</div>
                <div style={{ fontSize: '12px', color: '#9a7d5a', marginTop: '4px' }}>
                  → {path.realistic_monthly_income?.after_5_years} after 5 yrs
                </div>
              </div>
            </div>
            {path.personality_fit && (
              <div style={{
                marginTop: '16px', padding: '14px 18px',
                background: '#f5f0e8', borderRadius: '10px',
                fontSize: '14px', color: '#3d2e1a', lineHeight: 1.6, display: 'flex', gap: '10px',
              }}>
                <span style={{ flexShrink: 0 }}>💡</span><span>{path.personality_fit}</span>
              </div>
            )}
          </div>

          {/* ── Education Route ── */}
          <div style={card()}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', marginBottom: '16px', color: '#1a1208' }}>🎓 Education Route</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <span style={{ color: accent, fontWeight: 700, fontSize: '16px', padding: '6px 14px', background: `${accent}12`, borderRadius: '8px' }}>
                {path.education_route?.degree}
              </span>
              <span style={{ color: '#9a7d5a', fontSize: '13px', padding: '6px 12px', background: '#f5f0e8', borderRadius: '8px' }}>
                ⏱ {path.education_route?.duration}
              </span>
            </div>

            {path.education_route?.best_universities?.map((uni, i) => (
              <div key={i} style={{
                padding: '14px 16px', background: '#f5f0e8', borderRadius: '10px',
                marginBottom: '8px', borderLeft: `3px solid ${accent}`,
              }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '15px', marginBottom: '6px', color: '#1a1208' }}>
                  🏛️ {uni.name} — {uni.city}
                </div>
                <div style={{ color: '#5a4a38', fontSize: '13px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <span>📝 {uni.admission_test}</span>
                  <span>💰 {uni.fee_per_semester}/semester</span>
                </div>
              </div>
            ))}

            {path.education_route?.scholarships?.length > 0 && (
              <div style={{ marginTop: '18px' }}>
                <div style={sectionLabel('#2f7a5a')}>💰 Available Scholarships</div>
                {path.education_route.scholarships.map((s, i) => (
                  <div key={i} style={{
                    padding: '14px 16px', background: '#dff0e8',
                    border: '1px solid rgba(100,155,140,0.3)',
                    borderRadius: '10px', marginBottom: '8px', fontSize: '14px',
                  }}>
                    <div style={{ fontWeight: 700, color: '#1f5c46', marginBottom: '4px' }}>{s.name} — {s.amount}</div>
                    <div style={{ color: '#5a4a38', lineHeight: 1.5 }}>{s.eligibility}</div>
                    <div style={{ color: '#6c9b8c', marginTop: '6px', fontSize: '13px' }}>📎 Apply: {s.apply_at}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Free Resources ── */}
          {path.free_resources?.length > 0 && (
            <div style={card()}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', marginBottom: '16px', color: '#1a1208' }}>📚 Free Resources to Start Now</h3>
              {path.free_resources.map((r, i) => (
                <div key={i} style={{
                  padding: '14px 16px', background: '#f5f0e8', borderRadius: '10px',
                  marginBottom: '8px', borderLeft: '3px solid #c48c78',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: '4px', color: '#1a1208' }}>{r.title}</div>
                      <div style={{ color: '#5a4a38', fontSize: '13px' }}>{r.why}</div>
                    </div>
                    <span style={{
                      padding: '4px 10px', background: '#fdf0cc',
                      borderRadius: '100px', fontSize: '11px', color: '#7a5c1a', fontWeight: 600,
                    }}>{r.type}</span>
                  </div>
                  {r.url && <div style={{ marginTop: '8px', fontSize: '13px', color: '#c48c78' }}>🔗 {r.url}</div>}
                </div>
              ))}
            </div>
          )}

          {/* ── Roadmap Timeline ── */}
          <div style={card()}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', marginBottom: '22px', color: '#1a1208' }}>🗓️ Your Step-by-Step Roadmap</h3>
            {[
              ['This Month (Free!)', path.roadmap?.this_month,     '#dff0e8', '#2f7a5a'],
              ['Next 6 Months',      path.roadmap?.next_6_months,  '#ede8f5', '#4a70b0'],
              ['Years 1–2',          path.roadmap?.year_1_2,       '#f5eeff', '#6a4ab0'],
              ['Years 3–5',          path.roadmap?.year_3_5,       '#fdf0cc', '#7a5c1a'],
            ].map(([label, items, bg, color]) => items?.length > 0 && (
              <div key={label} style={{ marginBottom: '24px' }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '15px', marginBottom: '10px', color }}>
                  {label}
                </div>
                {items.map((item, i) => (
                  <div key={i} style={{
                    padding: '11px 16px', background: bg,
                    borderRadius: '10px', marginBottom: '6px', fontSize: '14px',
                    lineHeight: 1.6, borderLeft: `3px solid ${color}`,
                    display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#1a1208',
                  }}>
                    <span style={{ color, flexShrink: 0, marginTop: '3px' }}>▸</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            ))}

            {path.roadmap?.first_job && (
              <div style={{
                padding: '18px', background: `${accent}10`,
                borderRadius: '12px', borderLeft: `4px solid ${accent}`,
              }}>
                <div style={{ fontSize: '11px', color: '#9a7d5a', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
                  🎯 First Job Target
                </div>
                <div style={{ fontSize: '16px', lineHeight: 1.6, color: '#1a1208' }}>{path.roadmap.first_job}</div>
              </div>
            )}
          </div>

          {/* ── Warning + Competition ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
            <div style={{ ...card({ marginBottom: 0, borderLeft: '3px solid #e8b84b' }) }}>
              <div style={sectionLabel('#c49a2a')}>⚠️ Critical Warning</div>
              <div style={{ fontSize: '14px', lineHeight: 1.6, color: '#3d2e1a' }}>{path.dont_mess_up}</div>
            </div>
            <div style={{ ...card({ marginBottom: 0 }) }}>
              <div style={sectionLabel()}>📊 Competition Reality</div>
              <div style={{ fontSize: '14px', lineHeight: 1.6, color: '#3d2e1a' }}>{path.competition_reality}</div>
            </div>
          </div>

          {/* ── Volunteering ── */}
          {path.volunteering_now?.length > 0 && (
            <div style={card()}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', marginBottom: '16px', color: '#1a1208' }}>🤝 Start Volunteering Now</h3>
              {path.volunteering_now.map((v, i) => (
                <div key={i} style={{
                  padding: '14px 16px', background: '#f5f0e8',
                  borderRadius: '10px', marginBottom: '8px',
                }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, marginBottom: '4px', color: '#1a1208' }}>{v.org}</div>
                  <div style={{ color: '#5a4a38', marginBottom: '4px', fontSize: '13px' }}>{v.type} · {v.city}</div>
                  <div style={{ color: '#6c9b8c', fontSize: '13px' }}>📎 {v.how_to_join}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── Government & Economic Outlook ── */}
          {path.pakistan_gov_trend && (
            <div style={{ ...card({ borderLeft: '3px solid #e8b84b' }) }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', marginBottom: '16px', color: '#1a1208' }}>
                🏛️ Pakistan Government & Economic Outlook
              </h3>

              {/* Hiring trend badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {(() => {
                  const t = path.pakistan_gov_trend.hiring_trend
                  const cfg = t === 'growing'
                    ? { bg: '#dff0e8', color: '#1f5c46', border: 'rgba(100,155,140,0.3)', icon: '📈' }
                    : t === 'stable'
                    ? { bg: '#ede8f5', color: '#4a3870', border: 'rgba(150,120,200,0.3)', icon: '📊' }
                    : { bg: '#f2ddd5', color: '#7a3a28', border: 'rgba(196,140,120,0.3)', icon: '📉' }
                  return (
                    <span style={{
                      padding: '6px 16px', borderRadius: '100px', fontWeight: 700, fontSize: '12px',
                      background: cfg.bg, color: cfg.color,
                      border: `1px solid ${cfg.border}`,
                      textTransform: 'uppercase', letterSpacing: '1px',
                    }}>{cfg.icon} Sector {t}</span>
                  )
                })()}
                {path.pakistan_gov_trend.key_ministry_body && (
                  <span style={{
                    padding: '6px 14px', borderRadius: '100px', fontSize: '12px',
                    background: '#fdf0cc', color: '#7a5c1a', border: '1px solid #e8d48a',
                  }}>🏢 {path.pakistan_gov_trend.key_ministry_body}</span>
                )}
              </div>

              {path.pakistan_gov_trend.government_focus && (
                <div style={{
                  padding: '14px 16px', background: '#fdf0cc', border: '1px solid #e8d48a',
                  borderRadius: '10px', marginBottom: '10px', fontSize: '14px', lineHeight: 1.65,
                }}>
                  <div style={{ fontWeight: 700, color: '#7a5c1a', marginBottom: '6px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>🇵🇰 Government Focus</div>
                  <div style={{ color: '#3d2e1a' }}>{path.pakistan_gov_trend.government_focus}</div>
                </div>
              )}

              {path.pakistan_gov_trend.cpec_relevance && (
                <div style={{
                  padding: '14px 16px', background: '#dff0e8', border: '1px solid rgba(100,155,140,0.3)',
                  borderRadius: '10px', marginBottom: '10px', fontSize: '14px', lineHeight: 1.65,
                }}>
                  <div style={{ fontWeight: 700, color: '#1f5c46', marginBottom: '6px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>🛣️ CPEC Relevance</div>
                  <div style={{ color: '#3d2e1a' }}>{path.pakistan_gov_trend.cpec_relevance}</div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {path.pakistan_gov_trend.economic_outlook && (
                  <div style={{ padding: '14px 16px', background: '#f5f0e8', borderRadius: '10px', fontSize: '13px', lineHeight: 1.6 }}>
                    <div style={{ fontWeight: 700, color: '#9a7d5a', marginBottom: '6px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>📉 Economic Reality</div>
                    <div style={{ color: '#3d2e1a' }}>{path.pakistan_gov_trend.economic_outlook}</div>
                  </div>
                )}
                {path.pakistan_gov_trend.salary_impact && (
                  <div style={{ padding: '14px 16px', background: '#f5f0e8', borderRadius: '10px', fontSize: '13px', lineHeight: 1.6 }}>
                    <div style={{ fontWeight: 700, color: '#9a7d5a', marginBottom: '6px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>💰 Pay Reality</div>
                    <div style={{ color: '#3d2e1a' }}>{path.pakistan_gov_trend.salary_impact}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── YouTube Channels ── */}
          {path.youtube_channels?.length > 0 && (
            <div style={card()}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', marginBottom: '6px', color: '#1a1208' }}>
                📺 Top YouTube Channels for Your Program
              </h3>
              <p style={{ fontSize: '13px', color: '#9a7d5a', marginBottom: '18px' }}>
                Popular among Pakistani university students in this field
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {path.youtube_channels.map((ch, i) => (
                  <div key={i} style={{
                    padding: '18px', background: '#f5f0e8', borderRadius: '12px',
                    borderLeft: '3px solid #c48c78', position: 'relative',
                  }}>
                    {/* tape */}
                    <div style={{
                      position: 'absolute', top: '-7px', left: '16px',
                      width: '36px', height: '11px',
                      background: 'rgba(234,194,100,0.6)', borderRadius: '2px',
                    }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '15px', color: '#1a1208' }}>
                        ▶️ {ch.channel_name}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 600,
                          background: ch.language === 'Urdu' ? '#fdf0cc' : ch.language === 'Bilingual' ? '#dff0e8' : '#ede8f5',
                          color: ch.language === 'Urdu' ? '#7a5c1a' : ch.language === 'Bilingual' ? '#1f5c46' : '#4a3870',
                        }}>{ch.language}</span>
                        <span style={{ padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, background: 'white', color: '#5a4a38' }}>
                          {ch.level}
                        </span>
                      </div>
                    </div>
                    {ch.what_to_watch_first && (
                      <div style={{ fontSize: '13px', color: '#c48c78', marginBottom: '6px' }}>
                        🎯 Start with: <em>{ch.what_to_watch_first}</em>
                      </div>
                    )}
                    {ch.why_popular && (
                      <div style={{ fontSize: '13px', color: '#5a4a38', lineHeight: 1.5, marginBottom: '8px' }}>{ch.why_popular}</div>
                    )}
                    {ch.channel_url && (
                      <a href={ch.channel_url} target="_blank" rel="noreferrer" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        fontSize: '12px', color: '#6c9b8c', textDecoration: 'none', fontWeight: 600,
                      }}>🔗 Open Channel ↗</a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── First Step Exploration ── */}
          {path.first_step_exploration && (
            <div style={{
              ...card({ background: '#fdf5e0', border: '1.5px solid rgba(232,184,75,0.3)' }),
            }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', marginBottom: '6px', color: '#1a1208' }}>
                🚀 Your First Step — Start Exploring Today
              </h3>
              <p style={{ fontSize: '13px', color: '#9a7d5a', marginBottom: '20px' }}>
                Exactly what to do this week to discover if this path is right for you
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                {[
                  { key: 'open_right_now',       icon: '🌐', label: 'Open Right Now',     accent: '#c48c78' },
                  { key: 'watch_first',           icon: '▶️', label: 'Watch First',         accent: '#6c9b8c' },
                  { key: 'join_community',        icon: '👥', label: 'Join a Community',    accent: '#4a70b0' },
                  { key: 'offline_action',        icon: '📍', label: 'Offline Action',      accent: '#e8b84b' },
                  { key: 'free_skill_to_practice',icon: '🛠️', label: 'Practice for Free',  accent: '#2f7a5a' },
                  { key: 'how_to_verify_fit',     icon: '🔍', label: 'Verify It Fits You', accent: '#b05060' },
                ].map(({ key, icon, label, accent: a }) => path.first_step_exploration[key] && (
                  <div key={key} style={{
                    padding: '16px', background: 'white',
                    border: `1.5px solid ${a}30`, borderRadius: '12px',
                    borderLeft: `3px solid ${a}`,
                  }}>
                    <div style={{
                      fontSize: '11px', fontWeight: 700, color: a,
                      textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px',
                    }}>{icon} {label}</div>
                    <div style={{ fontSize: '13px', color: '#3d2e1a', lineHeight: 1.6 }}>
                      {path.first_step_exploration[key]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Immediate Action ── */}
      {roadmap.immediate_action && (
        <div style={{
          padding: '28px', marginBottom: '28px',
          background: '#fdf0cc', border: '1.5px solid #e8d48a',
          borderRadius: '16px',
        }}>
          <div style={{ fontSize: '11px', color: '#7a5c1a', fontWeight: 700, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            🎯 Your #1 Action for Tomorrow
          </div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', lineHeight: 1.7, color: '#1a1208' }}>
            {roadmap.immediate_action}
          </div>
        </div>
      )}

      {/* ── Local Opportunities ── */}
      {opportunities.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', marginBottom: '16px', color: '#1a1208' }}>
            🤝 Opportunities Near You
          </h2>
          {opportunities.map((opp, i) => <OpportunityCard key={i} opp={opp} />)}
        </div>
      )}

      {/* ── Trends ── */}
      {trends.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <button
            onClick={() => setShowTrends(!showTrends)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'Playfair Display', serif", fontSize: '22px',
              color: '#1a1208', display: 'flex', alignItems: 'center', gap: '10px',
              marginBottom: '16px', padding: 0,
            }}
          >
            📰 Pakistan Career Trends
            <span style={{ fontSize: '14px', color: '#9a7d5a', fontFamily: "'DM Sans', sans-serif" }}>
              {showTrends ? '▾' : '▸'}
            </span>
          </button>
          {showTrends && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {trends.map((t, i) => (
                <div key={i} style={{ ...card({ marginBottom: 0, padding: '16px' }) }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, marginBottom: '6px', color: '#1a1208' }}>{t.trend}</div>
                      <div style={{ fontSize: '13px', color: '#5a4a38', lineHeight: 1.5 }}>{t.description}</div>
                    </div>
                    <span style={{
                      padding: '4px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: 600,
                      background: t.opportunity_level === 'high' ? '#dff0e8' : '#fdf0cc',
                      color: t.opportunity_level === 'high' ? '#1f5c46' : '#7a5c1a',
                    }}>{t.opportunity_level?.toUpperCase()}</span>
                  </div>
                  {t.relevant_fields?.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                      {t.relevant_fields.map((f, j) => (
                        <span key={j} style={{
                          padding: '3px 10px', background: '#f5f0e8',
                          borderRadius: '100px', fontSize: '11px', color: '#5a4a38',
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

      {/* ── Motivational note ── */}
      {roadmap.motivational_note && (
        <div style={{ ...card({ textAlign: 'center', padding: '36px 28px' }) }}>
          <div style={{ fontSize: '36px', marginBottom: '16px' }}>💬</div>
          <p style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '18px', lineHeight: 1.8, color: '#3d2e1a',
            fontStyle: 'italic', maxWidth: '500px', margin: '0 auto 20px',
          }}>"{roadmap.motivational_note}"</p>
          <GoogleBadge />
        </div>
      )}

      {/* ── Final CTAs ── */}
      <div style={{ textAlign: 'center', marginTop: '40px', padding: '24px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={handlePrint} style={{
          padding: '12px 28px', background: '#1a1208', color: '#faf5ee',
          border: 'none', borderRadius: '100px', cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 600,
        }}>🖨️ Save as PDF</button>
        <button onClick={startOver} style={{
          padding: '12px 28px', background: 'transparent', color: '#1a1208',
          border: '1.5px solid rgba(196,140,120,0.3)', borderRadius: '100px', cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 500,
        }}>↺ Start New Assessment</button>
      </div>
    </div>
  )
}