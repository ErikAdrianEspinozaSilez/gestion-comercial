import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const HistorialComunicaciones: React.FC = () => {
  const { data: historial, isLoading } = useQuery({
    queryKey: ['historial-correos'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:3000/api/comunicaciones/historial');
      return response.data;
    },
    refetchInterval: 5000 // Se actualiza cada 5 seg por si alguien confirma
  });

  if (isLoading) return <p>Cargando historial...</p>;

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h3 className="text-xl font-bold mb-4 text-slate-800">📧 Historial de Pedidos y Respuestas</h3>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b-2 border-slate-100">
            <th className="p-3">Fecha</th>
            <th className="p-3">Proveedor</th>
            <th className="p-3">Asunto</th>
            <th className="p-3">Estado</th>
          </tr>
        </thead>
        <tbody>
          {historial?.map((h: any) => (
            <tr key={h.comunicacion_proveedor_id} className="border-b border-slate-50 hover:bg-slate-50 transition">
              {/* Usamos fecha_envio */}
              <td className="p-3 text-sm">{h.fecha_envio ? new Date(h.fecha_envio).toLocaleString() : '---'}</td>
              <td className="p-3 font-medium">{h.razon_social}</td>
              <td className="p-3 text-slate-600">{h.asunto}</td>
              <td className="p-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  h.estado_envio === 'respondido' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-blue-100 text-blue-700 animate-pulse'
                }`}>
                  {h.estado_envio === 'respondido' ? '✅ RESPONDIDO' : '📤 ENVIADO'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HistorialComunicaciones;