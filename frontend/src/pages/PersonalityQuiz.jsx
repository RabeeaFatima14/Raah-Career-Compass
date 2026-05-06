import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ProgressBar from '../components/ProgressBar'

const MBTI_TYPES = ['INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP','ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP']

const TRAIT_MAP = {
  INTJ:'Strategic, independent, long-term planner — thrives in research and complex systems',
  INTP:'Analytical, curious, logic-driven — excellent at solving complex problems',
  ENTJ:'Natural leader, decisive, goal-oriented — suited for management and entrepreneurship',
  ENTP:'Innovative, debate-loving, entrepreneurial — sees possibilities others miss',
  INFJ:'Empathetic, visionary, purpose-driven — excellent in counseling and social impact',
  INFP:'Creative, idealistic, value-driven — suited for arts and helping professions',
  ENFJ:'Charismatic, people-focused, motivating — natural teacher or community leader',
  ENFP:'Enthusiastic, creative, sociable — great in communication and creative fields',
  ISTJ:'Reliable, detail-oriented, traditional — excellent in accounting and administration',
  ISFJ:'Caring, dependable, service-oriented — suited for healthcare and education',
  ESTJ:'Organized, practical, leadership-capable — great in management and law',
  ESFJ:'Warm, social, harmony-seeking — suited for HR and community roles',
  ISTP:'Practical, hands-on problem solver — great in engineering and technical trades',
  ISFP:'Artistic, gentle, present-focused — suited for design and healthcare',
  ESTP:'Action-oriented, realistic, good under pressure — great in business and entrepreneurship',
  ESFP:'Energetic, spontaneous, people-loving — great in creative and social fields',
}

const MBTI_TO_ENNEAGRAM = {
  INTJ:'5w6',INTP:'5w4',ENTJ:'8w7',ENTP:'7w8',INFJ:'4w5',INFP:'4w5',
  ENFJ:'2w3',ENFP:'7w6',ISTJ:'1w9',ISFJ:'6w5',ESTJ:'8w9',ESFJ:'2w1',
  ISTP:'5w6',ISFP:'9w1',ESTP:'7w8',ESFP:'7w6',
}

const ENNEAGRAM_NAMES = {
  '1':'The Reformer','2':'The Helper','3':'The Achiever','4':'The Individualist',
  '5':'The Investigator','6':'The Loyalist','7':'The Enthusiast','8':'The Challenger','9':'The Peacemaker',
}

const ENNEAGRAM_REGEX = /^[1-9]w[1-9]$/

function getEnneagramName(code) {
  if (!code) return ''
  return ENNEAGRAM_NAMES[code[0]] ? `${code} (${ENNEAGRAM_NAMES[code[0]]})` : code
}

const cardStyle = (extra = {}) => ({
  background: 'white',
  border: '1.5px solid rgba(196,140,120,0.22)',
  borderRadius: '16px',
  padding: '28px 24px',
  boxShadow: '0 4px 20px rgba(90,60,30,0.08)',
  ...extra,
})

