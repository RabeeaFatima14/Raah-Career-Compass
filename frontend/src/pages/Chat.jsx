import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ProgressBar from '../components/ProgressBar'

const QUESTIONS = [
  { id: 'name',     prompt: "Assalamu Alaikum! 😊 I'm Raah (راہ) — your career companion. What's your name?" },
  { id: 'subjects', prompt: 'Which school subjects do you enjoy most? For example, Maths, Physics, Biology, Computer Science, or Arts.' },
  { id: 'freeTime', prompt: 'What do you like to do in your free time? (Hobbies, apps, YouTube, games, reading, creating things, etc.)' },
  { id: 'future',   prompt: 'What kind of future job or career sounds exciting to you? Describe it in your own words.' },
  { id: 'strength', prompt: 'What is your biggest strength in school or learning? For example, problem solving, creativity, talking to people, or being careful with details.' },
]

function normalizeInterest(text) {
  const cleaned = text.toLowerCase()
  const map = {
    maths:'Maths', math:'Maths', physics:'Physics', chemistry:'Chemistry',
    biology:'Biology', computer:'Computer Science', coding:'Coding',
    programming:'Coding', design:'Design', art:'Art', drawing:'Art',
    writing:'Writing', stories:'Writing', games:'Gaming', youtube:'YouTube',
    music:'Music', sports:'Sports', business:'Business', finance:'Finance',
    accounting:'Accounting', helping:'Helping people', people:'Helping people',
    social:'Social work', technology:'Technology', robots:'Robotics',
    research:'Research', numbers:'Numbers', teaching:'Teaching',
    medical:'Medical', health:'Health', law:'Law', marketing:'Marketing',
    video:'Video editing', editing:'Video editing', agriculture:'Agriculture',
    farming:'Agriculture', electronics:'Electronics', startup:'Entrepreneurship',
    entrepreneurship:'Entrepreneurship', community:'Community work',
  }
  const found = new Set()
  Object.keys(map).forEach(k => { if (cleaned.includes(k)) found.add(map[k]) })
  return Array.from(found)
}

