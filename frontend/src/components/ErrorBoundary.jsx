import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Raah Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '40px',
          background: 'var(--bg)', textAlign: 'center'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>🛑</div>
          <h2 style={{ fontSize: '28px', marginBottom: '12px', fontFamily: 'Playfair Display, serif' }}>
            Oops! Something went wrong
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px', maxWidth: '400px', lineHeight: 1.6 }}>
            Don't worry — your progress might still be saved. Try refreshing or starting over.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn" onClick={() => window.location.reload()}>
              Refresh Page
            </button>
            <button className="btn-ghost btn" onClick={() => {
              localStorage.clear()
              window.location.href = '/'
            }}>
              Start Over
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
