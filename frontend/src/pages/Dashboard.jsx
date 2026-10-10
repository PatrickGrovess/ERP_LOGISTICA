import { useEffect, useState } from 'react';
import api from '../api/axios';

const Dashboard = () => {
    const [stockData, setStockData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStock = async () => {
            try {
                const response = await api.get('/inventory/stock');
                // Sincronización con la respuesta del Backend
                const dataReal = Array.isArray(response.data) 
                    ? response.data 
                    : (response.data.data || []);
                setStockData(dataReal);
            } catch (err) {
                setError('No se pudo cargar la información de las métricas.');
            } finally {
                setLoading(false);
            }
        };

        fetchStock();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-inherit space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FE2C55]"></div>
                <span className="text-gray-600 font-medium">
                    Cargando métricas del sistema...
                </span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-lg m-4 text-center font-medium">
                {error}
            </div>
        );
    }

    // ==========================================
    // 📊 CÁLCULOS Y MÉTRICAS REALES
    // ==========================================
    
    // 1. Total Unidades Físicas
    const totalUnitsInStock = stockData.reduce((acc, curr) => acc + Number(curr.current_stock || 0), 0);
    
    // 2. Alertas de Stock Bajo (Evalúa min_stock si existe, o umbral por defecto de 10)
    const lowStockItems = stockData.filter(item => {
        const current = Number(item.current_stock || 0);
        const limit = item.min_stock !== undefined ? Number(item.min_stock) : 10;
        return current < limit;
    });
    const lowStockAlerts = lowStockItems.length;
    
    // 3. SKUs o Referencias Únicas
    const totalReferences = stockData.length;

    // 4. Entradas y Salidas Históricas Consolidadas
    const overallInbound = stockData.reduce((acc, curr) => acc + Number(curr.total_inbound || 0), 0);
    const overallOutbound = stockData.reduce((acc, curr) => acc + Number(curr.total_outbound || 0), 0);

    // 5. Productos de Mayor Rotación (Top 5 Outbound)
    const topMoversData = [...stockData]
        .sort((a, b) => Number(b.total_outbound || 0) - Number(a.total_outbound || 0))
        .slice(0, 5)
        .map(item => {
            const maxOutbound = Math.max(...stockData.map(s => Number(s.total_outbound || 0)), 1);
            const value = Number(item.total_outbound || 0);
            const percentage = (value / maxOutbound) * 100;
            return {
                name: item.product?.name || item.product?.sku || `ID: ${item.product_id}`,
                h: `${Math.max(percentage, 12)}%`,
                value
            };
        });

    // 6. Estado General de Salud del Inventario (Calculado)
    const healthyStockCount = totalReferences - lowStockAlerts;
    const healthPercentage = totalReferences > 0 
        ? Math.round((healthyStockCount / totalReferences) * 100) 
        : 100;

    return (
        <div className="space-y-6 text-gray-200 font-sans">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard de Inventario</h1>
                <p className="text-xs text-gray-400 mt-1">
                    {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · Estado y rendimiento general del almacén
                </p>
            </div>

            {/* Tarjetas de Métricas Principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Métricas 1: Unidades Totales */}
                <div className="bg-[#161B22] border border-gray-800/80 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                            Stock Físico Total
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#FE2C55]/10 text-[#FE2C55] flex items-center justify-center">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                    </div>
                    <div>
                        <p className="text-3xl font-extrabold text-white tracking-tight">
                            {totalUnitsInStock.toLocaleString()}
                        </p>
                        <p className="text-xs font-medium text-gray-400 flex items-center space-x-1 mt-1">
                            <span>Unidades disponibles en almacén</span>
                        </p>
                    </div>
                </div>

                {/* Métricas 2: Alertas de Stock Bajo */}
                <div className="bg-[#161B22] border border-gray-800/80 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                            Alertas de Reposición
                        </span>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${lowStockAlerts > 0 ? 'bg-amber-500/10 text-amber-500 animate-pulse' : 'bg-gray-800 text-gray-400'}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                    </div>
                    <div>
                        <p className={`text-3xl font-extrabold tracking-tight ${lowStockAlerts > 0 ? 'text-amber-400' : 'text-white'}`}>
                            {lowStockAlerts}
                        </p>
                        <p className="text-xs font-medium text-amber-400/90 flex items-center space-x-1 mt-1">
                            <span>{lowStockAlerts === 1 ? '1 producto por debajo del mínimo' : `${lowStockAlerts} productos por debajo del mínimo`}</span>
                        </p>
                    </div>
                </div>

                {/* Métricas 3: Total Referencias */}
                <div className="bg-[#161B22] border border-gray-800/80 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                            Catálogo de Productos
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#FE2C55]/10 text-[#FE2C55] flex items-center justify-center">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                    </div>
                    <div>
                        <p className="text-3xl font-extrabold text-[#FE2C55] tracking-tight">
                            {totalReferences}
                        </p>
                        <p className="text-xs font-medium text-gray-400 flex items-center space-x-1 mt-1">
                            <span>SKUs registrados y activos</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Sección de Métricas Funcionales */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Salud del Stock y Balance (Reemplaza el turnover estático) */}
                <div className="lg:col-span-2 bg-[#161B22] border border-gray-800/80 rounded-2xl p-6 flex flex-col justify-between space-y-6">
                    <div className="flex justify-between items-center border-b border-gray-800/60 pb-4">
                        <div>
                            <h3 className="text-base font-bold text-white">Estado de Salud del Inventario</h3>
                            <p className="text-xs text-gray-400">Relación de productos con stock adecuado vs. stock crítico</p>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                            healthPercentage > 80 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                            {healthPercentage}% Saludable
                        </span>
                    </div>

                    {/* Barra Progresiva de Estado */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>Disponibilidad óptima</span>
                            <span>{healthyStockCount} de {totalReferences} SKUs</span>
                        </div>
                        <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden flex">
                            <div 
                                style={{ width: `${healthPercentage}%` }} 
                                className="bg-emerald-500 h-full transition-all duration-500" 
                            />
                            <div 
                                style={{ width: `${100 - healthPercentage}%` }} 
                                className="bg-amber-500 h-full transition-all duration-500" 
                            />
                        </div>
                    </div>

                    {/* Resumen del Balance Operativo */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-4 flex items-center space-x-4">
                            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                </svg>
                            </div>
                            <div>
                                <span className="text-xs text-gray-400 block">Entradas Acumuladas</span>
                                <span className="text-lg font-bold text-white">{overallInbound.toLocaleString()} u.</span>
                            </div>
                        </div>

                        <div className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-4 flex items-center space-x-4">
                            <div className="p-3 bg-[#FE2C55]/10 text-[#FE2C55] rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                                </svg>
                            </div>
                            <div>
                                <span className="text-xs text-gray-400 block">Salidas Acumuladas</span>
                                <span className="text-lg font-bold text-white">{overallOutbound.toLocaleString()} u.</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Movers (Barras Dinámicas) */}
                <div className="bg-[#161B22] border border-gray-800/80 rounded-2xl p-6 flex flex-col justify-between space-y-4">
                    <div>
                        <h3 className="text-base font-bold text-white">Top 5 Más Despachados</h3>
                        <p className="text-xs text-gray-400">Productos con mayor cantidad de salidas (Outbound)</p>
                    </div>

                    <div className="h-48 flex items-end justify-between gap-3 pt-4">
                        {topMoversData.length > 0 ? (
                            topMoversData.map((bar, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                                    <span className="text-[10px] font-semibold text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {bar.value}
                                    </span>
                                    <div
                                        className="w-full bg-[#FE2C55] rounded-t-lg transition-all duration-300 hover:opacity-80"
                                        style={{ height: bar.h }}
                                    ></div>
                                    <span className="text-[10px] text-gray-400 truncate w-full text-center" title={bar.name}>
                                        {bar.name}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-gray-500 m-auto text-center">
                                Sin movimientos de salida registrados.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Listado Crítico Opcional de Atención Inmediata */}
            {lowStockItems.length > 0 && (
                <div className="bg-[#161B22] border border-amber-500/20 rounded-2xl p-5 space-y-3">
                    <h4 className="text-sm font-bold text-amber-400 flex items-center space-x-2">
                        <span>⚠️ Productos Requieren Atención Inmediata</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {lowStockItems.slice(0, 6).map((item, index) => (
                            <div key={index} className="bg-gray-900/60 p-3 rounded-lg border border-gray-800 flex justify-between items-center text-xs">
                                <span className="text-gray-300 font-medium truncate max-w-[150px]">
                                    {item.product?.name || item.product?.sku || `Producto ${item.product_id}`}
                                </span>
                                <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded">
                                    {item.current_stock} u.
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;