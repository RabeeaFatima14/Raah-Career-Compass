import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateRoadmap } from '../api/client'
import ProgressBar from '../components/ProgressBar'

const PROVINCES = ['Punjab', 'Sindh', 'KPK', 'Balochistan', 'Islamabad (Federal)', 'AJK', 'Gilgit-Baltistan']
const EDUCATION_LEVELS = ['No formal education', 'Primary (Class 1-5)', 'Middle (Class 6-8)', 'Matric', 'Intermediate / FA / FSc', "Bachelor's Degree", "Master's Degree", 'PhD']
const INCOME_BRACKETS = [
  { label: 'Under PKR 20,000/month', value: 15000 },
  { label: 'PKR 20,000 – 40,000/month', value: 30000 },
  { label: 'PKR 40,000 – 80,000/month', value: 60000 },
  { label: 'PKR 80,000 – 1,50,000/month', value: 115000 },
  { label: 'Above PKR 1,50,000/month', value: 200000 },
]

const LOADING_TIPS = [
  "Analyzing career trends across Pakistan...",
  "Matching your personality with ideal careers...",
  "Finding scholarships you qualify for...",
  "Building your personalized roadmap...",
  "Identifying volunteering opportunities near you...",
  "Almost there — crafting your future path...",
]

export default function ProfileForm() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [loadingTip, setLoadingTip] = useState(0)
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({
    name: '', age: 15, city: '', province: 'Punjab',
    income_bracket: 30000, father_education: 'Matric',
    mother_education: 'Matric', siblings: 1
  })

  const set = (k, v) => {
    setForm(prev => ({ ...prev, [k]: v }))
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Please enter your name'
    if (form.name.length > 100) e.name = 'Name is too long'
    if (!form.city.trim()) e.city = 'Please enter your city'
    if (form.age < 13 || form.age > 20) e.age = 'Age must be between 13 and 20'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async () => {
    if (!validate()) return
    setLoading(true)

    // Rotate loading tips
    const tipInterval = setInterval(() => {
      setLoadingTip(prev => (prev + 1) % LOADING_TIPS.length)
    }, 3000)

    const chatData = JSON.parse(localStorage.getItem('chat_data') || '{}')
    const personality = JSON.parse(localStorage.getItem('personality') || '{"type":"INFP","traits":"balanced","enneagram":"4w5 (The Bohemian)"}')

    const profile = {
      session_id: localStorage.getItem('session_id') || 'local-' + Date.now(),
      name: form.name,
      age: Number(form.age),
      city: form.city,
      province: form.province,
      income_bracket: Number(form.income_bracket),
      father_education: form.father_education,
      mother_education: form.mother_education,
      siblings: Number(form.siblings),
      personality_type: personality.type || 'INFP',
      enneagram_type: personality.enneagram || null,
      conversation_summary: chatData.raw_summary || 'Student interested in exploring career options',
      interests: chatData.interests || ['learning', 'technology'],
      academic_strength: chatData.academic_strength || 'general studies'
    }

    try {
      const res = await generateRoadmap(profile)
      localStorage.setItem('roadmap', JSON.stringify(res.data))
      localStorage.setItem('user_city', form.city)
      clearInterval(tipInterval)
      navigate('/roadmap')
    } catch (e) {
      clearInterval(tipInterval)
      setErrors({ general: e.message || 'Something went wrong generating your roadmap. Please try again.' })
      setLoading(false)
    }
  }

  if (loading) return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', gap: '24px',
      padding: '40px 20px', animation: 'fadeIn 0.5s ease-out'
    }}>
      {/* Animated Compass */}
      <div style={{
        width: '100px', height: '100px', borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '48px', animation: 'float 2s ease-in-out infinite',
        boxShadow: '0 12px 40px var(--glow-accent)'
      }}>🧭</div>

      <h2 style={{ fontSize: '28px', textAlign: 'center' }}>
        Building Your <span className="gradient-text">Roadmap</span>
      </h2>

      <p style={{
        color: 'var(--text-muted)', textAlign: 'center', maxWidth: '420px',
        lineHeight: 1.6, fontSize: '15px',
        animation: 'fadeIn 0.5s ease-out'
      }}>
        {LOADING_TIPS[loadingTip]}
      </p>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: 'var(--accent)',
            animation: 'bounce 1.4s infinite',
            animationDelay: `${i * 0.15}s`
          }} />
        ))}
      </div>

      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '16px' }}>
        This usually takes 10-15 seconds...
      </p>
    </div>
  )

  return (
    <div style={{
      maxWidth: '620px', margin: '0 auto', padding: '20px',
      animation: 'fadeInUp 0.6s ease-out'
    }}>
      <ProgressBar step={2} total={4} />

      <div style={{ marginTop: '40px', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>
          Tell us about <span className="gradient-text">yourself</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
          This helps us give you a roadmap that's realistic for your situation. 
          All information stays private.
        </p>
      </div>

      {/* Personal Info Section */}
      <div style={{
        padding: '4px 0 8px', marginBottom: '8px',
        fontSize: '12px', fontWeight: 600, color: 'var(--accent)',
        textTransform: 'uppercase', letterSpacing: '1.5px',
        borderBottom: '1px solid var(--border)'
      }}>👤 Personal Info</div>

      <div className="field">
        <label htmlFor="name-input">Your Full Name</label>
        <input id="name-input" value={form.name} onChange={e => set('name', e.target.value)}
          placeholder="e.g. Fatima Ahmed" maxLength={100} />
        {errors.name && <div style={{ color: 'var(--accent2)', fontSize: '13px', marginTop: '6px' }}>⚠ {errors.name}</div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="field">
          <label htmlFor="age-input">Your Age</label>
          <input id="age-input" type="number" value={form.age}
            onChange={e => set('age', e.target.value)} min="13" max="20" />
          {errors.age && <div style={{ color: 'var(--accent2)', fontSize: '13px', marginTop: '6px' }}>⚠ {errors.age}</div>}
        </div>
        <div className="field">
          <label htmlFor="siblings-input">Number of Siblings</label>
          <input id="siblings-input" type="number" value={form.siblings}
            onChange={e => set('siblings', e.target.value)} min="0" max="20" />
        </div>
      </div>

      {/* Location Section */}
      <div style={{
        padding: '4px 0 8px', marginBottom: '8px', marginTop: '8px',
        fontSize: '12px', fontWeight: 600, color: 'var(--accent)',
        textTransform: 'uppercase', letterSpacing: '1.5px',
        borderBottom: '1px solid var(--border)'
      }}>📍 Location</div>

      <div className="field">
        <label htmlFor="city-input">Your City</label>
        <input id="city-input" value={form.city} onChange={e => set('city', e.target.value)}
          placeholder="e.g. Rawalpindi, Lahore, Karachi" maxLength={100} />
        {errors.city && <div style={{ color: 'var(--accent2)', fontSize: '13px', marginTop: '6px' }}>⚠ {errors.city}</div>}
      </div>

      <div className="field">
        <label htmlFor="province-select">Province / Territory</label>
        <select id="province-select" value={form.province} onChange={e => set('province', e.target.value)}>
          {PROVINCES.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      {/* Family Section */}
      <div style={{
        padding: '4px 0 8px', marginBottom: '8px', marginTop: '8px',
        fontSize: '12px', fontWeight: 600, color: 'var(--accent)',
        textTransform: 'uppercase', letterSpacing: '1.5px',
        borderBottom: '1px solid var(--border)'
      }}>👨‍👩‍👧 Family Background</div>

      <div className="field">
        <label htmlFor="income-select">Family Monthly Income</label>
        <select id="income-select" value={form.income_bracket}
          onChange={e => set('income_bracket', Number(e.target.value))}>
          {INCOME_BRACKETS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
        </select>
        <p style={{
          fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px',
          display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          🔒 This is kept private — only used to suggest realistic options
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="field">
          <label htmlFor="father-edu-select">Father's Education</label>
          <select id="father-edu-select" value={form.father_education}
            onChange={e => set('father_education', e.target.value)}>
            {EDUCATION_LEVELS.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="mother-edu-select">Mother's Education</label>
          <select id="mother-edu-select" value={form.mother_education}
            onChange={e => set('mother_education', e.target.value)}>
            {EDUCATION_LEVELS.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {/* Personality Summary */}
      {(() => {
        const personality = JSON.parse(localStorage.getItem('personality') || 'null')
        if (!personality) return null
        return (
          <div style={{
            padding: '16px 20px', background: 'rgba(108,99,255,0.06)',
            border: '1px solid rgba(108,99,255,0.15)', borderRadius: '12px',
            marginBottom: '24px'
          }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Your Personality
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '20px', fontWeight: 900, color: 'var(--accent)', fontFamily: 'Playfair Display, serif' }}>
                {personality.type}
              </span>
              {personality.enneagram && (
                <span style={{ fontSize: '13px', color: 'var(--text-soft)', padding: '4px 10px', background: 'var(--surface2)', borderRadius: '6px' }}>
                  {personality.enneagram}
                </span>
              )}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.5 }}>
              {personality.traits}
            </div>
          </div>
        )
      })()}

      {/* Error */}
      {errors.general && (
        <div style={{
          background: 'rgba(255,99,99,0.08)', border: '1px solid rgba(255,99,99,0.25)',
          color: '#ff7070', padding: '14px 18px', borderRadius: '12px',
          marginBottom: '20px', fontSize: '14px', lineHeight: 1.5
        }}>
          ⚠ {errors.general}
        </div>
      )}

      <button className="btn" onClick={submit} id="generate-roadmap-btn"
        style={{
          width: '100%', justifyContent: 'center', padding: '18px',
          fontSize: '17px', marginBottom: '40px'
        }}>
        Generate My Roadmap →
      </button>
    </div>
  )
}