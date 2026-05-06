import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ProgressBar from '../components/ProgressBar'

const MBTI_TYPES = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
]

const TRAIT_MAP = {
  INTJ: 'Strategic, independent, long-term planner — thrives in research and complex systems',
  INTP: 'Analytical, curious, logic-driven — excellent at solving complex problems',
  ENTJ: 'Natural leader, decisive, goal-oriented — suited for management and entrepreneurship',
  ENTP: 'Innovative, debate-loving, entrepreneurial — sees possibilities others miss',
  INFJ: 'Empathetic, visionary, purpose-driven — excellent in counseling and social impact',
  INFP: 'Creative, idealistic, value-driven — suited for arts and helping professions',
  ENFJ: 'Charismatic, people-focused, motivating — natural teacher or community leader',
  ENFP: 'Enthusiastic, creative, sociable — great in communication and creative fields',
  ISTJ: 'Reliable, detail-oriented, traditional — excellent in accounting and administration',
  ISFJ: 'Caring, dependable, service-oriented — suited for healthcare and education',
  ESTJ: 'Organized, practical, leadership-capable — great in management and law',
  ESFJ: 'Warm, social, harmony-seeking — suited for HR and community roles',
  ISTP: 'Practical, hands-on problem solver — great in engineering and technical trades',
  ISFP: 'Artistic, gentle, present-focused — suited for design and healthcare',
  ESTP: 'Action-oriented, realistic, good under pressure — great in business and entrepreneurship',
  ESFP: 'Energetic, spontaneous, people-loving — great in creative and social fields',
}

const MBTI_TO_ENNEAGRAM = {
  INTJ: '5w6', INTP: '5w4', ENTJ: '8w7', ENTP: '7w8',
  INFJ: '4w5', INFP: '4w5', ENFJ: '2w3', ENFP: '7w6',
  ISTJ: '1w9', ISFJ: '6w5', ESTJ: '8w9', ESFJ: '2w1',
  ISTP: '5w6', ISFP: '9w1', ESTP: '7w8', ESFP: '7w6',
}

const ENNEAGRAM_NAMES = {
  '1': 'The Reformer', '2': 'The Helper', '3': 'The Achiever',
  '4': 'The Individualist', '5': 'The Investigator', '6': 'The Loyalist',
  '7': 'The Enthusiast', '8': 'The Challenger', '9': 'The Peacemaker',
}

// Validate format like 1w1 through 9w9
const ENNEAGRAM_REGEX = /^[1-9]w[1-9]$/

function getEnneagramName(code) {
  if (!code) return ''
  const core = code[0]
  return ENNEAGRAM_NAMES[core] ? `${code} (${ENNEAGRAM_NAMES[core]})` : code
}

