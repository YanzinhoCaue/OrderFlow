export default function DashboardFallback() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '32px',
      backgroundColor: '#f5f5f5',
    }}>
      <div style={{
        textAlign: 'center',
        color: '#ef4444',
      }}>
        <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>Carregando...</h1>
        <p>Se o carregamento levar muito tempo, tente fazer login novamente.</p>
      </div>
    </div>
  )
}
