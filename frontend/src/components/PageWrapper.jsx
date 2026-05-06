export default function PageWrapper({ children }) {
  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <div className="plaid-bg" />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  )
}