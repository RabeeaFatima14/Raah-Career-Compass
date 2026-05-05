export default function OpportunityCard({ opp }) {
  return (
    <div className="card" style={{
      marginBottom: '10px', padding: '18px 20px',
      transition: 'all 0.3s',
      cursor: 'default'
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', gap: '12px'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, marginBottom: '4px', fontSize: '15px' }}>
            {opp.title}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            {opp.org}
          </div>
        </div>
        <span style={{
          background: 'rgba(108,99,255,0.1)',
          color: 'var(--accent)',
          padding: '5px 14px',
          borderRadius: '100px',
          fontSize: '11px',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          letterSpacing: '0.3px'
        }}>{opp.type}</span>
      </div>
      <div style={{
        marginTop: '12px', display: 'flex', gap: '16px',
        flexWrap: 'wrap', fontSize: '13px'
      }}>
        <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          ⏱ {opp.commitment}
        </span>
        <span style={{ color: 'var(--safe)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          ✓ {opp.benefit}
        </span>
      </div>
      <div style={{
        marginTop: '10px', fontSize: '13px', color: 'var(--accent)',
        display: 'flex', alignItems: 'center', gap: '6px'
      }}>
        📩 {opp.contact}
      </div>
    </div>
  )
}