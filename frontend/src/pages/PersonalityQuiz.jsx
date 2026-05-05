import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getQuestions, calculatePersonality } from '../api/client'
import ProgressBar from '../components/ProgressBar'

export default function PersonalityQuiz() {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState(null)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    getQuestions().then(res => {
      setQuestions(res.data)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [])

  const choose = async (option) => {
    if (animating) return
    setAnimating(true)
    const newAnswers = [...answers, option.scores]
    setAnswers(newAnswers)

    if (current + 1 < questions.length) {
      // Animate out then in
      setTimeout(() => {
        setCurrent(current + 1)
        setAnimating(false)
      }, 300)
    } else {
      // Calculate result
      try {
        const res = await calculatePersonality(newAnswers)
        setResult(res.data)
        localStorage.setItem('personality', JSON.stringify(res.data))
        // Show result for 3 seconds before navigating
        setTimeout(() => navigate('/profile'), 3500)
      } catch {
        localStorage.setItem('personality', JSON.stringify({ type: 'INFP', traits: 'balanced', enneagram: '4w5 (The Bohemian)' }))
        navigate('/profile')
      }
    }
  }

  if (loading) return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', gap: '16px'
    }}>
      <div style={{ fontSize: '48px', animation: 'float 2s ease-in-out infinite' }}>🧠</div>
      <div style={{ color: 'var(--text-muted)', animation: 'pulse 1.5s infinite' }}>Loading personality questions...</div>
    </div>
  )

  if (result) return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', padding: '40px 20px',
      animation: 'fadeInUp 0.8s ease-out'
    }}>
      <div style={{
        fontSize: '80px', marginBottom: '24px',
        animation: 'float 3s ease-in-out infinite'
      }}>🎉</div>

      <h2 style={{ fontSize: '36px', marginBottom: '8px' }}>You are an</h2>

      <div style={{
        fontSize: '72px', fontWeight: 900, marginBottom: '16px',
        fontFamily: 'Playfair Display, serif',
        background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'fadeInUp 0.6s ease-out 0.3s forwards',
        opacity: 0
      }}>
        {result.type}
      </div>

      <p style={{
        fontSize: '17px', color: 'var(--text-muted)', textAlign: 'center',
        maxWidth: '450px', lineHeight: 1.7, marginBottom: '20px',
        animation: 'fadeInUp 0.6s ease-out 0.5s forwards', opacity: 0
      }}>
        {result.traits}
      </p>

      {result.enneagram && (
        <div style={{
          padding: '12px 24px', background: 'var(--surface)',
          border: '1px solid var(--border)', borderRadius: '100px',
          fontSize: '14px', color: 'var(--accent-light, var(--accent))',
          animation: 'fadeInUp 0.6s ease-out 0.7s forwards', opacity: 0
        }}>
          Enneagram: {result.enneagram}
        </div>
      )}

      <p style={{
        marginTop: '32px', fontSize: '14px', color: 'var(--text-muted)',
        animation: 'pulse 1.5s infinite'
      }}>
        Taking you to the next step...
      </p>
    </div>
  )

  const q = questions[current]
  if (!q) return null
  const progress = ((current) / questions.length) * 100

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '20px', minHeight: '100vh' }}>
      <ProgressBar step={1} total={4} />

      <div style={{
        marginTop: '40px',
        animation: animating ? 'fadeIn 0.3s ease-out' : 'fadeInUp 0.5s ease-out'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Question {current + 1} of {questions.length}
          </span>
          <span style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 600 }}>
            {Math.round(progress)}%
          </span>
        </div>

        {/* Progress Bar */}
        <div style={{
          height: '4px', background: 'var(--border)', borderRadius: '2px',
          marginBottom: '48px', overflow: 'hidden'
        }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: 'linear-gradient(90deg, var(--accent), var(--accent2))',
            borderRadius: '2px', transition: 'width 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
          }} />
        </div>

        {/* Dimension Badge */}
        <div style={{
          display: 'inline-block', padding: '6px 14px',
          background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)',
          borderRadius: '100px', fontSize: '11px', color: 'var(--accent)',
          fontWeight: 600, letterSpacing: '1px', marginBottom: '20px',
          textTransform: 'uppercase'
        }}>
          {q.dimension === 'EI' ? '🔋 Energy' :
           q.dimension === 'SN' ? '👁️ Perception' :
           q.dimension === 'TF' ? '💭 Decision Making' : '📋 Lifestyle'}
        </div>

        <h2 style={{
          fontSize: 'clamp(22px, 4vw, 28px)', marginBottom: '40px',
          lineHeight: 1.4, fontWeight: 700
        }}>
          {q.text}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {q.options.map((opt, i) => (
            <button key={i} onClick={() => choose(opt)}
              id={`quiz-option-${i}`}
              disabled={animating}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                padding: '22px 24px',
                borderRadius: '14px',
                fontSize: '16px',
                cursor: animating ? 'default' : 'pointer',
                textAlign: 'left',
                fontFamily: 'DM Sans, sans-serif',
                transition: 'all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                lineHeight: 1.5,
                display: 'flex', alignItems: 'center', gap: '14px',
                opacity: animating ? 0.5 : 1
              }}
              onMouseEnter={e => {
                if (!animating) {
                  e.currentTarget.style.borderColor = 'var(--accent)'
                  e.currentTarget.style.background = 'rgba(108,99,255,0.06)'
                  e.currentTarget.style.transform = 'translateX(6px)'
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(108,99,255,0.1)'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.background = 'var(--surface)'
                e.currentTarget.style.transform = 'translateX(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <span style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'rgba(108,99,255,0.1)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, color: 'var(--accent)', fontSize: '14px',
                flexShrink: 0
              }}>
                {['A', 'B'][i]}
              </span>
              <span>{opt.text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}