import AgregarProducto from './AgregarProducto';
import ListaProductos from './ListaProductos';
import RegistrarMovimiento from './RegistrarMovimiento';
import HistorialMovimientos from './HistorialMovimientos';
import AlertasInventario from './AlertasInventario';
import LectorVentas from './LectorVentas';
import DashboardStats from './DashboardStats'; // <--- 1. Importamos el nuevo Dashboard

function App() {
  return (
    <div style={{ 
      fontFamily: 'Segoe UI, sans-serif', 
      padding: '20px', 
      maxWidth: '1000px', 
      margin: '0 auto',
      backgroundColor: '#f8f9fa'
    }}>
      <header style={{ 
        backgroundColor: '#007bff', 
        color: 'white', 
        padding: '20px', 
        borderRadius: '12px', 
        textAlign: 'center',
        marginBottom: '30px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0 }}>GESTIÓN COMERCIAL - SUPER VALLE</h1>
      </header>

      <main>
        {/* NUEVO: Las estadísticas del Dashboard justo al inicio */}
        <DashboardStats /> 

        {/* Alertas de stock bajo para visibilidad inmediata */}
        <AlertasInventario />

        {/* Lector de ventas para registrar salidas rápidamente */}
        <LectorVentas />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
          <AgregarProducto />
          <RegistrarMovimiento />
        </div>

        <hr style={{ margin: '40px 0', border: '0', borderTop: '1px solid #ddd' }} />

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', marginBottom: '30px' }}>
          <h3 style={{ marginTop: 0 }}>📦 Inventario Actual</h3>
          <ListaProductos />
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px' }}>
          <h3 style={{ marginTop: 0 }}>📜 Historial de Movimientos</h3>
          <HistorialMovimientos /> 
        </div>
      </main>
    </div>
  );
}

export default App;