export default function PersonalityQuiz() {
  const navigate = useNavigate()
  const [mbti, setMbti] = useState('')
  const [enneagram, setEnneagram] = useState('')
  const [enneagramError, setEnneagramError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleEnneagramChange = (val) => {
    // Auto uppercase and trim
    const cleaned = val.trim().toLowerCase().replace(/\s/g, '')
    setEnneagram(cleaned)
    if (cleaned && !ENNEAGRAM_REGEX.test(cleaned)) {
      setEnneagramError('Format must be like 5w6 (a number, w, then a number)')
    } else {
      setEnneagramError('')
    }
  }

  const canProceed = mbti && enneagram && ENNEAGRAM_REGEX.test(enneagram)

  const handleSubmit = () => {
    if (!canProceed) return
    const enneagramFull = getEnneagramName(enneagram)
    const result = {
      type: mbti,
      traits: TRAIT_MAP[mbti] || 'Balanced and adaptable',
      enneagram: enneagramFull,
      enneagram_code: enneagram,
    }
    localStorage.setItem('personality', JSON.stringify(result))
    setSubmitted(true)
    setTimeout(() => navigate('/profile'), 2200)
  }

  // ── Success Screen ──
  if (submitted) {
    const enneagramFull = getEnneagramName(enneagram)
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh', padding: '40px 20px',
        animation: 'fadeInUp 0.8s ease-out'
      }}>
        <div style={{ fontSize: '72px', marginBottom: '24px', animation: 'float 3s ease-in-out infinite' }}>🎉</div>
        <h2 style={{ fontSize: '28px', marginBottom: '8px', textAlign: 'center' }}>Your personality is locked in!</h2>
        <div style={{
          fontSize: '64px', fontWeight: 900, marginBottom: '12px',
          fontFamily: 'Playfair Display, serif',
          background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          animation: 'fadeInUp 0.6s ease-out 0.2s both'
        }}>
          {mbti}
        </div>
        <div style={{
          padding: '8px 20px', background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '100px', fontSize: '14px', color: 'var(--accent-light, var(--accent))',
          marginBottom: '12px', animation: 'fadeInUp 0.6s ease-out 0.4s both'
        }}>
          Enneagram: {enneagramFull}
        </div>
        <p style={{
          color: 'var(--text-muted)', textAlign: 'center', maxWidth: '380px',
          lineHeight: 1.6, fontSize: '14px', animation: 'fadeInUp 0.6s ease-out 0.5s both'
        }}>
          {TRAIT_MAP[mbti]}
        </p>
        <p style={{ marginTop: '32px', fontSize: '13px', color: 'var(--text-muted)', animation: 'pulse 1.5s infinite' }}>
          Taking you to the next step...
        </p>
      </div>
    )
  }

  // ── Main Form ──
  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '20px 20px 80px', animation: 'fadeInUp 0.6s ease-out' }}>
      <ProgressBar step={1} total={4} />

      {/* Header */}
      <div style={{ marginTop: '40px', marginBottom: '32px' }}>
        <div style={{
          fontSize: '12px', color: 'var(--accent)', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px'
        }}>
          Step 2 of 4
        </div>
        <h1 style={{ fontSize: 'clamp(26px, 5vw, 36px)', marginBottom: '12px', lineHeight: 1.2 }}>
          Enter Your <span className="gradient-text">Personality Types</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '15px' }}>
          Take the two free personality tests below, then enter your results here.
          These help Raah recommend careers that truly match how you think and work.
        </p>
      </div>

      {/* Test Links */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '36px' }}>
        <div style={{
          padding: '18px 20px',
          background: 'linear-gradient(135deg, rgba(108,99,255,0.08), rgba(108,99,255,0.04))',
          border: '1px solid rgba(108,99,255,0.2)', borderRadius: '14px',
          display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap'
        }}>
          <div style={{ fontSize: '32px', flexShrink: 0 }}>🧠</div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>MBTI Personality Test</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '10px' }}>
              Free • 12 minutes • Takes you to 16personalities.com. Look for the 4-letter result like <strong style={{ color: 'var(--accent)' }}>INTJ</strong>, <strong style={{ color: 'var(--accent)' }}>ENFP</strong>, etc.
            </div>
            <a
              href="https://www.16personalities.com/free-personality-test"
              target="_blank"
              rel="noreferrer"
              id="mbti-test-link"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '8px', fontSize: '13px',
                fontWeight: 600, color: 'white', textDecoration: 'none',
                background: 'linear-gradient(135deg, var(--accent), #5a52e0)'
              }}
            >
              Take MBTI Test ↗
            </a>
          </div>
        </div>

        <div style={{
          padding: '18px 20px',
          background: 'linear-gradient(135deg, rgba(255,101,132,0.08), rgba(255,101,132,0.04))',
          border: '1px solid rgba(255,101,132,0.2)', borderRadius: '14px',
          display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap'
        }}>
          <div style={{ fontSize: '32px', flexShrink: 0 }}>🔢</div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>Enneagram Test</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '10px' }}>
              Free • 10 minutes • Takes you to truity.com. Look for your type + wing like <strong style={{ color: 'var(--accent2)' }}>5w6</strong>, <strong style={{ color: 'var(--accent2)' }}>2w3</strong>, etc.
            </div>
            <a
              href="https://www.truity.com/test/enneagram-personality-test"
              target="_blank"
              rel="noreferrer"
              id="enneagram-test-link"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '8px', fontSize: '13px',
                fontWeight: 600, color: 'white', textDecoration: 'none',
                background: 'linear-gradient(135deg, var(--accent2), #e0415a)'
              }}
            >
              Take Enneagram Test ↗
            </a>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px'
      }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
          Enter Your Results
        </span>
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
      </div>

      {/* MBTI Dropdown */}
      <div className="field">
        <label htmlFor="mbti-select">Your MBTI Type</label>
        <select
          id="mbti-select"
          value={mbti}
          onChange={e => setMbti(e.target.value)}
          style={{ fontSize: '16px' }}
        >
          <option value="">— Select your 4-letter type —</option>
          {MBTI_TYPES.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {/* Live MBTI trait preview */}
        {mbti && (
          <div style={{
            marginTop: '10px', padding: '12px 16px',
            background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.15)',
            borderRadius: '10px', fontSize: '13px', color: 'var(--text-soft)',
            lineHeight: 1.6, animation: 'fadeIn 0.3s ease-out'
          }}>
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{mbti}:</span> {TRAIT_MAP[mbti]}
            <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
              💡 Common Enneagram match: <strong style={{ color: 'var(--accent)' }}>{MBTI_TO_ENNEAGRAM[mbti]}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Enneagram Input */}
      <div className="field">
        <label htmlFor="enneagram-input">Your Enneagram Type</label>
        <input
          id="enneagram-input"
          type="text"
          value={enneagram}
          onChange={e => handleEnneagramChange(e.target.value)}
          placeholder="e.g. 5w6"
          maxLength={3}
          style={{
            letterSpacing: '2px', fontWeight: 600, fontSize: '18px',
            borderColor: enneagramError ? 'var(--accent2)' : enneagram && !enneagramError ? 'var(--safe)' : undefined
          }}
        />
        {enneagramError && (
          <div style={{ color: 'var(--accent2)', fontSize: '13px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ⚠ {enneagramError}
          </div>
        )}
        {enneagram && !enneagramError && (
          <div style={{
            marginTop: '10px', padding: '12px 16px',
            background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)',
            borderRadius: '10px', fontSize: '13px', color: 'var(--text-soft)',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            ✅ <span style={{ color: 'var(--safe)', fontWeight: 700 }}>{getEnneagramName(enneagram)}</span>
          </div>
        )}
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.5 }}>
          Format: a single digit (1–9), then <strong>w</strong>, then another digit — e.g. <strong>5w6</strong>, <strong>2w3</strong>, <strong>7w8</strong>
        </p>
      </div>

      {/* Submit */}
      <button
        className="btn"
        onClick={handleSubmit}
        id="personality-submit-btn"
        disabled={!canProceed}
        style={{ width: '100%', justifyContent: 'center', padding: '18px', fontSize: '17px', marginTop: '8px' }}
      >
        Continue to Profile →
      </button>

      {!canProceed && (
        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', marginTop: '12px' }}>
          Complete both fields to continue
        </p>
      )}
    </div>
  )
}