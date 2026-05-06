import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateRoadmap } from '../api/client'
import ProgressBar from '../components/ProgressBar'

const PROVINCES = ['Punjab','Sindh','KPK','Balochistan','Islamabad (Federal)','AJK','Gilgit-Baltistan']
const EDUCATION_LEVELS = ['No formal education','Primary (Class 1-5)','Middle (Class 6-8)','Matric','Intermediate / FA / FSc',"Bachelor's Degree","Master's Degree",'PhD']
const INCOME_BRACKETS = [
  { label: 'Under PKR 20,000/month', value: 15000 },
  { label: 'PKR 20,000 – 40,000/month', value: 30000 },
  { label: 'PKR 40,000 – 80,000/month', value: 60000 },
  { label: 'PKR 80,000 – 1,50,000/month', value: 115000 },
  { label: 'Above PKR 1,50,000/month', value: 200000 },
]
const LOADING_TIPS = [
  'Analyzing career trends across Pakistan...',
  'Matching your personality with ideal careers...',
  'Finding scholarships you qualify for...',
  'Building your personalized roadmap...',
  'Identifying volunteering opportunities near you...',
  'Almost there — crafting your future path...',
]

const inputStyle = {
  width: '100%', padding: '12px 16px', background: '#f5f0e8',
  border: '1.5px solid rgba(196,140,120,0.3)', borderRadius: '10px',
  fontFamily: "'DM Sans', sans-serif", fontSize: '14px',
  color: '#1a1208', outline: 'none', appearance: 'none',
  transition: 'border-color 0.2s',
}

const labelStyle = {
  fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: '#5a4a38',
  display: 'block', marginBottom: '7px',
}

const sectionHeadStyle = {
  padding: '4px 0 8px', marginBottom: '8px', marginTop: '20px',
  fontSize: '11px', fontWeight: 700, color: '#c48c78',
  textTransform: 'uppercase', letterSpacing: '1.5px',
  borderBottom: '1.5px solid rgba(196,140,120,0.22)',
}

