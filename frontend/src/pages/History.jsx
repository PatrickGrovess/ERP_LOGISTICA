import { useEffect, useState, useMemo } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Inventory = () => {
    const { user } = useAuth();
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Estados para los selectores y existencias del modal
    const [productsList, setProductsList] = useState([]);
    const [locationsList, setLocationsList] = useState([]);
    const [stockSummary, setStockSummary] = useState([]);

    // Estado del modal de creación
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        product_id: '',
        location_id: '',
        type: 'INBOUND', // 'INBOUND' o 'OUTBOUND'
        quantity: 1
    });
    const [submitLoading, setSubmitLoading] = useState(false);
    const [formError, setFormError] = useState('');

    // Cargar historial de movimientos
    const fetchMovements = async () => {
        try {
            const response = await api.get('/inventory/movements');
            setMovements(response.data.data || []);
        } catch (err) {
            setError('Error al obtener el historial de movimientos.');
        } finally {
            setLoading(false);
        }
    };

    // Cargar listas de productos, ubicaciones y existencias de stock actuales
    const fetchOptions = async () => {
        try {
            const [prodRes, locRes, stockRes] = await Promise.all([
                api.get('/inventory/products'),
                api.get('/inventory/locations'),
                api.get('/inventory/stock')
            ]);

            const prods = Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data?.data || []);
            const locs = Array.isArray(locRes.data) ? locRes.data : (locRes.data?.data || []);
            const stocks = Array.isArray(stockRes.data) ? stockRes.data : (stockRes.data?.data || []);

            setProductsList(prods);
            setLocationsList(locs);
            setStockSummary(stocks);

            // Asignar primer elemento por defecto si existen
            if (prods.length > 0) {
                const firstProdId = prods[0].id;
                const matchedStock = stocks.find(s => Number(s.product_id) === Number(firstProdId));
                
                setFormData(prev => ({
                    ...prev,
                    product_id: firstProdId,
                    location_id: matchedStock?.location_id || (locs.length > 0 ? locs[0].id : '')
                }));
            }
        } catch (err) {
            console.error('Error al cargar datos auxiliares:', err);
        }
    };

    useEffect(() => {
        fetchMovements();
        fetchOptions();
    }, []);

    // Calcular stock actual y ubicación automática del producto seleccionado
    const selectedProductStockInfo = useMemo(() => {
        if (!formData.product_id) return { currentStock: 0, locationId: '' };
        const found = stockSummary.find(s => Number(s.product_id) === Number(formData.product_id));
        return {
            currentStock: Number(found?.current_stock || 0),
            locationId: found?.location_id || ''
        };
    }, [formData.product_id, stockSummary]);

    // Manejar cambio de producto para autoseleccionar su ubicación asociada en segundo plano
    const handleProductChange = (productId) => {
        const found = stockSummary.find(s => Number(s.product_id) === Number(productId));
        setFormData(prev => ({
            ...prev,
            product_id: productId,
            location_id: found?.location_id || prev.location_id
        }));
    };

    // Filtrar movimientos en tiempo real con el buscador
    const filteredMovements = useMemo(() => {
        return movements.filter(item => {
            const productName = item.product?.name?.toLowerCase() || '';
            const productSku = item.product?.sku?.toLowerCase() || '';
            const warehouse = item.location?.warehouse_code?.toLowerCase() || '';
            const query = searchTerm.toLowerCase().trim();

            return productName.includes(query) || productSku.includes(query) || warehouse.includes(query);
        });
    }, [movements, searchTerm]);

    // Manejar envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setSubmitLoading(true);

        try {
            await api.post('/inventory/movements', {
                product_id: Number(formData.product_id),
                location_id: Number(formData.location_id),
                quantity: Number(formData.quantity),
                type: formData.type
            });

            setShowModal(false);
            if (productsList.length > 0) {
                const firstProdId = productsList[0].id;
                const matchedStock = stockSummary.find(s => Number(s.product_id) === Number(firstProdId));
                setFormData({
                    product_id: firstProdId,
                    location_id: matchedStock?.location_id || (locationsList[0]?.id || ''),
                    type: 'INBOUND',
                    quantity: 1
                });
            }
            fetchMovements();
            fetchOptions(); // Actualizar stock general
        } catch (err) {
            const msg = err.response?.data?.message || 'Error al registrar el movimiento.';
            setFormError(msg);
        } finally {
            setSubmitLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex items-center space-x-3 text-gray-400">
                    <svg className="w-6 h-6 animate-spin text-[#FE2C55]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm font-medium">Cargando movimientos...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header de la sección */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-wide">Movimientos de Inventario</h1>
                    <p className="text-xs text-gray-400 mt-1">
                        Registro general de entradas y salidas de stock.
                    </p>
                </div>

                {/* Buscador y Botón de Registro */}
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
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
                            placeholder="Buscar por producto, SKU, almacén..."
                            className="w-full sm:w-64 pl-9 pr-4 py-2.5 bg-[#161B22] border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FE2C55] transition"
                        />
                    </div>

                    {(user?.role === 'staff' || user?.role === 'admin') && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center space-x-2 bg-[#FE2C55] hover:bg-[#e02447] text-white px-4 py-2.5 rounded-xl text-sm font-medium transition shadow-lg shadow-[#FE2C55]/20 cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Registrar Movimiento</span>
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm flex items-center space-x-2">
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            {/* Tabla de Movimientos */}
            <div className="bg-[#161B22] rounded-2xl border border-gray-800/80 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#0C1017]/50 border-b border-gray-800/80 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Producto</th>
                                <th className="px-6 py-4">Ubicación</th>
                                <th className="px-6 py-4">Tipo</th>
                                <th className="px-6 py-4">Cantidad</th>
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Fecha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/60 text-sm">
                            {filteredMovements.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                        No se encontraron movimientos registrados.
                                    </td>
                                </tr>
                            ) : (
                                filteredMovements.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-800/30 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs text-gray-400">
                                            #{item.id}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-white">
                                            {item.product?.name ? (
                                                <div>
                                                    <span>{item.product.name}</span>
                                                    {item.product?.sku && (
                                                        <span className="block text-[11px] font-mono text-gray-500">
                                                            SKU: {item.product.sku}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="font-mono text-gray-400">ID: #{item.product_id}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-300">
                                            {item.location?.warehouse_code ? (
                                                <span>{item.location.warehouse_code} (Pasillo {item.location.aisle})</span>
                                            ) : (
                                                <span className="font-mono text-gray-500">Ubicación #{item.location_id}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                                item.type === 'INBOUND'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                    : 'bg-[#FE2C55]/10 text-[#FE2C55] border border-[#FE2C55]/20'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${item.type === 'INBOUND' ? 'bg-emerald-400' : 'bg-[#FE2C55]'}`}></span>
                                                <span>{item.type === 'INBOUND' ? 'ENTRADA' : 'SALIDA'}</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-gray-200">
                                            {item.type === 'INBOUND' ? `+${item.quantity}` : `-${item.quantity}`}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-400">
                                            {item.user?.name || item.user?.username || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-400">
                                            {new Date(item.created_at).toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Registro de Movimiento */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
                        <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-800">
                            <h2 className="text-lg font-bold text-white">Nuevo Movimiento de Stock</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-white transition cursor-pointer"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {formError && (
                            <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2 rounded-xl text-xs flex items-center space-x-2">
                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{formError}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Desplegable de Producto */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                                    Producto
                                </label>
                                <select
                                    required
                                    value={formData.product_id}
                                    onChange={(e) => handleProductChange(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-[#0C1017] border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-[#FE2C55] transition cursor-pointer"
                                >
                                    <option value="" disabled>Seleccione un producto...</option>
                                    {productsList.map((prod) => (
                                        <option key={prod.id} value={prod.id}>
                                            {prod.name} {prod.sku ? `(${prod.sku})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Indicador de Stock Actual en Almacén */}
                            <div className="bg-gray-900/60 border border-gray-800 px-3.5 py-2 rounded-xl flex items-center justify-between text-xs">
                                <span className="text-gray-400 font-medium">Stock disponible actual:</span>
                                <span className="text-[#0DFC00] font-bold font-mono text-sm">
                                    {selectedProductStockInfo.currentStock} unidades
                                </span>
                            </div>

                            {/* Ubicación asignada automáticamente en segundo plano (Oculta al usuario) */}
                            <input type="hidden" value={formData.location_id} />

                            {/* Tipo de Movimiento */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                                    Tipo de Movimiento
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-[#0C1017] border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-[#FE2C55] transition cursor-pointer"
                                >
                                    <option value="INBOUND">Entrada (INBOUND)</option>
                                    <option value="OUTBOUND">Salida (OUTBOUND)</option>
                                </select>
                            </div>

                            {/* Cantidad */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                                    Cantidad
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-[#0C1017] border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FE2C55] transition"
                                />
                            </div>

                            {/* Botones */}
                            <div className="flex justify-end space-x-3 pt-3 border-t border-gray-800/80">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border border-gray-800 text-gray-300 rounded-xl text-xs font-semibold hover:bg-gray-800/50 transition cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitLoading}
                                    className="px-4 py-2 bg-[#FE2C55] text-white rounded-xl text-xs font-semibold hover:bg-[#e02447] disabled:opacity-50 transition shadow-lg shadow-[#FE2C55]/20 flex items-center space-x-2 cursor-pointer"
                                >
                                    {submitLoading ? (
                                        <>
                                            <svg className="w-3.5 h-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Guardando...</span>
                                        </>
                                    ) : (
                                        <span>Guardar</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;