function buildInterests(a) {
  const combined = [...normalizeInterest(a.subjects||''), ...normalizeInterest(a.freeTime||''), ...normalizeInterest(a.future||'')]
  const unique = [...new Set(combined)]
  if (unique.length) return unique.slice(0,5)
  return (a.subjects||a.freeTime||a.future||'').split(/,|\band\b|\bor\b|\//i).map(s=>s.trim()).filter(Boolean).slice(0,5) || ['learning','exploring','science']
}

function buildAcademicStrength(a) { return a.strength || a.subjects || 'general studies' }

function buildRawSummary(a) {
  return `${a.name||'This student'} ${a.subjects?`likes ${a.subjects}`:'has broad interests'}, ${a.freeTime?`enjoys ${a.freeTime}`:'likes learning'}, ${a.future?`wants a career in ${a.future}`:'is exploring ideas'}${a.strength?`, feels strong at ${a.strength}`:''}.`
}

export default function Chat() {
  const navigate = useNavigate()
  const [answers, setAnswers] = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [messages, setMessages] = useState([{ role: 'assistant', content: QUESTIONS[0].prompt }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [msgCount, setMsgCount] = useState(0)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => { if (!loading) inputRef.current?.focus() }, [loading])

  const send = () => {
    if (!input.trim() || loading) return
    const updatedAnswers = { ...answers, [QUESTIONS[currentIndex].id]: input.trim() }
    const newMessages = [...messages, { role: 'user', content: input }]
    setMessages(newMessages)
    setAnswers(updatedAnswers)
    setInput('')
    setLoading(true)
    setMsgCount(p => p + 1)
    const nextIndex = currentIndex + 1
    if (nextIndex < QUESTIONS.length) {
      setTimeout(() => {
        setMessages(p => [...p, { role: 'assistant', content: QUESTIONS[nextIndex].prompt }])
        setCurrentIndex(nextIndex)
        setLoading(false)
      }, 300)
      return
    }
    const extractedData = {
      interests: buildInterests(updatedAnswers),
      academic_strength: buildAcademicStrength(updatedAnswers),
      raw_summary: buildRawSummary(updatedAnswers),
    }
    const finish = 'Great! I have your answers. Next, we will learn about your personality.'
    setMessages(p => [...p, { role: 'assistant', content: finish }])
    localStorage.setItem('chat_data', JSON.stringify(extractedData))
    localStorage.setItem('chat_history', JSON.stringify([...newMessages, { role: 'assistant', content: finish }]))
    setTimeout(() => { setLoading(false); navigate('/personality') }, 1200)
  }

  const startOver = () => {
    if (window.confirm('Start over? Your chat progress will be reset.')) {
      localStorage.clear(); window.location.href = '/'
    }
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '24px 20px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <ProgressBar step={0} total={4} />
        <button onClick={startOver} style={{
          marginLeft: '12px', background: 'transparent', border: '1.5px solid rgba(196,140,120,0.3)',
          borderRadius: '100px', padding: '8px 16px', fontSize: '12px', cursor: 'pointer',
          color: '#5a4a38', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap',
        }}>↺ Reset</button>
      </div>

      {/* Chat header */}
      <div style={{
        padding: '16px 20px', background: 'white', borderRadius: '16px',
        border: '1.5px solid rgba(196,140,120,0.22)', marginBottom: '16px',
        display: 'flex', alignItems: 'center', gap: '14px',
        boxShadow: '0 4px 20px rgba(90,60,30,0.08)',
      }}>
        <div style={{
          width: '42px', height: '42px', borderRadius: '50%',
          background: '#e8b84b', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Noto Nastaliq Urdu', serif", fontSize: '20px', color: '#1a1208', flexShrink: 0,
        }}>ر</div>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '16px', color: '#1a1208' }}>
            Raah <span style={{ fontFamily: "'Noto Nastaliq Urdu', serif", fontSize: '14px' }}>راہ</span>
          </div>
          <div style={{ fontSize: '12px', color: '#6c9b8c' }}>● Your AI career companion</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '8px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '10px' }}>
            {msg.role === 'assistant' && (
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                background: '#e8b84b', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Noto Nastaliq Urdu', serif", fontSize: '14px', color: '#1a1208',
              }}>ر</div>
            )}
            <div style={{
              maxWidth: '78%', padding: '14px 18px', fontSize: '15px', lineHeight: 1.65, whiteSpace: 'pre-line',
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: msg.role === 'user' ? '#1a1208' : 'white',
              color: msg.role === 'user' ? '#faf5ee' : '#1a1208',
              border: msg.role === 'user' ? 'none' : '1.5px solid rgba(196,140,120,0.22)',
              boxShadow: '0 2px 8px rgba(90,60,30,0.06)',
            }}>{msg.content}</div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%', background: '#e8b84b',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Noto Nastaliq Urdu', serif", fontSize: '14px', color: '#1a1208',
            }}>ر</div>
            <div style={{
              background: 'white', border: '1.5px solid rgba(196,140,120,0.22)',
              borderRadius: '16px', padding: '14px 20px', display: 'flex', gap: '6px',
            }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width: '8px', height: '8px', borderRadius: '50%', background: '#e8b84b',
                  animation: 'bounce 1.2s infinite', animationDelay: `${i*0.2}s`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Progress hint */}
      {msgCount >= 2 && msgCount < QUESTIONS.length && (
        <div style={{ textAlign: 'center', padding: '8px', fontSize: '12px', color: '#9a7d5a' }}>
          💡 Keep going — {Math.min(msgCount, QUESTIONS.length)}/{QUESTIONS.length} questions answered
        </div>
      )}

      {/* Input */}
      <div style={{
        display: 'flex', gap: '10px', paddingTop: '16px',
        borderTop: '1.5px solid rgba(196,140,120,0.18)', marginTop: '12px',
      }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Type your message..."
          maxLength={2000}
          disabled={loading}
          style={{
            flex: 1, padding: '13px 16px',
            background: '#f5f0e8', border: '1.5px solid rgba(196,140,120,0.3)',
            borderRadius: '12px', fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px', color: '#1a1208', outline: 'none',
          }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{
            padding: '13px 22px', background: loading || !input.trim() ? '#c0a080' : '#1a1208',
            color: '#faf5ee', border: 'none', borderRadius: '12px',
            fontFamily: "'DM Sans', sans-serif", fontSize: '16px', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }}
        >{loading ? '...' : '→'}</button>
      </div>

      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }`}</style>
    </div>
  )
}