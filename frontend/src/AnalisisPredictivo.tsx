import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';

const API_URL = 'https://gestion-comercial-j3ed.onrender.com';

type Agrupacion = 'mensual' | 'semanal';

type Producto = {
  producto_id: string;
  nombre_producto: string;
  imagen_url?: string;
  precio?: string;
};

type PeriodoHistorial = {
  periodo_inicio: string;
  periodo_fin: string;
  cantidad_vendida: number;
};

type ResultadoEstimacion = {
  producto: Producto;
  agrupacion: Agrupacion;
  metodo: string;
  periodos_solicitados: number;
  periodos_disponibles: number;
  suficientes_datos: boolean;
  mensaje?: string;
  periodo_analizado: {
    inicio: string;
    fin: string;
  };
  proximo_periodo: {
    inicio: string;
    fin: string;
  };
  historial: PeriodoHistorial[];
  total_vendido?: number;
  promedio_calculado: number | null;
  demanda_estimada: number | null;
  tendencia: 'creciente' | 'decreciente' | 'estable' | null;
  variacion_porcentual: number | null;
};

function fechaISO(fecha: Date) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function ultimoMesCompleto() {
  const fecha = new Date();
  fecha.setDate(1);
  fecha.setMonth(fecha.getMonth() - 1);
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
}

function ultimoDomingoCompleto() {
  const fecha = new Date();
  fecha.setHours(0, 0, 0, 0);
  const diasDesdeLunes = (fecha.getDay() + 6) % 7;
  fecha.setDate(fecha.getDate() - diasDesdeLunes - 1);
  return fechaISO(fecha);
}

