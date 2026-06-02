import React, { useState, useEffect } from 'react';

interface ModalComunicacionProps {
  isOpen: boolean;
  onClose: () => void;
  datosPredefinidos: any;
  onEnviar: (data: any) => void;
}

const ModalComunicacion: React.FC<ModalComunicacionProps> = ({
  isOpen,
  onClose,
  datosPredefinidos,
  onEnviar,
}) => {
  const [destino, setDestino] = useState('');
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Cuando se abre el modal, auto-completamos los datos para que se vea profesional
  useEffect(() => {
    if (datosPredefinidos && isOpen) {
      setDestino(datosPredefinidos.correo_principal || 'cb.erik.espinoza.s@upds.net.bo');
      setAsunto(`Pedido de Reabastecimiento: ${datosPredefinidos.nombre_producto} - Super Valle Market`);
      
      const textoMensaje = `Estimado Proveedor,\n\nMediante la presente solicitamos formalmente el reabastecimiento del siguiente producto para el Super Valle Market:\n\n📦 Producto: ${datosPredefinidos.nombre_producto}\n🔢 Código: ${datosPredefinidos.codigo_barra || 'N/A'}\n📉 Nivel de Stock Actual: ${datosPredefinidos.cantidad_actual || 0} unidades.\n\nPor favor, confirme la disponibilidad y el tiempo estimado de entrega haciendo clic en el botón de confirmación que aparece abajo.\n\nAtentamente,\nAdministración Super Valle Market`;
      
      setMensaje(textoMensaje);
    }
  }, [datosPredefinidos, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onEnviar({
      destino,
      asunto,
      mensaje,
      proveedor_id: datosPredefinidos?.proveedor_id || 1,
      solicitud_compra_id: null
    });
  };

  return (
    // 🔥 Z-INDEX: 9999 garantiza que siempre esté por encima del otro modal
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(15, 23, 42, 0.7)', // Fondo oscuro elegante
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 9999, backdropFilter: 'blur(4px)' 
    }}>
      <div style={{
        backgroundColor: '#ffffff', width: '100%', maxWidth: '550px',
        borderRadius: '12px', padding: '0', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column'
      }}>
        
        {/* Cabecera del Modal */}
        <div style={{ backgroundColor: '#2563eb', padding: '20px', color: 'white' }}>
          <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            ✉️ Redactar Pedido al Proveedor
          </h3>
        </div>

        {/* Cuerpo del Formulario */}
        <form onSubmit={handleSubmit} style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '5px' }}>Para (Correo del Proveedor):</label>
            <input 
              type="email" 
              value={destino} 
              onChange={(e) => setDestino(e.target.value)} 
              required
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', backgroundColor: '#f8fafc' }}
            />
            <span style={{ fontSize: '11px', color: '#64748b' }}>* Por restricciones de la nube, se enviará a tu correo de la UPDS.</span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '5px' }}>Asunto:</label>
            <input 
              type="text" 
              value={asunto} 
              onChange={(e) => setAsunto(e.target.value)} 
              required
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '5px' }}>Cuerpo del Mensaje:</label>
            <textarea 
              value={mensaje} 
              onChange={(e) => setMensaje(e.target.value)} 
              required
              rows={8}
              style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' }}
            />
          </div>

          {/* Botones de Acción */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px', paddingTop: '15px', borderTop: '1px solid #e2e8f0' }}>
            <button 
              type="button" 
              onClick={onClose}
              style={{ padding: '10px 20px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}
            >
              Cancelar
            </button>
            <button 
              type="submit"
              style={{ padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' }}
            >
              🚀 Enviar Pedido
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default ModalComunicacion;
