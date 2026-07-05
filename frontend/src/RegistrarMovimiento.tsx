import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const RegistrarMovimiento: React.FC = () => {
  const [productoId, setProductoId] = useState('');
  const [tipo, setTipo] = useState('ingreso_compra');
  const [cantidad, setCantidad] = useState(1);
  const queryClient = useQueryClient();

  const { data: productos } = useQuery({
    queryKey: ['productos'],
    queryFn: async () =>
      (await axios.get('https://gestion-comercial-j3ed.onrender.com/productos')).data,
  });

  const estiloToast = {
    borderRadius: '12px',
    fontWeight: '600',
    boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
  };

  const mostrarConfirmacion = (mensaje: string): Promise<boolean> => {
    return new Promise((resolve) => {
      toast.custom(
        (t) => (
          <div
            style={{
              background: '#ffffff',
              padding: '18px',
              borderRadius: '16px',
              boxShadow: '0 12px 30px rgba(0,0,0,0.18)',
              border: '1px solid #e2e8f0',
              width: '330px',
            }}
          >
            <div
              style={{
                fontWeight: '800',
                color: '#0f172a',
                marginBottom: '8px',
                fontSize: '16px',
              }}
            >
              Confirmar movimiento
            </div>

            <div
              style={{
                color: '#475569',
                fontSize: '14px',
                marginBottom: '15px',
                lineHeight: '1.4',
              }}
            >
              {mensaje}
            </div>

            <div
              style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(false);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  cursor: 'pointer',
                  fontWeight: '700',
                }}
              >
                Cancelar
              </button>

              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(true);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#10b981',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '700',
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        ),
        {
          duration: Infinity,
        }
      );
    });
  };

  const mutation = useMutation({
    mutationFn: (nuevoMov: any) =>
      axios.post('https://gestion-comercial-j3ed.onrender.com/movimientos', nuevoMov),

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['productos'] });
      await queryClient.invalidateQueries({ queryKey: ['movimientos'] });

      setCantidad(1);
      setProductoId('');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productoId) {
      toast.error('Debes seleccionar un producto', {
        icon: '⚠️',
        style: {
          ...estiloToast,
          background: '#fee2e2',
          color: '#991b1b',
        },
      });
      return;
    }

    if (cantidad <= 0) {
      toast.error('La cantidad debe ser mayor a 0', {
        icon: '⚠️',
        style: {
          ...estiloToast,
          background: '#fee2e2',
          color: '#991b1b',
        },
      });
      return;
    }

    if (mutation.isPending) return;

    const mensaje =
      tipo === 'traspaso_estante'
        ? `¿Confirmas mover ${cantidad} unidades a los estantes de la tienda?`
        : tipo === 'ingreso_compra'
        ? `¿Confirmas registrar la compra de ${cantidad} unidades?`
        : `¿Confirmas registrar la salida o pérdida de ${cantidad} unidades?`;

    const confirmado = await mostrarConfirmacion(mensaje);

    if (!confirmado) {
      toast('Operación cancelada', {
        icon: 'ℹ️',
        style: {
          ...estiloToast,
          background: '#f8fafc',
          color: '#334155',
        },
      });
      return;
    }

    try {
      await toast.promise(
        mutation.mutateAsync({
          producto_id: productoId,
          tipo_movimiento: tipo,
          cantidad,
        }),
        {
          loading: 'Registrando movimiento...',
          success:
            tipo === 'traspaso_estante'
              ? 'Mercadería movida al estante correctamente'
              : tipo === 'ingreso_compra'
              ? 'Compra registrada correctamente'
              : 'Salida registrada correctamente',
          error: (error: any) =>
            error?.response?.data?.error || 'Error al registrar el movimiento',
        },
        {
          style: {
            ...estiloToast,
          },
          success: {
            icon: '✅',
            style: {
              ...estiloToast,
              background: '#dcfce7',
              color: '#166534',
            },
          },
          error: {
            icon: '❌',
            style: {
              ...estiloToast,
              background: '#fee2e2',
              color: '#991b1b',
            },
          },
          loading: {
            icon: '⏳',
            style: {
              ...estiloToast,
              background: '#eff6ff',
              color: '#1d4ed8',
            },
          },
        }
      );
    } catch (error) {
      console.error('Error registrando movimiento:', error);
    }
  };

  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        borderTop: '4px solid #3b82f6',
      }}
    >
      <h3 style={{ marginTop: 0, color: '#1e293b' }}>
        Gestión Rápida de Stock
      </h3>

      <p
        style={{
          fontSize: '13px',
          color: '#64748b',
          marginBottom: '15px',
        }}
      >
        Registra compras o mueve mercadería al área de ventas.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
        }}
      >
        <select
          value={productoId}
          onChange={(e) => setProductoId(e.target.value)}
          style={{
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            width: '100%',
            fontSize: '14px',
          }}
        >
          <option value="">-- Selecciona un Producto --</option>

          {productos?.map((p: any) => (
            <option key={p.producto_id} value={p.producto_id}>
              {p.nombre_producto} (Bodega: {p.stock_bodega || 0} | Estante:{' '}
              {p.stock_estante || 0})
            </option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              flex: 2,
              fontSize: '14px',
            }}
          >
            <option value="ingreso_compra">📥 Comprar (Entra a Bodega)</option>
            <option value="traspaso_estante">🔄 Mover a Estante (Tienda)</option>
            <option value="salida_venta">📉 Ajuste / Pérdida (-)</option>
          </select>

          <input
            type="number"
            value={cantidad}
            onChange={(e) => setCantidad(Number(e.target.value))}
            min="1"
            placeholder="Cant."
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              flex: 1,
              fontSize: '14px',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          style={{
            padding: '12px',
            backgroundColor: mutation.isPending
              ? '#94a3b8'
              : tipo === 'traspaso_estante'
              ? '#3b82f6'
              : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: mutation.isPending ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '15px',
            transition: 'background-color 0.3s',
          }}
        >
          {mutation.isPending
            ? 'Procesando...'
            : tipo === 'traspaso_estante'
            ? '🔄 Confirmar Traspaso'
            : 'Guardar Registro'}
        </button>
      </form>
    </div>
  );
};

export default RegistrarMovimiento;