function formatearFecha(valor: string) {
  return new Date(`${valor}T00:00:00`).toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function etiquetaPeriodo(periodo: PeriodoHistorial, agrupacion: Agrupacion) {
  const inicio = new Date(`${periodo.periodo_inicio}T00:00:00`);

  if (agrupacion === 'mensual') {
    return inicio.toLocaleDateString('es-BO', {
      month: 'short',
      year: 'numeric',
    });
  }

  return `${formatearFecha(periodo.periodo_inicio)} - ${formatearFecha(periodo.periodo_fin)}`;
}

const AnalisisPredictivo: React.FC = () => {
  const [searchParams] = useSearchParams();
  const productoInicial = searchParams.get('producto') || '';

  const [productoId, setProductoId] = useState(productoInicial);
  const [agrupacion, setAgrupacion] = useState<Agrupacion>('mensual');
  const [periodos, setPeriodos] = useState(3);
  const [mesFinal, setMesFinal] = useState(ultimoMesCompleto());
  const [semanaFinal, setSemanaFinal] = useState(ultimoDomingoCompleto());
  const [consulta, setConsulta] = useState<{
    productoId: string;
    agrupacion: Agrupacion;
    periodos: number;
    hasta: string;
  } | null>(null);

  useEffect(() => {
    if (!productoInicial) return;

    setProductoId(productoInicial);
    setAgrupacion('mensual');
    setPeriodos(3);
    setConsulta({
      productoId: productoInicial,
      agrupacion: 'mensual',
      periodos: 3,
      hasta: `${ultimoMesCompleto()}-01`,
    });
  }, [productoInicial]);

  const { data: productos = [], isLoading: cargandoProductos } = useQuery<Producto[]>({
    queryKey: ['productos-analisis-predictivo'],
    queryFn: async () => {
      const respuesta = await axios.get(`${API_URL}/analisis-predictivo/productos`);
      return respuesta.data;
    },
    staleTime: 60_000,
  });

  const {
    data: resultado,
    isLoading: generando,
    error,
  } = useQuery<ResultadoEstimacion>({
    queryKey: ['estimacion-demanda', consulta],
    queryFn: async () => {
      if (!consulta) throw new Error('No existe una consulta preparada.');

      const respuesta = await axios.get(
        `${API_URL}/analisis-predictivo/estimacion/${consulta.productoId}`,
        {
          params: {
            agrupacion: consulta.agrupacion,
            periodos: consulta.periodos,
            hasta: consulta.hasta,
          },
        },
      );

      return respuesta.data;
    },
    enabled: Boolean(consulta),
    retry: false,
  });

  const datosGrafico = useMemo(() => {
    if (!resultado) return [];

    const historicos = resultado.historial.map((item) => ({
      etiqueta: etiquetaPeriodo(item, resultado.agrupacion),
      cantidad: item.cantidad_vendida,
      estimado: false,
    }));

    if (resultado.demanda_estimada !== null) {
      historicos.push({
        etiqueta:
          resultado.agrupacion === 'mensual'
            ? new Date(`${resultado.proximo_periodo.inicio}T00:00:00`).toLocaleDateString('es-BO', {
                month: 'short',
                year: 'numeric',
              })
            : `${formatearFecha(resultado.proximo_periodo.inicio)} - ${formatearFecha(
                resultado.proximo_periodo.fin,
              )}`,
        cantidad: resultado.demanda_estimada,
        estimado: true,
      });
    }

    return historicos;
  }, [resultado]);

  const maximoGrafico = Math.max(1, ...datosGrafico.map((item) => item.cantidad));

  const generarAnalisis = (evento: React.FormEvent) => {
    evento.preventDefault();

    if (!productoId) return;

    setConsulta({
      productoId,
      agrupacion,
      periodos,
      hasta: agrupacion === 'mensual' ? `${mesFinal}-01` : semanaFinal,
    });
  };

  const tendenciaColor =
    resultado?.tendencia === 'creciente'
      ? '#16a34a'
      : resultado?.tendencia === 'decreciente'
        ? '#dc2626'
        : '#d97706';

  const tendenciaIcono =
    resultado?.tendencia === 'creciente'
      ? '↗'
      : resultado?.tendencia === 'decreciente'
        ? '↘'
        : '→';

  const mensajeError = axios.isAxiosError(error)
    ? error.response?.data?.error || 'No se pudo generar el análisis.'
    : error instanceof Error
      ? error.message
      : null;

  return (
    <div
      style={{
        fontFamily: 'Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        textAlign: 'left',
      }}
    >
      <section
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
          borderLeft: '6px solid #7c3aed',
        }}
      >
        <h2
          style={{
            margin: '0 0 8px',
            color: '#1e293b',
            fontSize: '26px',
            fontWeight: 800,
          }}
        >
          Análisis Predictivo de Demanda
        </h2>
        <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
          Utiliza las ventas históricas reales para estimar la cantidad que podría venderse en el
          siguiente periodo.
        </p>

        <form
          onSubmit={generarAnalisis}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '16px',
            alignItems: 'end',
            marginTop: '24px',
            padding: '18px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
          }}
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            <span style={{ color: '#475569', fontSize: '13px', fontWeight: 700 }}>Producto</span>
            <select
              value={productoId}
              onChange={(evento) => setProductoId(evento.target.value)}
              required
              disabled={cargandoProductos}
              style={inputStyle}
            >
              <option value="">
                {cargandoProductos ? 'Cargando productos...' : 'Seleccione un producto'}
              </option>
              {productos.map((producto) => (
                <option key={producto.producto_id} value={producto.producto_id}>
                  {producto.nombre_producto}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            <span style={{ color: '#475569', fontSize: '13px', fontWeight: 700 }}>Agrupación</span>
            <select
              value={agrupacion}
              onChange={(evento) => setAgrupacion(evento.target.value as Agrupacion)}
              style={inputStyle}
            >
              <option value="mensual">Mensual</option>
              <option value="semanal">Semanal</option>
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            <span style={{ color: '#475569', fontSize: '13px', fontWeight: 700 }}>
              Periodos anteriores
            </span>
            <select
              value={periodos}
              onChange={(evento) => setPeriodos(Number(evento.target.value))}
              style={inputStyle}
            >
              {Array.from({ length: 10 }, (_, indice) => indice + 3).map((cantidad) => (
                <option key={cantidad} value={cantidad}>
                  {cantidad} {agrupacion === 'mensual' ? 'meses' : 'semanas'}
                </option>
              ))}
            </select>
          </label>

          {agrupacion === 'mensual' ? (
            <label style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              <span style={{ color: '#475569', fontSize: '13px', fontWeight: 700 }}>
                Último mes analizado
              </span>
              <input
                type="month"
                value={mesFinal}
                max={ultimoMesCompleto()}
                onChange={(evento) => setMesFinal(evento.target.value)}
                style={inputStyle}
              />
            </label>
          ) : (
            <label style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              <span style={{ color: '#475569', fontSize: '13px', fontWeight: 700 }}>
                Domingo de la última semana
              </span>
              <input
                type="date"
                value={semanaFinal}
                max={ultimoDomingoCompleto()}
                onChange={(evento) => setSemanaFinal(evento.target.value)}
                style={inputStyle}
              />
            </label>
          )}

          <button
            type="submit"
            disabled={!productoId || generando}
            style={{
              minHeight: '44px',
              padding: '11px 18px',
              border: 'none',
              borderRadius: '9px',
              backgroundColor: !productoId || generando ? '#94a3b8' : '#7c3aed',
              color: '#ffffff',
              fontWeight: 800,
              cursor: !productoId || generando ? 'not-allowed' : 'pointer',
            }}
          >
            {generando ? 'Generando...' : 'Generar estimación'}
          </button>
        </form>
      </section>

      {mensajeError && (
        <div
          style={{
            padding: '16px 18px',
            borderRadius: '10px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            fontWeight: 600,
          }}
        >
          {mensajeError}
        </div>
      )}

      {resultado && (
        <>
          {!resultado.suficientes_datos ? (
            <section
              style={{
                padding: '22px',
                borderRadius: '14px',
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                color: '#92400e',
              }}
            >
              <h3 style={{ margin: '0 0 8px', fontSize: '18px' }}>Historial insuficiente</h3>
              <p style={{ margin: 0 }}>{resultado.mensaje}</p>
            </section>
          ) : (
            <section
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
              }}
            >
              <ResumenCard
                titulo="Producto analizado"
                valor={resultado.producto.nombre_producto}
                detalle={`${resultado.periodos_solicitados} ${
                  resultado.agrupacion === 'mensual' ? 'meses' : 'semanas'
                } completos`}
                color="#2563eb"
              />
              <ResumenCard
                titulo="Demanda estimada"
                valor={`${resultado.demanda_estimada} unidades`}
                detalle={`${formatearFecha(resultado.proximo_periodo.inicio)} al ${formatearFecha(
                  resultado.proximo_periodo.fin,
                )}`}
                color="#7c3aed"
              />
              <ResumenCard
                titulo="Tendencia"
                valor={`${tendenciaIcono} ${resultado.tendencia}`}
                detalle={
                  resultado.variacion_porcentual === null
                    ? 'Aumento desde un periodo sin ventas'
                    : `Variación: ${resultado.variacion_porcentual}%`
                }
                color={tendenciaColor}
              />
              <ResumenCard
                titulo="Promedio histórico"
                valor={`${resultado.promedio_calculado} unidades`}
                detalle={`Total analizado: ${resultado.total_vendido} unidades`}
                color="#0f766e"
              />
            </section>
          )}

          <section
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
              gap: '20px',
            }}
          >
            <div style={panelStyle}>
              <h3 style={tituloPanelStyle}>Ventas históricas y siguiente periodo</h3>
              <p style={{ margin: '0 0 22px', color: '#64748b', fontSize: '13px' }}>
                Las barras sólidas representan ventas reales. La barra con borde discontinuo es la
                estimación.
              </p>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'end',
                  gap: '12px',
                  minHeight: '290px',
                  padding: '16px 10px 0',
                  borderBottom: '1px solid #cbd5e1',
                  overflowX: 'auto',
                }}
              >
                {datosGrafico.map((item, indice) => (
                  <div
                    key={`${item.etiqueta}-${indice}`}
                    style={{
                      minWidth: '82px',
                      flex: '1 0 82px',
                      height: '250px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'end',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <strong style={{ color: '#334155', fontSize: '13px' }}>{item.cantidad}</strong>
                    <div
                      title={`${item.etiqueta}: ${item.cantidad} unidades`}
                      style={{
                        width: '58%',
                        minHeight: item.cantidad === 0 ? '4px' : '12px',
                        height: `${Math.max(2, (item.cantidad / maximoGrafico) * 185)}px`,
                        borderRadius: '8px 8px 2px 2px',
                        backgroundColor: item.estimado ? '#ede9fe' : '#7c3aed',
                        border: item.estimado ? '3px dashed #7c3aed' : 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <span
                      style={{
                        color: item.estimado ? '#6d28d9' : '#64748b',
                        fontSize: '11px',
                        textAlign: 'center',
                        lineHeight: 1.25,
                        minHeight: '28px',
                        fontWeight: item.estimado ? 800 : 500,
                      }}
                    >
                      {item.etiqueta}
                      {item.estimado ? ' (estimado)' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={panelStyle}>
              <h3 style={tituloPanelStyle}>Detalle del resultado</h3>
              <DetalleFila etiqueta="Método" valor="Promedio móvil simple" />
              <DetalleFila
                etiqueta="Periodo analizado"
                valor={`${formatearFecha(resultado.periodo_analizado.inicio)} al ${formatearFecha(
                  resultado.periodo_analizado.fin,
                )}`}
              />
              <DetalleFila
                etiqueta="Siguiente periodo"
                valor={`${formatearFecha(resultado.proximo_periodo.inicio)} al ${formatearFecha(
                  resultado.proximo_periodo.fin,
                )}`}
              />
              <DetalleFila
                etiqueta="Periodos utilizados"
                valor={`${resultado.periodos_solicitados}`}
              />
              <DetalleFila
                etiqueta="Resultado"
                valor={
                  resultado.demanda_estimada === null
                    ? 'No disponible'
                    : `${resultado.demanda_estimada} unidades estimadas`
                }
              />
              <div
                style={{
                  marginTop: '18px',
                  padding: '13px',
                  borderRadius: '9px',
                  backgroundColor: '#f8fafc',
                  color: '#64748b',
                  fontSize: '12px',
                  lineHeight: 1.5,
                }}
              >
                La cantidad mostrada es una estimación basada en las ventas registradas. No representa
                una venta garantizada.
              </div>
            </div>
          </section>

          <section style={panelStyle}>
            <h3 style={tituloPanelStyle}>Periodos utilizados en el cálculo</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '620px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                    <th style={thStyle}>N.º</th>
                    <th style={thStyle}>Inicio</th>
                    <th style={thStyle}>Fin</th>
                    <th style={thStyle}>Cantidad vendida</th>
                  </tr>
                </thead>
                <tbody>
                  {resultado.historial.map((periodo, indice) => (
                    <tr
                      key={periodo.periodo_inicio}
                      style={{ backgroundColor: indice % 2 === 0 ? '#ffffff' : '#f8fafc' }}
                    >
                      <td style={tdStyle}>{indice + 1}</td>
                      <td style={tdStyle}>{formatearFecha(periodo.periodo_inicio)}</td>
                      <td style={tdStyle}>{formatearFecha(periodo.periodo_fin)}</td>
                      <td style={{ ...tdStyle, fontWeight: 800, color: '#1e293b' }}>
                        {periodo.cantidad_vendida}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: '44px',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid #cbd5e1',
  backgroundColor: '#ffffff',
  color: '#1e293b',
  fontSize: '14px',
  boxSizing: 'border-box',
};

const panelStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  padding: '22px',
  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
  border: '1px solid #e2e8f0',
  minWidth: 0,
};

const tituloPanelStyle: React.CSSProperties = {
  margin: '0 0 8px',
  color: '#1e293b',
  fontSize: '18px',
  fontWeight: 800,
};

const thStyle: React.CSSProperties = {
  padding: '13px 14px',
  textAlign: 'left',
  fontSize: '13px',
};

const tdStyle: React.CSSProperties = {
  padding: '13px 14px',
  borderBottom: '1px solid #e2e8f0',
  color: '#475569',
  fontSize: '13px',
};

const ResumenCard = ({
  titulo,
  valor,
  detalle,
  color,
}: {
  titulo: string;
  valor: string;
  detalle: string;
  color: string;
}) => (
  <div
    style={{
      backgroundColor: '#ffffff',
      padding: '20px',
      borderRadius: '14px',
      borderLeft: `5px solid ${color}`,
      boxShadow: '0 4px 10px rgba(15, 23, 42, 0.08)',
      minHeight: '112px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}
  >
    <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>
      {titulo}
    </span>
    <strong style={{ color: '#1e293b', fontSize: '21px', marginTop: '8px' }}>{valor}</strong>
    <span style={{ color: '#64748b', fontSize: '12px', marginTop: '8px' }}>{detalle}</span>
  </div>
);

const DetalleFila = ({ etiqueta, valor }: { etiqueta: string; valor: string }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      gap: '14px',
      padding: '12px 0',
      borderBottom: '1px solid #e2e8f0',
    }}
  >
    <span style={{ color: '#64748b', fontSize: '13px' }}>{etiqueta}</span>
    <strong style={{ color: '#1e293b', fontSize: '13px', textAlign: 'right' }}>{valor}</strong>
  </div>
);

export default AnalisisPredictivo;