export default function ProfileForm() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [loadingTip, setLoadingTip] = useState(0)
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({
    name: '', age: 15, city: '', province: 'Punjab',
    income_bracket: 30000, father_education: 'Matric',
    mother_education: 'Matric', siblings: 1,
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
    const tipInterval = setInterval(() => {
      setLoadingTip(prev => (prev + 1) % LOADING_TIPS.length)
    }, 3000)

    const chatData = JSON.parse(localStorage.getItem('chat_data') || '{}')
    const personality = JSON.parse(localStorage.getItem('personality') || '{"type":"INFP","traits":"balanced","enneagram":"4w5 (The Bohemian)"}')
    const profile = {
      session_id: localStorage.getItem('session_id') || 'local-' + Date.now(),
      name: form.name, age: Number(form.age), city: form.city,
      province: form.province, income_bracket: Number(form.income_bracket),
      father_education: form.father_education, mother_education: form.mother_education,
      siblings: Number(form.siblings),
      personality_type: personality.type || 'INFP',
      enneagram_type: personality.enneagram || null,
      conversation_summary: chatData.raw_summary || 'Student interested in exploring career options',
      interests: chatData.interests || ['learning', 'technology'],
      academic_strength: chatData.academic_strength || 'general studies',
    }

    try {
      const res = await generateRoadmap(profile)
      localStorage.setItem('roadmap', JSON.stringify(res.data))
      localStorage.setItem('user_city', form.city)
      clearInterval(tipInterval)
      navigate('/roadmap')
    } catch (e) {
      clearInterval(tipInterval)
      setErrors({ general: e.message || 'Something went wrong. Please try again.' })
      setLoading(false)
    }
  }

  // ── Loading screen ──
  if (loading) return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', gap: '24px', padding: '40px 20px',
    }}>
      <div style={{
        width: '90px', height: '90px', borderRadius: '50%', background: '#e8b84b',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '44px', animation: 'floatAnim 2s ease-in-out infinite',
      }}>🧭</div>
      <h2 style={{
        fontFamily: "'Playfair Display', serif", fontSize: '26px',
        textAlign: 'center', color: '#1a1208',
      }}>Building Your Roadmap</h2>
      <p style={{ color: '#5a4a38', textAlign: 'center', maxWidth: '400px', lineHeight: 1.6, fontSize: '15px' }}>
        {LOADING_TIPS[loadingTip]}
      </p>
      <div style={{ display: 'flex', gap: '8px' }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width: '8px', height: '8px', borderRadius: '50%', background: '#e8b84b',
            animation: 'bounceAnim 1.4s infinite', animationDelay: `${i * 0.15}s`,
          }} />
        ))}
      </div>
      <p style={{ fontSize: '12px', color: '#9a7d5a', marginTop: '8px' }}>
        This usually takes 10–15 seconds...
      </p>
      <style>{`
        @keyframes bounceAnim { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes floatAnim  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
      `}</style>
    </div>
  )

  const personality = JSON.parse(localStorage.getItem('personality') || 'null')

  // ── Main form ──
  return (
    <div style={{ maxWidth: '580px', margin: '0 auto', padding: '24px 20px 80px' }}>
      <ProgressBar step={2} total={4} />

      <div style={{ marginTop: '36px', marginBottom: '32px' }}>
        <div style={{
          fontSize: '11px', color: '#c48c78', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px',
        }}>Step 3 of 4</div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(24px, 5vw, 34px)', color: '#1a1208',
          marginBottom: '10px', lineHeight: 1.2, fontStyle: 'italic',
        }}>Tell us about yourself</h1>
        <p style={{ color: '#5a4a38', lineHeight: 1.6, fontSize: '14px' }}>
          This helps us give you a roadmap that's realistic for your situation. All information stays private.
        </p>
      </div>

      {/* ── Personal Info ── */}
      <div style={sectionHeadStyle}>👤 Personal Info</div>

      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Your Full Name</label>
        <input
          value={form.name} onChange={e => set('name', e.target.value)}
          placeholder="e.g. Fatima Ahmed" maxLength={100} style={inputStyle}
        />
        {errors.name && <div style={{ color: '#c48c78', fontSize: '13px', marginTop: '5px' }}>⚠ {errors.name}</div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
        <div>
          <label style={labelStyle}>Your Age</label>
          <input type="number" value={form.age} onChange={e => set('age', e.target.value)}
            min="13" max="20" style={inputStyle} />
          {errors.age && <div style={{ color: '#c48c78', fontSize: '13px', marginTop: '5px' }}>⚠ {errors.age}</div>}
        </div>
        <div>
          <label style={labelStyle}>Number of Siblings</label>
          <input type="number" value={form.siblings} onChange={e => set('siblings', e.target.value)}
            min="0" max="20" style={inputStyle} />
        </div>
      </div>

      {/* ── Location ── */}
      <div style={sectionHeadStyle}>📍 Location</div>

      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Your City</label>
        <input value={form.city} onChange={e => set('city', e.target.value)}
          placeholder="e.g. Rawalpindi, Lahore, Karachi" maxLength={100} style={inputStyle} />
        {errors.city && <div style={{ color: '#c48c78', fontSize: '13px', marginTop: '5px' }}>⚠ {errors.city}</div>}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Province / Territory</label>
        <select value={form.province} onChange={e => set('province', e.target.value)} style={inputStyle}>
          {PROVINCES.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      {/* ── Family Background ── */}
      <div style={sectionHeadStyle}>👨‍👩‍👧 Family Background</div>

      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Family Monthly Income</label>
        {/* Pill toggle group */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
          {INCOME_BRACKETS.map(b => (
            <button
              key={b.value}
              onClick={() => set('income_bracket', b.value)}
              style={{
                padding: '11px 16px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 500,
                border: '1.5px solid',
                borderColor: form.income_bracket === b.value ? '#e8b84b' : 'rgba(196,140,120,0.25)',
                background: form.income_bracket === b.value ? '#fdf0cc' : 'white',
                color: form.income_bracket === b.value ? '#7a5c1a' : '#1a1208',
                transition: 'all 0.15s ease',
              }}
            >{b.label}</button>
          ))}
        </div>
        <p style={{ fontSize: '12px', color: '#9a7d5a', marginTop: '8px' }}>
          🔒 Kept private — only used to suggest realistic options
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
        <div>
          <label style={labelStyle}>Father's Education</label>
          <select value={form.father_education} onChange={e => set('father_education', e.target.value)} style={inputStyle}>
            {EDUCATION_LEVELS.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Mother's Education</label>
          <select value={form.mother_education} onChange={e => set('mother_education', e.target.value)} style={inputStyle}>
            {EDUCATION_LEVELS.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {/* Personality summary */}
      {personality && (
        <div style={{
          padding: '16px 20px', background: '#fdf0cc',
          border: '1px solid #e8d48a', borderRadius: '12px', marginBottom: '24px',
          position: 'relative',
        }}>
          {/* tape */}
          <div style={{
            position: 'absolute', top: '-7px', left: '20px',
            width: '38px', height: '12px',
            background: 'rgba(234,194,100,0.6)', borderRadius: '2px',
          }} />
          <div style={{
            fontSize: '11px', color: '#9a7d5a', marginBottom: '8px',
            textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600,
          }}>Your Personality</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '22px', fontWeight: 900, color: '#7a5c1a',
            }}>{personality.type}</span>
            {personality.enneagram && (
              <span style={{
                fontSize: '13px', color: '#5a4a38', padding: '4px 12px',
                background: 'rgba(196,140,120,0.12)', borderRadius: '100px',
              }}>{personality.enneagram}</span>
            )}
          </div>
          <div style={{ fontSize: '13px', color: '#5a4a38', marginTop: '6px', lineHeight: 1.5 }}>
            {personality.traits}
          </div>
        </div>
      )}

      {/* Error */}
      {errors.general && (
        <div style={{
          background: 'rgba(196,100,100,0.08)', border: '1px solid rgba(196,100,100,0.25)',
          color: '#a03030', padding: '14px 18px', borderRadius: '12px',
          marginBottom: '20px', fontSize: '14px', lineHeight: 1.5,
        }}>⚠ {errors.general}</div>
      )}

      <button
        onClick={submit}
        style={{
          width: '100%', padding: '16px', background: '#e8b84b', color: '#1a1208',
          border: 'none', borderRadius: '100px',
          fontFamily: "'DM Sans', sans-serif", fontSize: '17px', fontWeight: 700,
          letterSpacing: '0.04em', cursor: 'pointer', marginBottom: '40px',
          boxShadow: '0 2px 12px rgba(232,184,75,0.35)', transition: 'background 0.2s',
        }}
        onMouseEnter={e => { e.target.style.background = '#c49a2a' }}
        onMouseLeave={e => { e.target.style.background = '#e8b84b' }}
      >
        Generate My Roadmap →
      </button>
    </div>
  )
}