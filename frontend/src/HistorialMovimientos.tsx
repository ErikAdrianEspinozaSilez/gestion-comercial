import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const HistorialMovimientos: React.FC = () => {

  // =========================
  // ESTADOS
  // =========================

  const hoy = new Date().toISOString().split('T')[0];

  const [searchTerm, setSearchTerm] = useState('');
  const [filtroPeriodo, setFiltroPeriodo] = useState('todos');

  const [tipoFiltro, setTipoFiltro] = useState('dia');
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().toISOString().slice(0, 7));
  const [fechaInicio, setFechaInicio] = useState(hoy);
  const [fechaFin, setFechaFin] = useState(hoy);

  // =========================
  // ESTILOS REUTILIZABLES
  // =========================

  const inputStyle = {
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '14px'
  };

  const labelStyle = {
    fontSize: '12px',
    fontWeight: 'bold' as const,
    color: '#475569'
  };

  const cardStyle = {
    padding: '15px',
    color: 'white',
    borderRadius: '10px',
    textAlign: 'center' as const
  };

  const buttonStyle = {
    padding: '11px 20px',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
    fontSize: '14px'
  };

  // =========================
  // DASHBOARD
  // =========================

  const { data: stats } = useQuery({
    queryKey: ['dashboard-ventas'],
    queryFn: async () => {
      const res = await axios.get('http://localhost:3000/productos/dashboard-ventas');
      return res.data;
    },
    refetchInterval: 5000
  });

  // =========================
  // HISTORIAL
  // =========================

  const { data: movimientos, isLoading } = useQuery({
    queryKey: ['historial-filtrado', filtroPeriodo],
    queryFn: async () => {
      const res = await axios.get(
        `http://localhost:3000/productos/historial-detallado?periodo=${filtroPeriodo}`
      );
      return res.data;
    },
    refetchInterval: 2000
  });

  // =========================
  // GENERAR PDF
  // =========================

  const generarReportePDF = async () => {

    try {

      let url = `http://localhost:3000/movimientos/reporte-pdf?filtro=${tipoFiltro}`;

      if (tipoFiltro === 'mes_especifico') {
        url += `&mesAnio=${mesSeleccionado}`;
      }

      if (tipoFiltro === 'rango_personalizado') {
        url += `&inicio=${fechaInicio}&fin=${fechaFin}`;
      }

      const response = await axios.get(url);
      const movimientos = response.data;

      if (movimientos.length === 0) {
        alert('ℹ️ No se encontraron movimientos de stock.');
        return;
      }

      // =========================
      // TOTALES
      // =========================

      const totalVendido = movimientos
        .filter((m: any) => Number(m.tipo_movimiento_id) === 2)
        .reduce((sum: number, m: any) => sum + Number(m.cantidad) * Number(m.precio), 0);

      const totalInvertido = movimientos
        .filter((m: any) => Number(m.tipo_movimiento_id) === 1)
        .reduce((sum: number, m: any) => sum + Number(m.cantidad) * Number(m.precio), 0);

      // =========================
      // PDF
      // =========================

      const doc = new jsPDF();

      // ENCABEZADO

      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0); // NEGRO
      doc.text('SUPER VALLE MARKET', 14, 20);

      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0); // NEGRO
      doc.text('REPORTE AUDITADO DE CONTROL DE INVENTARIO Y SALIDAS', 14, 28);

      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0); // NEGRO
      doc.text(`Fecha de Emisión: ${new Date().toLocaleString()}`, 14, 35);
      doc.text(`Registros impresos: ${movimientos.length}`, 14, 40);

      // FINANZAS

      doc.setFontSize(11);

      doc.setTextColor(0, 0, 0); // NEGRO
      doc.text(`Total Vendido (Ingresos): ${totalVendido.toFixed(2)} Bs.`, 14, 49);

      doc.text(`Total Comprado (Egresos): ${totalInvertido.toFixed(2)} Bs.`, 110, 49);

      // LÍNEA

      doc.setDrawColor(180, 180, 180);
      doc.line(14, 53, 196, 53);

      // TABLA

      const columnasTabla = [
        'ID Mov.',
        'Producto / Artículo',
        'Tipo Flujo',
        'Precio (Bs.)',
        'Fecha'
      ];

      const filasTabla = movimientos.map((m: any) => [
        `#${m.movimiento_id}`,
        m.nombre_producto,
        Number(m.tipo_movimiento_id) === 1 ? 'ENTRADA' : 'SALIDA',
        `${Number(m.precio).toFixed(2)} Bs.`,
        m.fecha_formateada
      ]);

      autoTable(doc, {
        startY: 57,
        head: [columnasTabla],
        body: filasTabla,
        theme: 'striped',

        headStyles: {
          fillColor: [0, 0, 0],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },

        bodyStyles: {
          textColor: [0, 0, 0], // NEGRO
          fontSize: 10
        },

        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },

        styles: {
          overflow: 'linebreak'
        }
      });

      doc.save(`Reporte_SuperValle_${tipoFiltro}.pdf`);

    } catch (error) {

      console.error('Error generando PDF:', error);

      alert('❌ Error de comunicación con la base de datos.');
    }
  };

  // =========================
  // FILTRO TABLA
  // =========================

  const movimientosFiltrados = movimientos?.filter((m: any) => {

    const termino = searchTerm.toLowerCase();

    return (
      m.nombre_producto?.toLowerCase().includes(termino) ||
      m.nombre_tipo?.toLowerCase().includes(termino) ||
      m.fecha_formateada?.toLowerCase().includes(termino)
    );
  });

  // =========================
  // LOADING
  // =========================

  if (isLoading) {
    return <p>Cargando historial comercial...</p>;
  }

  // =========================
  // COMPONENTE
  // =========================

  return (
    <div style={{ marginTop: '20px', fontFamily: 'Arial, sans-serif' }}>

      {/* HEADER PDF */}

      <div style={{
        padding: '25px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        marginBottom: '25px'
      }}>

        <h2 style={{
          margin: '0 0 10px 0',
          color: '#1e293b',
          fontSize: '24px',
          fontWeight: 'bold'
        }}>
          📜 Historial de Movimientos Financieros
        </h2>

        <p style={{
          color: '#64748b',
          fontSize: '14px',
          marginBottom: '25px'
        }}>
          Filtre el flujo comercial y genere reportes oficiales en PDF.
        </p>

        {/* FILTROS PDF */}

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '15px',
          alignItems: 'end',
          backgroundColor: '#f8fafc',
          padding: '15px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0'
        }}>

          {/* TIPO FILTRO */}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>

            <label style={labelStyle}>Tipo de Filtro</label>

            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
              style={inputStyle}
            >
              <option value="dia">Hoy</option>
              <option value="semana">Últimos 7 Días</option>
              <option value="mes_especifico">Por Mes</option>
              <option value="rango_personalizado">Rango Personalizado</option>
            </select>
          </div>

          {/* MES */}

          {tipoFiltro === 'mes_especifico' && (

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>

              <label style={labelStyle}>Seleccione el Mes</label>

              <input
                type="month"
                value={mesSeleccionado}
                onChange={(e) => setMesSeleccionado(e.target.value)}
                style={inputStyle}
              />
            </div>
          )}

          {/* FECHAS */}

          {tipoFiltro === 'rango_personalizado' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={labelStyle}>Desde</label>

                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={labelStyle}>Hasta</label>

                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </>
          )}

          {/* BOTÓN */}

          <button
            onClick={generarReportePDF}
            style={{
              ...buttonStyle,
              backgroundColor: '#2563eb'
            }}
          >
            ⚙️ Generar PDF
          </button>
        </div>
      </div>

      {/* TARJETAS */}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '25px'
      }}>

        <div style={{ ...cardStyle, background: '#10b981' }}>
          <small>Ventas Hoy</small>
          <h2>Bs. {stats?.ventas_hoy}</h2>
        </div>

        <div style={{ ...cardStyle, background: '#3b82f6' }}>
          <small>Esta Semana</small>
          <h2>Bs. {stats?.ventas_semana}</h2>
        </div>

        <div style={{ ...cardStyle, background: '#8b5cf6' }}>
          <small>Este Mes</small>
          <h2>Bs. {stats?.ventas_mes}</h2>
        </div>
      </div>

      {/* FILTROS TABLA */}

      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px 12px 0 0',
        borderBottom: '2px solid #000'
      }}>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '15px'
        }}>

          {/* TABS */}

          <div style={{
            display: 'flex',
            gap: '5px',
            background: '#003a73',
            padding: '5px',
            borderRadius: '8px'
          }}>

            {['todos', 'hoy', 'semana', 'mes'].map((p) => (

              <button
                key={p}
                onClick={() => setFiltroPeriodo(p)}
                style={{
                  padding: '8px 15px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  backgroundColor: filtroPeriodo === p ? 'white' : 'transparent',
                  fontWeight: filtroPeriodo === p ? 'bold' : 'normal'
                }}
              >
                {p}
              </button>
            ))}
          </div>

          {/* BUSCADOR */}

          <input
            type="text"
            placeholder="🔍 Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              ...inputStyle,
              width: '300px'
            }}
          />
        </div>
      </div>

      {/* TABLA */}

      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        backgroundColor: 'white'
      }}>

        <thead>

          <tr style={{
            backgroundColor: '#f8fafc',
            textAlign: 'left'
          }}>

            {['Fecha/Hora', 'Producto', 'Tipo', 'Cant.', 'Subtotal']
              .map((titulo) => (

                <th key={titulo} style={{ padding: '12px' }}>
                  {titulo}
                </th>
              ))}
          </tr>
        </thead>

        <tbody>

          {movimientosFiltrados?.map((m: any) => (

            <tr
              key={m.movimiento_id}
              style={{ borderBottom: '1px solid #f1f5f9' }}
            >

              <td style={{ padding: '12px' }}>
                {m.fecha_formateada}
              </td>

              <td style={{
                padding: '12px',
                fontWeight: 'bold'
              }}>
                {m.nombre_producto}
              </td>

              <td style={{ padding: '12px' }}>

                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  backgroundColor: m.nombre_tipo === 'Entrada'
                    ? '#d4edda'
                    : '#fee2e2',

                  color: m.nombre_tipo === 'Entrada'
                    ? '#155724'
                    : '#991b1b'
                }}>
                  {m.nombre_tipo}
                </span>
              </td>

              <td style={{ padding: '12px' }}>
                {m.cantidad}
              </td>

              <td style={{
                padding: '12px',
                fontWeight: 'bold'
              }}>
                Bs. {m.subtotal || '0.00'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* SIN DATOS */}

      {movimientosFiltrados?.length === 0 && (

        <div style={{
          textAlign: 'center',
          padding: '40px',
          background: 'white',
          color: '#64748b'
        }}>
          No hay movimientos registrados.
        </div>
      )}
    </div>
  );
};

export default HistorialMovimientos;