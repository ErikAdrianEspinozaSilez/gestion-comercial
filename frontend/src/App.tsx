import AgregarProducto from './AgregarProducto';
import ListaProductos from './ListaProductos';
import RegistrarMovimiento from './RegistrarMovimiento';
import HistorialMovimientos from './HistorialMovimientos'; // 1. ESTA ES LA IMPORTACIÓN

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
        marginBottom: '30px'
      }}>
        <h1>GESTIÓN COMERCIAL - SUPER VALLE</h1>
      </header>

      <main>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
          <AgregarProducto />
          <RegistrarMovimiento />
        </div>

        <hr />

        <ListaProductos />
        
        {/* 2. AQUÍ AGREGAS EL COMPONENTE PARA VER LOS REGISTROS */}
        <HistorialMovimientos /> 
      </main>
    </div>
  );
}

export default App;