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
                // Sincronizado exactamente con tu propiedad .data.data del backend
                const dataReal = Array.isArray(response.data) ? response.data : (response.data.data || []);
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
            <div className="flex flex-col justify-center items-center h-screen bg-gray-50 space-y-4">
                {/* Spinner rojo giratorio profesional */}
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
    // 📊 CÁLCULOS DINÁMICOS REALES (MÉTRICAS DEL BACKEND)
    // ==========================================
    
    // 1. Total Unidades Físicas Consolidadas (Suma de current_stock de cada ítem)
    const totalUnitsInStock = stockData.reduce((acc, curr) => acc + Number(curr.current_stock || 0), 0);
    
    // 2. Alertas de Stock Bajo (Ítems con menos de 10 unidades reales en current_stock)
    const lowStockAlerts = stockData.filter(item => Number(item.current_stock || 0) < 10).length;
    
    // 3. Total Referencias Únicas (Total de SKUs activos en la base de datos)
    const totalReferences = stockData.length;

    // 4. Sumatorias para contexto visual adicional
    const overallInbound = stockData.reduce((acc, curr) => acc + Number(curr.total_inbound || 0), 0);
    const overallOutbound = stockData.reduce((acc, curr) => acc + Number(curr.total_outbound || 0), 0);

    // 5. Mapeo dinámico para la gráfica de "Top Movers" usando tus productos reales
    // Tomamos el stock_outbound (Salidas/Despachos) para ordenar los más movidos
    const topMoversData = [...stockData]
        .sort((a, b) => Number(b.total_outbound || 0) - Number(a.total_outbound || 0))
        .slice(0, 5) // Tomamos el TOP 5
        .map(item => {
            const maxOutbound = Math.max(...stockData.map(s => Number(s.total_outbound || 1)), 1);
            // Calculamos el porcentaje de altura para las barras CSS de manera proporcional
            const percentage = (Number(item.total_outbound || 0) / maxOutbound) * 100;
            return {
                name: item.product?.name || item.product?.sku || `ID: ${item.product_id}`,
                h: `${Math.max(percentage, 10)}%`, // Mínimo 10% de altura visual
                value: item.total_outbound
            };
        });

    return (
        <div className="space-y-6 text-gray-200 font-sans">
            {/* Header del Dashboard */}
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
                <p className="text-xs text-gray-400 mt-1">
                    {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · Análisis y métricas de rendimiento
                </p>
            </div>

            {/* Tarjetas de Métricas Principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Métricas 1: Total Unidades */}
                <div className="bg-[#161B22] border border-gray-800/80 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                            TOTAL ITEMS IN STOCK
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
                        <p className="text-xs font-medium text-[#FE2C55] flex items-center space-x-1 mt-1">
                            <span>▲ Unidades físicas consolidadas</span>
                        </p>
                    </div>
                </div>

                {/* Métricas 2: Alertas de Stock Bajo */}
                <div className="bg-[#161B22] border border-gray-800/80 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                            LOW STOCK ALERTS
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
                        <p className="text-xs font-medium text-amber-400 flex items-center space-x-1 mt-1">
                            <span>▼ Ítems con menos de 10 unidades</span>
                        </p>
                    </div>
                </div>

                {/* Métricas 3: Total Referencias */}
                <div className="bg-[#161B22] border border-gray-800/80 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                            TOTAL REFERENCIAS
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#FE2C55]/10 text-[#FE2C55] flex items-center justify-center">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                    </div>
                    <div>
                        <p className="text-3xl font-extrabold text-[#FE2C55] tracking-tight">
                            {totalReferences}
                        </p>
                        <p className="text-xs font-medium text-gray-400 flex items-center space-x-1 mt-1">
                            <span>▲ SKUs únicos activos</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Sección Gráficas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Gráfica de Línea: Monthly Turnover */}
                <div className="lg:col-span-2 bg-[#161B22] border border-gray-800/80 rounded-2xl p-6 flex flex-col justify-between space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-base font-bold text-white">Monthly Turnover</h3>
                            <p className="text-xs text-gray-400">Flujo global acumulado de almacén</p>
                        </div>
                        <span className="text-xs font-semibold bg-[#FE2C55]/10 text-[#FE2C55] border border-[#FE2C55]/20 px-2.5 py-1 rounded-lg">
                            2026 YTD
                        </span>
                    </div>

                    <div className="h-44 w-full flex items-end pt-4">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120" fill="none">
                            <path
                                d="M 0 80 Q 50 90, 100 60 T 200 50 T 300 70 T 400 30 T 500 10"
                                fill="none"
                                stroke="#FE2C55"
                                strokeWidth="3"
                            />
                            <path
                                d="M 0 100 Q 50 105, 100 85 T 200 75 T 300 90 T 400 60 T 500 40"
                                fill="none"
                                stroke="#374151"
                                strokeWidth="2"
                                strokeDasharray="4 4"
                            />
                        </svg>
                    </div>

                    <div className="flex justify-between text-[11px] font-medium text-gray-500 pt-2 border-t border-gray-800/60">
                        <span>Ene</span><span>Feb</span><span>Mar</span><span>Abr</span>
                        <span>May</span><span>Jun</span><span>Jul</span><span>Ago</span><span>Sep</span>
                    </div>
                </div>

                {/* Gráfica de Barras Dinámica: Top Movers */}
                <div className="bg-[#161B22] border border-gray-800/80 rounded-2xl p-6 flex flex-col justify-between space-y-4">
                    <div>
                        <h3 className="text-base font-bold text-white">Top Movers</h3>
                        <p className="text-xs text-gray-400">Unidades reales despachadas (Outbound)</p>
                    </div>

                    <div className="h-44 flex items-end justify-between gap-3 pt-4">
                        {topMoversData.length > 0 ? (
                            topMoversData.map((bar, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                                    <span className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {bar.value}
                                    </span>
                                    <div
                                        className="w-full bg-[#FE2C55] rounded-t-lg transition-all duration-300 hover:opacity-80"
                                        style={{ height: bar.h }}
                                    ></div>
                                    <span className="text-[10px] text-gray-400 truncate w-full text-center">{bar.name}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-gray-500 m-auto">Sin registros de salida activos.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Fila Inferior: Summary Health / Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-3 bg-[#161B22] border border-gray-800/80 rounded-2xl p-6 space-y-5">
                    <h3 className="text-base font-bold text-white">Resumen de Actividad de Carga</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 bg-gray-900/40 p-4 rounded-xl border border-gray-800/40">
                            <span className="text-xs text-gray-400">Entradas Históricas Consolidadas</span>
                            <p className="text-xl font-bold text-white">{overallInbound.toLocaleString()} unidades</p>
                        </div>
                        <div className="space-y-2 bg-gray-900/40 p-4 rounded-xl border border-gray-800/40">
                            <span className="text-xs text-gray-400">Salidas Históricas Consolidadas</span>
                            <p className="text-xl font-bold text-[#FE2C55]">{overallOutbound.toLocaleString()} unidades</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;