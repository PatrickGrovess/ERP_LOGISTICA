import { useEffect, useState, useMemo } from 'react';
import api from '../api/axios';

const InventoryStock = () => {
    const [stockData, setStockData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Estado para controlar el Modal de Add Item
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Campos del formulario unificado
    const [formData, setFormData] = useState({
        // Producto
        sku: '',
        name: '',
        unit_of_measure: 'kg',
        unit_price: '',
        // Ubicación
        warehouse_code: '',
        aisle: '',
        shelf: '',
        level: '',
        // Movimiento de Stock
        type: 'INBOUND',
        quantity: '',
        reference_type: 'MANUAL_ADJUSTMENT'
    });

    const fetchStock = async () => {
        try {
            const response = await api.get('/inventory/stock');
            const rawData = Array.isArray(response.data)
                ? response.data
                : (response.data?.data || []);
            setStockData(rawData);
        } catch (err) {
            console.error('Error fetching stock data:', err);
            setError('No se pudo cargar la información del inventario.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStock();
    }, []);

    // Manejar envío del formulario para crear Producto, Ubicación y Movimiento
    const handleAddItem = async (e) => {
        e.preventDefault();
        setFormError('');
        setSubmitting(true);

        try {
            // 1. Crear el Producto (Asegurando unit_price como número decimal)
            const productRes = await api.post('/inventory/products', {
                sku: formData.sku,
                name: formData.name,
                unit_of_measure: formData.unit_of_measure,
                unit_price: Number(formData.unit_price) || 0.00
            });
            const productId = productRes.data.data?.id || productRes.data.id;

            // 2. Crear la Ubicación
            const locationRes = await api.post('/inventory/locations', {
                warehouse_code: formData.warehouse_code,
                aisle: formData.aisle,
                shelf: formData.shelf,
                level: formData.level
            });
            const locationId = locationRes.data.data?.id || locationRes.data.id;

            // 3. Registrar el Movimiento de Stock
            await api.post('/inventory/movements', {
                product_id: productId,
                location_id: locationId,
                type: formData.type,
                quantity: Number(formData.quantity),
                reference_type: formData.reference_type
            });

            // Cerrar modal, limpiar y recargar datos
            setIsModalOpen(false);
            setFormData({
                sku: '',
                name: '',
                unit_of_measure: 'kg',
                unit_price: '',
                warehouse_code: '',
                aisle: '',
                shelf: '',
                level: '',
                type: 'INBOUND',
                quantity: '',
                reference_type: 'MANUAL_ADJUSTMENT'
            });
            fetchStock();
        } catch (err) {
            console.error('Error al registrar el item:', err);
            const msg = err.response?.data?.message || 'Error al procesar el registro completo.';
            setFormError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    // Filtrado en tiempo real por búsqueda
    const filteredStock = useMemo(() => {
        return stockData.filter((item) => {
            const productName = item.product?.name?.toLowerCase() || '';
            const productSku = item.product?.sku?.toLowerCase() || '';
            const warehouse = item.location?.warehouse_code?.toLowerCase() || '';
            const query = searchTerm.toLowerCase().trim();

            return productName.includes(query) || productSku.includes(query) || warehouse.includes(query);
        });
    }, [stockData, searchTerm]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="w-10 h-10 border-4 border-gray-800 border-t-[#FE2C55] rounded-full animate-spin"></div>
                <span className="text-sm font-medium text-gray-400 tracking-wide">
                    Cargando existencias...
                </span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm text-center">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6 text-gray-200 font-sans">
            {/* Header del Inventario con Acciones y Búsqueda */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Inventario</h1>
                    <p className="text-xs text-gray-400 mt-1">
                        {filteredStock.length} de {stockData.length} items · Existencias registradas
                    </p>
                </div>

                {/* Buscador y Botón Añadir */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 sm:flex-none">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por nombre, SKU, almacén..."
                            className="w-full sm:w-64 pl-9 pr-4 py-2 bg-[#161B22] border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FE2C55] transition"
                        />
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-[#FE2C55] hover:bg-[#e02649] text-white font-medium text-xs py-2 px-4 rounded-xl transition duration-200 flex items-center space-x-1.5 shadow-lg shadow-[#FE2C55]/20 cursor-pointer"
                    >
                        <span className="text-sm font-bold">+</span>
                        <span>Añadir producto</span>
                    </button>
                </div>
            </div>

            {/* Tabla de Inventario (Adaptativa) */}
            <div className="bg-[#161B22] border border-gray-800/80 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-gray-800/80 text-gray-400 uppercase tracking-wider font-semibold bg-[#0C1017]/40">
                                <th className="px-4 py-3.5">ITEM</th>
                                <th className="px-4 py-3.5">SKU / ID</th>
                                <th className="px-4 py-3.5">UBICACIÓN</th>
                                <th className="px-4 py-3.5">MEDIDA</th>
                                <th className="px-4 py-3.5">PRECIO</th>
                                <th className="px-4 py-3.5">STOCK</th>
                                <th className="px-4 py-3.5 text-right">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50 text-gray-300">
                            {filteredStock.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                                        No se encontraron productos en el inventario.
                                    </td>
                                </tr>
                            ) : (
                                filteredStock.map((item, index) => {
                                    const currentStock = Number(item.current_stock || 0);
                                    const isLowStock = currentStock <= 10;
                                    const productName = item.product?.name || 'Producto sin nombre';
                                    const sku = item.product?.sku || `ID-${item.product_id}`;
                                    const unit = item.product?.unit_of_measure || 'units';

                                    const rawPrice = item.product?.unit_price ?? item.unit_price ?? 0;
                                    const priceFormatted = new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: 'USD'
                                    }).format(rawPrice);

                                    const locationStr = item.location
                                        ? `${item.location.warehouse_code} (${item.location.aisle}-${item.location.shelf}-${item.location.level})`
                                        : 'Sin Ubicación';

                                    return (
                                        <tr key={item.product_id || index} className="hover:bg-gray-800/30 transition-colors">
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 rounded-lg bg-[#FE2C55]/10 border border-[#FE2C55]/20 text-[#FE2C55] flex items-center justify-center shrink-0">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-white truncate max-w-[200px]" title={productName}>
                                                            {productName}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500">
                                                            Entradas: {item.total_inbound} · Salidas: {item.total_outbound}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className="bg-gray-800/80 text-gray-300 font-mono text-[11px] px-2 py-0.5 rounded border border-gray-700/60">
                                                    {sku}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-gray-400 font-mono text-[11px]">
                                                {locationStr}
                                            </td>
                                            <td className="px-4 py-3.5 text-gray-400 capitalize">
                                                {unit}
                                            </td>
                                            <td className="px-4 py-3.5 font-semibold text-white font-mono">
                                                {priceFormatted}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                                                    isLowStock
                                                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                        : 'bg-[#05FF00]/10 text-[#05FF00] border border-[#05FF00]/20'
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${isLowStock ? 'bg-amber-400' : 'bg-[#05FF00]'}`}></span>
                                                    <span>
                                                        {isLowStock ? `Stock bajo · ${currentStock}` : `Stock (Alto) · ${currentStock}`}
                                                    </span>
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button title="Editar Producto" className="p-1.5 text-gray-400 hover:text-white bg-gray-800/60 hover:bg-gray-700 rounded-lg border border-gray-700/50 transition cursor-pointer">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button title="Eliminar Producto" className="p-1.5 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg border border-red-500/20 transition cursor-pointer">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL ADD ITEM (Producto + Ubicación + Stock) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-[#161B22] border border-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 my-8">
                        <div className="flex justify-between items-center border-b border-gray-800 pb-4">
                            <h2 className="text-lg font-bold text-white uppercase tracking-wide">Añadir Nuevo Item al Inventario</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-white p-1 rounded-lg cursor-pointer"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {formError && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs text-center">
                                {formError}
                            </div>
                        )}

                        <form onSubmit={handleAddItem} className="space-y-4">
                            {/* Sección Producto */}
                            <div>
                                <p className="text-[11px] font-semibold text-[#FE2C55] uppercase tracking-wider mb-2">1. Datos del Producto</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] text-gray-400 mb-1 uppercase">SKU</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Ej. QUESO-01"
                                            value={formData.sku}
                                            onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                                            className="w-full px-3 py-2 bg-[#0C1017] border border-gray-800 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#FE2C55]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-400 mb-1 uppercase">Nombre</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Ej. Queso Cheddar"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-3 py-2 bg-[#0C1017] border border-gray-800 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#FE2C55]"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-3">
                                    <div>
                                        <label className="block text-[10px] text-gray-400 mb-1 uppercase">Unidad de Medida</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Ej. kg, unidades, litros"
                                            value={formData.unit_of_measure}
                                            onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
                                            className="w-full px-3 py-2 bg-[#0C1017] border border-gray-800 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#FE2C55]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-bold text-[10px] text-[#0DFC00] mb-1 uppercase">Precio <span className="text-[9px] text-gray-400">(Entero o Decimal)</span></label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Ej. 35.75"
                                            value={formData.unit_price}
                                            onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                                            className="w-full px-3 py-2 bg-[#0C1017] border border-gray-800 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#FE2C55]"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Sección Ubicación */}
                            <div className="pt-2 border-t border-gray-800">
                                <p className="text-[11px] font-semibold text-[#FE2C55] uppercase tracking-wider mb-2">2. Ubicación Física (Almacén)</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] text-gray-400 mb-1 uppercase">Almacén</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Ej. Avenida central"
                                            value={formData.warehouse_code}
                                            onChange={(e) => setFormData({ ...formData, warehouse_code: e.target.value.toUpperCase() })}
                                            className="w-full px-3 py-2 bg-[#0C1017] border border-gray-800 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#FE2C55]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-400 mb-1 uppercase">Pasillo (Aisle)</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Ej. 01"
                                            value={formData.aisle}
                                            onChange={(e) => setFormData({ ...formData, aisle: e.target.value })}
                                            className="w-full px-3 py-2 bg-[#0C1017] border border-gray-800 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#FE2C55]"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-3">
                                    <div>
                                        <label className="block text-[10px] text-gray-400 mb-1 uppercase">Estante (Shelf)</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Ej. B | Ej. 1"
                                            value={formData.shelf}
                                            onChange={(e) => setFormData({ ...formData, shelf: e.target.value.toUpperCase() })}
                                            className="w-full px-3 py-2 bg-[#0C1017] border border-gray-800 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#FE2C55]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-400 mb-1 uppercase">Nivel (Level)</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Ej. 03"
                                            value={formData.level}
                                            onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                            className="w-full px-3 py-2 bg-[#0C1017] border border-gray-800 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#FE2C55]"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Sección Movimiento de Stock */}
                            <div className="pt-2 border-t border-gray-800">
                                <p className="text-[11px] font-semibold text-[#FE2C55] uppercase tracking-wider mb-2">3. Cantidad Inicial (Stock)</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] text-gray-400 mb-1 uppercase">Tipo</label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            className="w-full px-3 py-2 bg-[#0C1017] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#FE2C55] cursor-pointer"
                                        >
                                            <option value="INBOUND">Entrada (INBOUND)</option>
                                            <option value="OUTBOUND">Salida (OUTBOUND)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-400 mb-1 uppercase">Cantidad</label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            placeholder="Ej. 50"
                                            value={formData.quantity}
                                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                            className="w-full px-3 py-2 bg-[#0C1017] border border-gray-800 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#FE2C55]"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-1/2 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold uppercase transition cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-1/2 py-2.5 bg-[#FE2C55] hover:bg-[#e02447] text-white rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-50 transition shadow-lg shadow-[#FE2C55]/20 cursor-pointer"
                                >
                                    {submitting ? 'Guardando...' : 'Crear Registro'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryStock;