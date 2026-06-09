import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const HistorialComunicaciones: React.FC = () => {
  // Estado para la paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 10;

  const { data: historial, isLoading } = useQuery({
    queryKey: ['historial-correos'],
    queryFn: async () => {
      const response = await axios.get('https://gestion-comercial-j3ed.onrender.com/api/comunicaciones/historial');
      return response.data;
    },
    refetchInterval: 5000
  });

  if (isLoading) return <p style={{ padding: '20px', color: '#64748b' }}>Cargando historial...</p>;

  // Lógica de paginación
  const totalPaginas = Math.ceil((historial?.length || 0) / itemsPorPagina);
  const indiceFinal = paginaActual * itemsPorPagina;
  const indiceInicial = indiceFinal - itemsPorPagina;
  const historialPaginado = historial?.slice(indiceInicial, indiceFinal);

  return (
    <div style={{ 
      padding: '25px', 
      backgroundColor: '#ffffff', 
      borderRadius: '16px', 
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
      borderLeft: '6px solid #2563eb',
      marginBottom: '20px'
    }}>
      <h3 style={{ marginTop: 0, color: '#1e293b', marginBottom: '20px', fontSize: '1.25rem' }}>
         Historial de Comunicaciones
      </h3>

      <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left' }}>
              {['Fecha', 'Proveedor', 'Asunto', 'Estado'].map(h => (
                <th key={h} style={{ padding: '16px', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {historialPaginado?.map((h: any) => (
              <tr key={h.comunicacion_proveedor_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '15px', fontSize: '0.9rem', color: '#64748b' }}>
                  {h.fecha_envio ? new Date(h.fecha_envio).toLocaleString() : '---'}
                </td>
                <td style={{ padding: '15px', fontWeight: 'bold', color: '#1e293b' }}>{h.razon_social}</td>
                <td style={{ padding: '15px', color: '#475569' }}>{h.asunto}</td>
                <td style={{ padding: '15px' }}>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '6px', 
                    fontSize: '0.75rem', 
                    fontWeight: 'bold',
                    backgroundColor: h.estado_envio === 'respondido' ? '#d4edda' : '#dbeafe',
                    color: h.estado_envio === 'respondido' ? '#155724' : '#1e40af'
                  }}>
                    {h.estado_envio === 'respondido' ? '✅ RESPONDIDO' : '📤 ENVIADO'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Controles de Paginación */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
        <button 
          onClick={() => setPaginaActual(p => Math.max(1, p - 1))} 
          disabled={paginaActual === 1}
          style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: paginaActual === 1 ? '#e2e8f0' : '#2563eb', color: 'white', cursor: paginaActual === 1 ? 'not-allowed' : 'pointer' }}
        >
          Anterior
        </button>
        <span style={{ fontSize: '14px', fontWeight: '600' }}>Pág {paginaActual} de {totalPaginas || 1}</span>
        <button 
          onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))} 
          disabled={paginaActual >= totalPaginas}
          style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: paginaActual >= totalPaginas ? '#e2e8f0' : '#2563eb', color: 'white', cursor: paginaActual >= totalPaginas ? 'not-allowed' : 'pointer' }}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default HistorialComunicaciones;