import { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { INVENTORY_UNITS, getInventoryUnitLabel, isDiscreteInventoryUnit } from '../constants/inventory';

const InventoryStock = () => {
    const location = useLocation();
    const { user, tenant } = useAuth();
    const lowStockThreshold = Number(tenant?.low_stock_threshold ?? 10);
    const [stockData, setStockData] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState(location.state?.searchQuery || '');
    const canManageProducts = ['staff', 'admin'].includes(user?.role);

    // Estado para controlar el Modal de Add Item
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [editForm, setEditForm] = useState({ sku: '', name: '', description: '', category_id: '', unit_of_measure: '', unit_price: '', storage_condition: 'ambient', storage_notes: '' });
    const [editError, setEditError] = useState('');
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [categoryError, setCategoryError] = useState('');
    const [addingCategory, setAddingCategory] = useState(false);

    // Campos del formulario unificado
    const [formData, setFormData] = useState({
        // Producto
        sku: '',
        name: '',
        category_id: '',
        unit_of_measure: 'kg',
        unit_price: '',
        storage_condition: 'ambient',
        storage_notes: '',
        // Ubicación
        warehouse_code: '',
        aisle: '',
        shelf: '',
        level: '',
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

    const fetchCategories = async () => {
        try {
            const response = await api.get('/inventory/categories');
            const list = Array.isArray(response.data) ? response.data : (response.data?.data || []);
            setCategories(list);
        } catch (err) {
            console.error('Error al cargar el catálogo de productos:', err);
        }
    };

    useEffect(() => {
        fetchStock();
        fetchCategories();
    }, []);

    useEffect(() => {
        setSearchTerm(location.state?.searchQuery || '');
    }, [location.key]);

    // Crear el producto, reutilizar o crear la ubicación y registrar la entrada inicial en una transacción.
    const handleAddItem = async (e) => {
        e.preventDefault();
        setFormError('');
        setSubmitting(true);

        try {
            await api.post('/inventory/items', {
                sku: formData.sku,
                name: formData.name,
                category_id: formData.category_id ? Number(formData.category_id) : null,
                unit_of_measure: formData.unit_of_measure,
                unit_price: formData.unit_price,
                storage_condition: formData.storage_condition,
                storage_notes: formData.storage_notes,
                warehouse_code: formData.warehouse_code,
                aisle: formData.aisle,
                shelf: formData.shelf,
                level: formData.level,
                quantity: Number(formData.quantity),
                reference_type: formData.reference_type,
            });

            // Cerrar modal, limpiar y recargar datos
            setIsModalOpen(false);
            setFormData({
                sku: '',
                name: '',
                category_id: '',
                unit_of_measure: 'kg',
                unit_price: '',
                storage_condition: 'ambient',
                storage_notes: '',
                warehouse_code: '',
                aisle: '',
                shelf: '',
                level: '',
                quantity: '',
                reference_type: 'MANUAL_ADJUSTMENT'
            });
            await fetchStock();
        } catch (err) {
            console.error('Error al registrar el item:', err);
            const validationErrors = Object.values(err.response?.data?.errors || {}).flat();
            const msg = validationErrors[0] || err.response?.data?.message || 'Error al procesar el registro completo.';
            setFormError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleGenerateSku = () => {
        const firstWord = formData.name.trim().split(/\s+/)[0] || 'ITEM';
        const prefix = firstWord.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12) || 'ITEM';
        const bytes = new Uint8Array(3);
        if (globalThis.crypto?.getRandomValues) {
            globalThis.crypto.getRandomValues(bytes);
        } else {
            bytes.forEach((_, index) => { bytes[index] = Math.floor(Math.random() * 256); });
        }
        const suffix = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
        setFormData((current) => ({ ...current, sku: `${prefix}-${suffix}` }));
    };

    const handleAddCategory = async () => {
        const name = newCategoryName.trim();
        if (!name) return;
        setCategoryError('');
        setAddingCategory(true);
        try {
            const response = await api.post('/inventory/categories', { name });
            const category = response.data?.data;
            if (category) {
                setCategories((current) => [...current, category].sort((a, b) => a.name.localeCompare(b.name, 'es')));
                setFormData((current) => ({ ...current, category_id: String(category.id) }));
                setEditForm((current) => ({ ...current, category_id: String(category.id) }));
            }
            setNewCategoryName('');
        } catch (err) {
            const validationErrors = Object.values(err.response?.data?.errors || {}).flat();
            setCategoryError(validationErrors[0] || err.response?.data?.message || 'No se pudo crear la categoría.');
        } finally {
            setAddingCategory(false);
        }
    };

    const openEditProduct = (product) => {
        setEditingProduct(product);
        setEditForm({
            sku: product.sku || '',
            name: product.name || '',
            description: product.description || '',
            category_id: product.category_id ? String(product.category_id) : '',
            unit_of_measure: product.unit_of_measure || 'unidades',
            unit_price: product.unit_price ?? '0.00',
            storage_condition: product.storage_condition || 'ambient',
            storage_notes: product.storage_notes || '',
        });
        setEditError('');
    };

    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        if (!editingProduct) return;
        setEditError('');
        setEditSubmitting(true);

        try {
            await api.put(`/inventory/products/${editingProduct.id}`, {
                ...editForm,
                category_id: editForm.category_id ? Number(editForm.category_id) : null,
            });
            setEditingProduct(null);
            await fetchStock();
        } catch (err) {
            const validationErrors = Object.values(err.response?.data?.errors || {}).flat();
            setEditError(validationErrors[0] || err.response?.data?.message || 'No se pudo actualizar el producto.');
        } finally {
            setEditSubmitting(false);
        }
    };

    const handleDeleteProduct = async (product) => {
        const confirmed = window.confirm(
            `¿Eliminar ${product.name}? Se conservarán sus movimientos anteriores. Solo se puede eliminar si su stock actual es cero.`
        );
        if (!confirmed) return;

        try {
            await api.delete(`/inventory/products/${product.id}`);
            await fetchStock();
        } catch (err) {
            window.alert(err.response?.data?.message || 'No se pudo eliminar el producto.');
        }
    };

    // Filtrado en tiempo real por búsqueda
    const filteredStock = useMemo(() => {
        return stockData.filter((item) => {
            const productName = item.product?.name?.toLowerCase() || '';
            const productSku = item.product?.sku?.toLowerCase() || '';
            const categoryName = item.product?.category?.name?.toLowerCase() || '';
            const storageCondition = item.product?.storage_condition?.toLowerCase() || '';
            const storageNotes = item.product?.storage_notes?.toLowerCase() || '';
            const warehouse = item.location?.warehouse_code?.toLowerCase() || '';
            const query = searchTerm.toLowerCase().trim();

            return productName.includes(query) || productSku.includes(query) || categoryName.includes(query)
                || storageCondition.includes(query) || storageNotes.includes(query) || warehouse.includes(query);
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
                            placeholder="Buscar por nombre, SKU, catálogo o almacén..."
                            className="w-full sm:w-64 pl-9 pr-4 py-2 bg-[#161B22] border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FE2C55] transition"
                        />
                    </div>

                    {canManageProducts && (
                        <button
                            onClick={() => { setIsModalOpen(true); setFormError(''); setCategoryError(''); }}
                            className="bg-[#FE2C55] hover:bg-[#e02649] text-white font-medium text-xs py-2 px-4 rounded-xl transition duration-200 flex items-center space-x-1.5 shadow-lg shadow-[#FE2C55]/20 cursor-pointer"
                        >
                            <span className="text-sm font-bold">+</span>
                            <span>Añadir producto</span>
                        </button>
                    )}
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
                                {canManageProducts && <th className="px-4 py-3.5 text-right">ACCIONES</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50 text-gray-300">
                            {filteredStock.length === 0 ? (
                                <tr>
                                    <td colSpan={canManageProducts ? 7 : 6} className="px-6 py-8 text-center text-gray-500">
                                        No se encontraron productos en el inventario.
                                    </td>
                                </tr>
                            ) : (
                                filteredStock.map((item, index) => {
                                    const currentStock = Number(item.current_stock || 0);
                                    const isLowStock = currentStock <= lowStockThreshold;
                                    const productName = item.product?.name || 'Producto sin nombre';
                                    const sku = item.product?.sku || `ID-${item.product_id}`;
                                    const unit = getInventoryUnitLabel(item.product?.unit_of_measure);
                                    const categoryName = item.product?.category?.name || 'Sin categoría';
                                    const storageLabel = {
                                        ambient: 'Ambiente',
                                        refrigerated: 'Refrigerado',
                                        frozen: 'Congelado',
                                        special: 'Conservación especial',
                                    }[item.product?.storage_condition] || 'Ambiente';
                                    const stockFormatted = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 3 }).format(currentStock);
                                    const inboundFormatted = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 3 }).format(Number(item.total_inbound || 0));
                                    const outboundFormatted = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 3 }).format(Number(item.total_outbound || 0));

                                    const rawPrice = item.product?.unit_price ?? item.unit_price ?? 0;
                                    const priceFormatted = new Intl.NumberFormat('es-CO', {
                                        style: 'currency',
                                        currency: tenant?.currency || 'USD',
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    }).format(Number(rawPrice) || 0);

                                    const locationStr = item.location
                                        ? `${item.location.warehouse_code} (${item.location.aisle}-${item.location.shelf}-${item.location.level})`
                                        : 'Sin Ubicación';

                                    return (
                                        <tr key={`${item.product_id}-${item.location_id || index}`} className="hover:bg-gray-800/30 transition-colors">
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
                                                        <span className="text-[10px] text-sky-300/80">{categoryName} · {storageLabel}</span>
                                                        <span className="text-[10px] text-gray-500">
                                                            Entradas: {inboundFormatted} · Salidas: {outboundFormatted}
                                                            {item.product?.storage_condition === 'special' && item.product?.storage_notes ? ` · ${item.product.storage_notes}` : ''}
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
                                                        {isLowStock ? `Stock bajo · ${stockFormatted} ${unit}` : `Stock disponible · ${stockFormatted} ${unit}`}
                                                    </span>
                                                </span>
                                            </td>
                                            {canManageProducts && (
                                                <td className="px-4 py-3.5">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditProduct(item.product)}
                                                            aria-label={`Editar ${productName}`}
                                                            title="Editar producto"
                                                            className="rounded-lg border border-gray-700 p-2 text-gray-300 hover:border-sky-400/50 hover:text-sky-300 transition"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m16.862 4.487 2.651 2.651M8 16l3.5-.5L19.5 7.5a1.879 1.879 0 0 0-2.657-2.657L8.5 13.5 8 16ZM5 20h14" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteProduct(item.product)}
                                                            aria-label={`Eliminar ${productName}`}
                                                            title="Eliminar producto"
                                                            className="rounded-lg border border-gray-700 p-2 text-gray-300 hover:border-red-400/50 hover:text-red-300 transition"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 7h12m-10 0 .5 13h7L16 7M9 7V4h6v3m-5 3v6m4-6v6" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
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
                    <div className="bg-[#161B22] border border-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5 my-8">
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
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                required
                                                maxLength="255"
                                                placeholder="Ej. QUESO-A1B2C3"
                                                value={formData.sku}
                                                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                                                className="min-w-0 flex-1 px-3 py-2 bg-[#0C1017] border border-gray-800 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#FE2C55]"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleGenerateSku}
                                                disabled={!formData.name.trim()}
                                                className="shrink-0 px-2.5 py-2 bg-gray-800 border border-gray-700 rounded-xl text-[10px] font-semibold text-gray-200 hover:border-[#FE2C55]/60 disabled:opacity-40 disabled:cursor-not-allowed"
                                                title="Generar un SKU con el nombre del producto"
                                            >
                                                Generar
                                            </button>
                                        </div>
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
                                <div className="mt-3">
                                    <label className="block text-[10px] text-gray-400 mb-1 uppercase">Catálogo</label>
                                    <select
                                        required
                                        value={formData.category_id}
                                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                        className="w-full px-3 py-2 bg-[#0C1017] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#FE2C55]"
                                    >
                                        <option value="" disabled>Selecciona una categoría...</option>
                                        {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                                    </select>
                                    <div className="flex gap-2 mt-2">
                                        <input
                                            type="text"
                                            maxLength="80"
                                            value={newCategoryName}
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                            placeholder="Añadir una categoría propia"
                                            className="min-w-0 flex-1 px-3 py-2 bg-[#0C1017] border border-gray-800 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#FE2C55]"
                                        />
                                        <button type="button" onClick={handleAddCategory} disabled={addingCategory || !newCategoryName.trim()} className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-[10px] font-semibold text-gray-200 hover:border-sky-400/50 disabled:opacity-40">
                                            {addingCategory ? 'Añadiendo…' : '+ Categoría'}
                                        </button>
                                    </div>
                                    {categoryError && <p className="text-[10px] text-red-400 mt-1">{categoryError}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-3">
                                    <div>
                                        <label className="block text-[10px] text-gray-400 mb-1 uppercase">Unidad de Medida</label>
                                        <select
                                            required
                                            value={formData.unit_of_measure}
                                            onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
                                            className="w-full px-3 py-2 bg-[#0C1017] border border-gray-800 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#FE2C55]"
                                        >
                                            {INVENTORY_UNITS.map((unitOption) => <option key={unitOption.value} value={unitOption.value}>{unitOption.label}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block font-bold text-[10px] text-[#0DFC00] mb-1 uppercase">Precio por unidad <span className="text-[9px] text-gray-400">(hasta 2 decimales)</span></label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            required
                                            placeholder="Ej. 2.49"
                                            value={formData.unit_price}
                                            onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                                            className="w-full px-3 py-2 bg-[#0C1017] border border-gray-800 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#FE2C55]"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-3">
                                    <div>
                                        <label className="block text-[10px] text-gray-400 mb-1 uppercase">Conservación</label>
                                        <select value={formData.storage_condition} onChange={(e) => setFormData({ ...formData, storage_condition: e.target.value })} className="w-full px-3 py-2 bg-[#0C1017] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#FE2C55]">
                                            <option value="ambient">Temperatura ambiente</option>
                                            <option value="refrigerated">Refrigerado</option>
                                            <option value="frozen">Congelado</option>
                                            <option value="special">Especial</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-400 mb-1 uppercase">Cantidad inicial ({getInventoryUnitLabel(formData.unit_of_measure)})</label>
                                        <input type="number" required min={isDiscreteInventoryUnit(formData.unit_of_measure) ? '1' : '0.001'} step={isDiscreteInventoryUnit(formData.unit_of_measure) ? '1' : '0.001'} placeholder={isDiscreteInventoryUnit(formData.unit_of_measure) ? 'Ej. 5' : 'Ej. 1.5'} value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} className="w-full px-3 py-2 bg-[#0C1017] border border-gray-800 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#FE2C55]" />
                                    </div>
                                </div>
                                {formData.storage_condition === 'special' && (
                                    <label className="block text-[10px] text-gray-400 mt-3 uppercase">Instrucciones especiales <span className="text-red-400">(obligatorio)</span>
                                        <textarea required rows="2" maxLength="1000" value={formData.storage_notes} onChange={(e) => setFormData({ ...formData, storage_notes: e.target.value })} placeholder="Ej. Mantener entre 2 °C y 5 °C" className="mt-1 w-full px-3 py-2 bg-[#0C1017] border border-gray-800 rounded-xl text-xs normal-case text-white placeholder-gray-600 focus:outline-none focus:border-[#FE2C55]" />
                                    </label>
                                )}
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

            {editingProduct && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-[#161B22] border border-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 my-8">
                        <div className="flex justify-between items-center border-b border-gray-800 pb-4">
                            <div>
                                <h2 className="text-lg font-bold text-white uppercase tracking-wide">Editar producto</h2>
                                <p className="text-xs text-gray-400 mt-1">El historial de movimientos conservará este producto.</p>
                            </div>
                            <button type="button" onClick={() => setEditingProduct(null)} className="text-gray-400 hover:text-white p-1 rounded-lg" aria-label="Cerrar">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {editError && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs text-center">{editError}</div>}

                        <form onSubmit={handleUpdateProduct} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <label className="text-[10px] text-gray-400 uppercase">SKU
                                    <input type="text" required maxLength="255" value={editForm.sku} onChange={(e) => setEditForm({ ...editForm, sku: e.target.value.toUpperCase() })} className="mt-1 w-full px-3 py-2 bg-[#0C1017] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#FE2C55]" />
                                </label>
                                <label className="text-[10px] text-gray-400 uppercase">Nombre
                                    <input type="text" required maxLength="255" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="mt-1 w-full px-3 py-2 bg-[#0C1017] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#FE2C55]" />
                                </label>
                                <label className="text-[10px] text-gray-400 uppercase">Unidad de medida
                                    <select required value={editForm.unit_of_measure} onChange={(e) => setEditForm({ ...editForm, unit_of_measure: e.target.value })} className="mt-1 w-full px-3 py-2 bg-[#0C1017] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#FE2C55]">
                                        {!INVENTORY_UNITS.some((unitOption) => unitOption.value === editForm.unit_of_measure) && <option value={editForm.unit_of_measure}>{editForm.unit_of_measure}</option>}
                                        {INVENTORY_UNITS.map((unitOption) => <option key={unitOption.value} value={unitOption.value}>{unitOption.label}</option>)}
                                    </select>
                                </label>
                                <label className="text-[10px] text-gray-400 uppercase">Precio por unidad
                                    <input type="number" required min="0" max="99999999.99" step="0.01" value={editForm.unit_price} onChange={(e) => setEditForm({ ...editForm, unit_price: e.target.value })} className="mt-1 w-full px-3 py-2 bg-[#0C1017] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#FE2C55]" />
                                </label>
                                <label className="col-span-2 text-[10px] text-gray-400 uppercase">Catálogo
                                    <select value={editForm.category_id} onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })} className="mt-1 w-full px-3 py-2 bg-[#0C1017] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#FE2C55]">
                                        <option value="">Sin categoría</option>
                                        {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                                    </select>
                                </label>
                            </div>
                            <label className="block text-[10px] text-gray-400 uppercase">Descripción
                                <textarea rows="3" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="mt-1 w-full px-3 py-2 bg-[#0C1017] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#FE2C55]" />
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <label className="text-[10px] text-gray-400 uppercase">Conservación
                                    <select value={editForm.storage_condition} onChange={(e) => setEditForm({ ...editForm, storage_condition: e.target.value })} className="mt-1 w-full px-3 py-2 bg-[#0C1017] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#FE2C55]">
                                        <option value="ambient">Temperatura ambiente</option><option value="refrigerated">Refrigerado</option><option value="frozen">Congelado</option><option value="special">Especial</option>
                                    </select>
                                </label>
                                {editForm.storage_condition === 'special' && (
                                    <label className="text-[10px] text-gray-400 uppercase">Instrucciones especiales
                                        <textarea required rows="2" maxLength="1000" value={editForm.storage_notes} onChange={(e) => setEditForm({ ...editForm, storage_notes: e.target.value })} className="mt-1 w-full px-3 py-2 bg-[#0C1017] border border-gray-800 rounded-xl text-xs normal-case text-white focus:outline-none focus:border-[#FE2C55]" />
                                    </label>
                                )}
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setEditingProduct(null)} className="w-1/2 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold uppercase">Cancelar</button>
                                <button type="submit" disabled={editSubmitting} className="w-1/2 py-2.5 bg-[#FE2C55] hover:bg-[#e02447] text-white rounded-xl text-xs font-bold uppercase disabled:opacity-50">
                                    {editSubmitting ? 'Guardando...' : 'Guardar cambios'}
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
