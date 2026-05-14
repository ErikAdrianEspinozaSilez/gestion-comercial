import React, { useState, useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    datosPredefinidos: any;
    onEnviar: (formData: any) => void;
}

const ModalComunicacion: React.FC<ModalProps> = ({ isOpen, onClose, datosPredefinidos, onEnviar }) => {
    const [formData, setFormData] = useState({
        destino: '',
        asunto: 'Pedido de Reabastecimiento urgente - Super Valle Market',
        mensaje: '',
        proveedor_id: null
    });

    useEffect(() => {
        if (datosPredefinidos) {
            setFormData({
                destino: datosPredefinidos.correo_principal || '',
                asunto: `Pedido urgente: ${datosPredefinidos.nombre_producto} - Super Valle`,
                mensaje: `Estimados,\n\nSolicitamos el reabastecimiento del producto: ${datosPredefinidos.nombre_producto}.\n\nNuestro stock actual es de ${datosPredefinidos.cantidad_actual} unidades, por debajo del mínimo de ${datosPredefinidos.stock_minimo}.\n\nEsperamos su respuesta.\n\nAtte.\nAdministración Super Valle`,
                proveedor_id: datosPredefinidos.proveedor_id
            });
        }
    }, [datosPredefinidos, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
                <div className="flex justify-between items-center mb-4 pb-2 border-b">
                    <h3 className="text-xl font-semibold text-gray-800">Notificar Stock Bajo</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); onEnviar(formData); }} className="space-y-4">
                    <input 
                        className="w-full border p-2 rounded" 
                        placeholder="Correo Proveedor"
                        value={formData.destino}
                        onChange={e => setFormData({...formData, destino: e.target.value})}
                    />
                    <input 
                        className="w-full border p-2 rounded" 
                        placeholder="Asunto"
                        value={formData.asunto}
                        onChange={e => setFormData({...formData, asunto: e.target.value})}
                    />
                    <textarea 
                        className="w-full border p-2 rounded h-40" 
                        value={formData.mensaje}
                        onChange={e => setFormData({...formData, mensaje: e.target.value})}
                    />
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="bg-gray-200 px-4 py-2 rounded">Cancelar</button>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Enviar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalComunicacion;