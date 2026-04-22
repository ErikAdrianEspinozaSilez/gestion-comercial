// src/App.tsx
import Productos from './Productos';

function App() {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
      <header style={{ backgroundColor: '#007bff', color: 'white', padding: '15px', borderRadius: '8px' }}>
        <h1>SISTEMA DE GESTIÓN - SUPER VALLE MARKET</h1>
      </header>
      <main style={{ marginTop: '20px' }}>
        <Productos />
      </main>
    </div>
  );
}

export default App;