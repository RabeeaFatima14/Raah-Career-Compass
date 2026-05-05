import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { sendChat } from '../api/client'
import ProgressBar from '../components/ProgressBar'

export default function Chat() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Assalamu Alaikum! 😊 I'm Raah (راہ) — your career companion. I'm here to help you figure out the best path for your future.\n\nFirst, tell me — what's your name?" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [msgCount, setMsgCount] = useState(0)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [loading])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setMsgCount(prev => prev + 1)

    try {
      const history = newMessages.slice(0, -1).map(m => ({
        role: m.role, content: m.content
      }))

      const res = await sendChat({
        session_id: localStorage.getItem('session_id') || 'local',
        message: input,
        history
      })

      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }])

      if (res.data.is_ready && res.data.extracted_data) {
        localStorage.setItem('chat_data', JSON.stringify(res.data.extracted_data))
        localStorage.setItem('chat_history', JSON.stringify(newMessages))
        setTimeout(() => navigate('/personality'), 2000)
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, something went wrong. ${e.message || 'Please try again.'}`
      }])
    }
    setLoading(false)
  }

  const startOver = () => {
    if (window.confirm('Start over? Your chat progress will be reset.')) {
      localStorage.clear()
      window.location.href = '/'
    }
  }

  return (
    <div style={{
      maxWidth: '720px', margin: '0 auto', padding: '20px',
      minHeight: '100vh', display: 'flex', flexDirection: 'column'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <ProgressBar step={0} total={4} />
        <button className="btn-ghost btn btn-sm" onClick={startOver}
          style={{ marginLeft: '12px', whiteSpace: 'nowrap', flexShrink: 0 }}>
          ↺ Reset
        </button>
      </div>

      {/* Chat Header */}
      <div style={{
        padding: '16px 0', borderBottom: '1px solid var(--border)',
        marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px'
      }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', fontWeight: 700
        }}>ر</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '16px' }}>Raah <span className="urdu" style={{ fontSize: '14px' }}>راہ</span></div>
          <div style={{ fontSize: '12px', color: 'var(--safe)' }}>● Online — Ready to help</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px 0',
        display: 'flex', flexDirection: 'column', gap: '14px'
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            animation: `${msg.role === 'user' ? 'slideInRight' : 'slideInLeft'} 0.4s ease-out`
          }}>
            {msg.role === 'assistant' && (
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', flexShrink: 0, marginRight: '10px', alignSelf: 'flex-end'
              }}>ر</div>
            )}
            <div style={{
              maxWidth: '78%',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, var(--accent), #5a52e0)'
                : 'var(--surface)',
              border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
              borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
              padding: '14px 18px',
              fontSize: '15px',
              lineHeight: 1.65,
              whiteSpace: 'pre-line'
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px'
            }}>ر</div>
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '20px', padding: '14px 20px', display: 'flex', gap: '6px'
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: 'var(--accent)',
                  animation: 'bounce 1.2s infinite',
                  animationDelay: `${i * 0.2}s`
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Progress hint */}
      {msgCount >= 2 && msgCount < 5 && (
        <div style={{
          textAlign: 'center', padding: '8px',
          fontSize: '12px', color: 'var(--text-muted)',
          animation: 'fadeIn 0.5s ease-out'
        }}>
          💡 Keep chatting — Raah is learning about you ({Math.min(msgCount, 4)}/5 questions)
        </div>
      )}

      {/* Input */}
      <div style={{
        display: 'flex', gap: '12px', padding: '16px 0',
        borderTop: '1px solid var(--border)'
      }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Type your message..."
          id="chat-input"
          style={{ flex: 1 }}
          maxLength={2000}
          disabled={loading}
        />
        <button className="btn" onClick={send}
          disabled={loading || !input.trim()}
          id="chat-send-btn"
          style={{ padding: '14px 24px' }}>
          {loading ? '...' : '→'}
        </button>
      </div>
    </div>
  )
}