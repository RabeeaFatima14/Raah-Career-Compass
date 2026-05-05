export default function ProgressBar({ step, total }) {
  const steps = ['Chat', 'Personality', 'Background', 'Your Path']
  return (
    <div style={{ padding: '16px 0', marginBottom: '4px', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        {steps.map((s, i) => (
          <span key={i} style={{
            fontSize: '11px',
            fontWeight: 600,
            color: i < step ? 'var(--accent)' : i === step ? 'var(--text)' : 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            display: 'flex', alignItems: 'center', gap: '4px',
            transition: 'color 0.3s'
          }}>
            {i < step && <span style={{ color: 'var(--safe)', fontSize: '12px' }}>✓</span>}
            {s}
          </span>
        ))}
      </div>
      <div style={{
        height: '3px', background: 'var(--border)', borderRadius: '2px',
        overflow: 'hidden', position: 'relative'
      }}>
        <div style={{
          height: '100%',
          width: `${(step / (total - 1)) * 100}%`,
          background: 'linear-gradient(90deg, var(--accent), var(--accent2))',
          borderRadius: '2px',
          transition: 'width 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          boxShadow: '0 0 10px var(--glow-accent)'
        }} />
      </div>
    </div>
  )
}