export default function PersonalityQuiz() {
  const navigate = useNavigate()
  const [mbti, setMbti] = useState('')
  const [enneagram, setEnneagram] = useState('')
  const [enneagramError, setEnneagramError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleEnneagramChange = val => {
    const cleaned = val.trim().toLowerCase().replace(/\s/g, '')
    setEnneagram(cleaned)
    setEnneagramError(cleaned && !ENNEAGRAM_REGEX.test(cleaned)
      ? 'Format must be like 5w6 (digit, w, digit)' : '')
  }

  const canProceed = mbti && enneagram && ENNEAGRAM_REGEX.test(enneagram)

  const handleSubmit = () => {
    if (!canProceed) return
    const result = {
      type: mbti,
      traits: TRAIT_MAP[mbti] || 'Balanced and adaptable',
      enneagram: getEnneagramName(enneagram),
      enneagram_code: enneagram,
    }
    localStorage.setItem('personality', JSON.stringify(result))
    setSubmitted(true)
    setTimeout(() => navigate('/profile'), 2000)
  }

  // ── Success screen ──
  if (submitted) return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', padding: '40px 20px', textAlign: 'center',
    }}>
      <div style={{ fontSize: '72px', marginBottom: '24px' }}>🎉</div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', marginBottom: '12px', color: '#1a1208' }}>
        Personality locked in!
      </h2>
      <div style={{
        fontFamily: "'Playfair Display', serif", fontSize: '64px', fontWeight: 900,
        color: '#e8b84b', marginBottom: '12px',
      }}>{mbti}</div>
      <div style={{
        ...cardStyle({ padding: '8px 24px', display: 'inline-block', marginBottom: '16px' }),
        fontSize: '14px', color: '#5a4a38',
      }}>
        Enneagram: {getEnneagramName(enneagram)}
      </div>
      <p style={{ color: '#5a4a38', maxWidth: '380px', lineHeight: 1.6, fontSize: '14px' }}>
        {TRAIT_MAP[mbti]}
      </p>
      <p style={{ marginTop: '28px', fontSize: '13px', color: '#9a7d5a' }}>
        Taking you to the next step...
      </p>
    </div>
  )

  // ── Main form ──
  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '24px 20px 80px' }}>
      <ProgressBar step={1} total={4} />

      {/* Header */}
      <div style={{ marginTop: '36px', marginBottom: '32px' }}>
        <div style={{
          fontSize: '11px', color: '#c48c78', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px',
        }}>Step 2 of 4</div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(24px, 5vw, 34px)', color: '#1a1208',
          marginBottom: '12px', lineHeight: 1.2,
        }}>Enter Your Personality Types</h1>
        <p style={{ color: '#5a4a38', lineHeight: 1.7, fontSize: '15px' }}>
          Take the two free tests below, then enter your results here.
          These help Raah recommend careers that truly match how you think and work.
        </p>
      </div>

      {/* Test cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '36px' }}>

        {/* MBTI card */}
        <div style={{ ...cardStyle({ borderLeft: '4px solid #c48c78', position: 'relative', paddingTop: '32px' }) }}>
          {/* tape */}
          <div style={{
            position: 'absolute', top: '10px', left: '20px',
            width: '40px', height: '12px',
            background: 'rgba(234,194,100,0.6)', borderRadius: '2px',
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '30px', flexShrink: 0 }}>🧠</div>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <div style={{
                display: 'inline-block', background: '#fdf0cc', color: '#7a5c1a',
                border: '1px solid #e8d48a', borderRadius: '100px',
                padding: '3px 12px', fontSize: '10px', fontWeight: 600,
                letterSpacing: '0.08em', marginBottom: '8px',
              }}>step 2a · mbti</div>
              <div style={{
                fontFamily: "'Playfair Display', serif", fontWeight: 700,
                fontSize: '15px', marginBottom: '6px', color: '#1a1208',
              }}>MBTI Personality Test</div>
              <div style={{ fontSize: '13px', color: '#5a4a38', lineHeight: 1.5, marginBottom: '12px' }}>
                Free · ~12 min · Look for 4-letter result like{' '}
                <strong style={{ color: '#c48c78' }}>INTJ</strong>,{' '}
                <strong style={{ color: '#c48c78' }}>ENFP</strong>
              </div>
              <a
                href="https://www.16personalities.com/free-personality-test"
                target="_blank" rel="noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '9px 20px', borderRadius: '100px', fontSize: '13px',
                  fontWeight: 600, color: '#1a1208', textDecoration: 'none',
                  background: '#e8b84b',
                }}
              >Take MBTI Test ↗</a>
            </div>
          </div>
        </div>

        {/* Enneagram card */}
        <div style={{ ...cardStyle({ borderLeft: '4px solid #6c9b8c', position: 'relative', paddingTop: '32px' }) }}>
          {/* tape */}
          <div style={{
            position: 'absolute', top: '10px', left: '20px',
            width: '40px', height: '12px',
            background: 'rgba(234,194,100,0.6)', borderRadius: '2px',
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '30px', flexShrink: 0 }}>🔢</div>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <div style={{
                display: 'inline-block', background: '#dff0e8', color: '#1f5c46',
                border: '1px solid rgba(100,155,140,0.3)', borderRadius: '100px',
                padding: '3px 12px', fontSize: '10px', fontWeight: 600,
                letterSpacing: '0.08em', marginBottom: '8px',
              }}>step 2b · enneagram</div>
              <div style={{
                fontFamily: "'Playfair Display', serif", fontWeight: 700,
                fontSize: '15px', marginBottom: '6px', color: '#1a1208',
              }}>Enneagram Test</div>
              <div style={{ fontSize: '13px', color: '#5a4a38', lineHeight: 1.5, marginBottom: '12px' }}>
                Free · ~10 min · Look for type + wing like{' '}
                <strong style={{ color: '#6c9b8c' }}>5w6</strong>,{' '}
                <strong style={{ color: '#6c9b8c' }}>2w3</strong>
              </div>
              <a
                href="https://www.truity.com/test/enneagram-personality-test"
                target="_blank" rel="noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '9px 20px', borderRadius: '100px', fontSize: '13px',
                  fontWeight: 600, color: 'white', textDecoration: 'none',
                  background: '#6c9b8c',
                }}
              >Take Enneagram Test ↗</a>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <div style={{ flex: 1, height: '1px', background: 'rgba(196,140,120,0.22)' }} />
        <span style={{
          fontSize: '11px', color: '#9a7d5a', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '1px',
        }}>Enter Your Results</span>
        <div style={{ flex: 1, height: '1px', background: 'rgba(196,140,120,0.22)' }} />
      </div>

      {/* MBTI dropdown */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: '#5a4a38', display: 'block', marginBottom: '8px',
        }}>Your MBTI Type</label>
        <select
          value={mbti}
          onChange={e => setMbti(e.target.value)}
          style={{
            width: '100%', padding: '12px 16px', background: '#f5f0e8',
            border: '1.5px solid rgba(196,140,120,0.3)', borderRadius: '10px',
            fontFamily: "'DM Sans', sans-serif", fontSize: '15px',
            color: '#1a1208', outline: 'none', appearance: 'none',
          }}
        >
          <option value="">— Select your 4-letter type —</option>
          {MBTI_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        {mbti && (
          <div style={{
            marginTop: '10px', padding: '12px 16px',
            background: '#fdf0cc', border: '1px solid #e8d48a',
            borderRadius: '10px', fontSize: '13px', color: '#1a1208', lineHeight: 1.6,
          }}>
            <span style={{ fontWeight: 700, color: '#7a5c1a' }}>{mbti}:</span> {TRAIT_MAP[mbti]}
            <div style={{ marginTop: '6px', fontSize: '12px', color: '#9a7d5a' }}>
              💡 Common Enneagram match:{' '}
              <strong style={{ color: '#c48c78' }}>{MBTI_TO_ENNEAGRAM[mbti]}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Enneagram input */}
      <div style={{ marginBottom: '28px' }}>
        <label style={{
          fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: '#5a4a38', display: 'block', marginBottom: '8px',
        }}>Your Enneagram Type</label>
        <input
          type="text"
          value={enneagram}
          onChange={e => handleEnneagramChange(e.target.value)}
          placeholder="e.g. 5w6"
          maxLength={3}
          style={{
            width: '100%', padding: '12px 16px', background: '#f5f0e8',
            letterSpacing: '3px', fontWeight: 700, fontSize: '18px',
            border: `1.5px solid ${enneagramError ? '#c48c78' : enneagram && !enneagramError ? '#6c9b8c' : 'rgba(196,140,120,0.3)'}`,
            borderRadius: '10px', fontFamily: "'DM Sans', sans-serif",
            color: '#1a1208', outline: 'none',
          }}
        />
        {enneagramError && (
          <div style={{ color: '#c48c78', fontSize: '13px', marginTop: '6px' }}>
            ⚠ {enneagramError}
          </div>
        )}
        {enneagram && !enneagramError && (
          <div style={{
            marginTop: '10px', padding: '10px 14px',
            background: '#dff0e8', border: '1px solid rgba(100,155,140,0.3)',
            borderRadius: '10px', fontSize: '13px', color: '#1f5c46',
          }}>
            ✅ <strong>{getEnneagramName(enneagram)}</strong>
          </div>
        )}
        <p style={{ fontSize: '12px', color: '#9a7d5a', marginTop: '8px', lineHeight: 1.5 }}>
          Format: digit (1–9), then <strong>w</strong>, then a digit — e.g. <strong>5w6</strong>, <strong>2w3</strong>
        </p>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!canProceed}
        style={{
          width: '100%', padding: '16px',
          background: canProceed ? '#1a1208' : '#c0a080',
          color: '#faf5ee', border: 'none', borderRadius: '100px',
          fontFamily: "'DM Sans', sans-serif", fontSize: '16px', fontWeight: 600,
          cursor: canProceed ? 'pointer' : 'not-allowed', letterSpacing: '0.04em',
          transition: 'background 0.2s',
        }}
      >
        Continue to Profile →
      </button>

      {!canProceed && (
        <p style={{ textAlign: 'center', fontSize: '13px', color: '#9a7d5a', marginTop: '10px' }}>
          Complete both fields to continue
        </p>
      )}
    </div>
  )
}