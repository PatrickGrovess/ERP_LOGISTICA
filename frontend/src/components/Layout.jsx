import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { getInventoryUnitLabel } from '../constants/inventory';

const Layout = () => {
    const { user, tenant, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Estado para controlar el panel lateral de notificaciones
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    // Estado para controlar la visibilidad del código de servidor (tipo contraseña)
    const [showServerCode, setShowServerCode] = useState(false);
    const [serverCodeCopied, setServerCodeCopied] = useState(false);

    // Estado para la búsqueda global en el header
    const [searchQuery, setSearchQuery] = useState('');

    // Estados para los contadores dinámicos del menú
    const [totalStock, setTotalStock] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);
    const [totalMovements, setTotalMovements] = useState(0);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // Cerrar sidebar al cambiar de ruta en móviles
    useEffect(() => {
        setIsSidebarOpen(false);
        setIsNotificationsOpen(false);
    }, [location.pathname]);

    // Cargar métricas o contadores dinámicos para el menú lateral
    useEffect(() => {
        const fetchNavCounts = async () => {
            try {
                // Cargar información real del tenant para contadores y avisos de stock bajo.
                const stockRes = await api.get('/inventory/stock');
                const stocks = Array.isArray(stockRes.data) ? stockRes.data : (stockRes.data?.data || []);
                if (Array.isArray(stocks)) {
                    const stockSum = stocks.reduce((acc, item) => acc + (Number(item.current_stock) || 0), 0);
                    setTotalStock(stockSum);

                    const byProduct = stocks.reduce((summary, item) => {
                        const productId = String(item.product_id);
                        if (!summary[productId]) {
                            summary[productId] = { ...item, current_stock: 0 };
                        }
                        summary[productId].current_stock += Number(item.current_stock || 0);
                        return summary;
                    }, {});
                    const threshold = Number(tenant?.low_stock_threshold ?? 10);
                    setLowStockItems(Object.values(byProduct).filter((item) => Number(item.current_stock) <= threshold));
                }

                if (['staff', 'admin'].includes(user?.role)) {
                    const usersRes = await api.get('/inventory/users');
                    const usersList = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data?.data || []);
                    if (Array.isArray(usersList)) setTotalUsers(usersList.length);
                }

                const movementsRes = await api.get('/inventory/movements');
                const movementsList = Array.isArray(movementsRes.data) ? movementsRes.data : (movementsRes.data?.data || []);
                if (Array.isArray(movementsList)) {
                    setTotalMovements(movementsList.length);
                }

                const activityRes = await api.get('/inventory/activity');
                const activityList = Array.isArray(activityRes.data) ? activityRes.data : (activityRes.data?.data || []);
                if (Array.isArray(activityList)) setRecentActivities(activityList);
            } catch (error) {
                console.error('Error al cargar contadores del menú:', error);
            }
        };

        fetchNavCounts();
    }, [location.pathname, tenant?.low_stock_threshold, user?.role]);

    useEffect(() => {
        if (!isNotificationsOpen) return undefined;

        let isActive = true;
        const refreshNotifications = async () => {
            try {
                const [stockRes, activityRes] = await Promise.all([
                    api.get('/inventory/stock'),
                    api.get('/inventory/activity'),
                ]);
                const stockRows = Array.isArray(stockRes.data) ? stockRes.data : stockRes.data?.data;
                const activityRows = Array.isArray(activityRes.data) ? activityRes.data : activityRes.data?.data;
                const stocks = Array.isArray(stockRows) ? stockRows : [];
                const activities = Array.isArray(activityRows) ? activityRows : [];

                if (!isActive) return;
                const byProduct = stocks.reduce((summary, item) => {
                    const productId = String(item.product_id);
                    if (!summary[productId]) summary[productId] = { ...item, current_stock: 0 };
                    summary[productId].current_stock += Number(item.current_stock || 0);
                    return summary;
                }, {});
                const threshold = Number(tenant?.low_stock_threshold ?? 10);
                setLowStockItems(Object.values(byProduct).filter((item) => Number(item.current_stock) <= threshold));
                setRecentActivities(activities);
            } catch (error) {
                console.error('Error al actualizar las notificaciones:', error);
            }
        };

        refreshNotifications();
        return () => { isActive = false; };
    }, [isNotificationsOpen, tenant?.low_stock_threshold]);

    // Manejar búsqueda global
    const handleGlobalSearch = (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        const query = searchQuery.trim();
        let path = '/stock';
        let filter = query;

        if (/^(users?|usuarios?)\b/i.test(query) && ['staff', 'admin'].includes(user?.role)) {
            path = '/users';
            filter = query.replace(/^(users?|usuarios?)\s*/i, '');
        } else if (/^(movimientos?|historial)\b/i.test(query)) {
            path = '/history';
            filter = query.replace(/^(movimientos?|historial)\s*/i, '');
        } else if (/^(productos?|sku|catalogo|catálogo|categor[ií]a)\b/i.test(query)) {
            path = '/stock';
            filter = query.replace(/^(productos?|sku|catalogo|catálogo|categor[ií]a)\s*/i, '');
        }

        navigate(path, { state: { searchQuery: filter } });
        setSearchQuery('');
    };

    const handleCopyServerCode = async (event) => {
        event.stopPropagation();
        if (!tenant?.server_code) return;

        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(tenant.server_code);
            } else {
                const temporaryInput = document.createElement('textarea');
                temporaryInput.value = tenant.server_code;
                temporaryInput.style.position = 'fixed';
                temporaryInput.style.opacity = '0';
                document.body.appendChild(temporaryInput);
                temporaryInput.select();
                const copied = document.execCommand('copy');
                temporaryInput.remove();
                if (!copied) throw new Error('El navegador rechazó la copia.');
            }
            setServerCodeCopied(true);
            window.setTimeout(() => setServerCodeCopied(false), 1800);
        } catch (error) {
            console.error('No se pudo copiar el código del servidor:', error);
            setServerCodeCopied(false);
        }
    };

    // Función auxiliar para determinar si un enlace está activo
    const isActive = (path) => location.pathname === path;

    // Obtener iniciales para el avatar
    const getInitials = (name) => {
        if (!name) return 'U';
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <div className="flex h-screen bg-[#0C1017] text-gray-200 font-sans overflow-hidden">
            {/* Overlay para móviles cuando la barra lateral está abierta */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-20 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar / Barra Lateral Responsive */}
            <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-72 bg-[#0C1017] border-r border-gray-800/60 flex flex-col justify-between transform transition-transform duration-300 ease-in-out ${
                isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}>
                <div>
                    {/* Header del Sidebar con Logo y Botón de cierre móvil */}
                    <div className="p-6 flex items-center justify-between border-b border-gray-800/40">
                        <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-xl bg-[#FE2C55]/10 border border-[#FE2C55]/30 flex items-center justify-center text-[#FE2C55]">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold text-white tracking-wide">Groyte</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-semibold bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full border border-gray-700">
                                V1.1
                            </span>
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="lg:hidden text-gray-400 hover:text-white p-1 rounded-lg cursor-pointer"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Menú de Navegación con Valores Dinámicos y Simétricos */}
                    <nav className="p-4 space-y-1">
                        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                            Main Menu
                        </div>

                        <Link
                            to="/dashboard"
                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                                isActive('/dashboard')
                                    ? 'bg-[#FE2C55]/10 text-[#FE2C55] border border-[#FE2C55]/20'
                                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
                            }`}
                        >
                            <div className="flex items-center space-x-3">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                                <span>Metricas de Rendimiento</span>
                            </div>
                        </Link>

                        <Link
                            to="/stock"
                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                                isActive('/stock')
                                    ? 'bg-[#FE2C55]/10 text-[#FE2C55] border border-[#FE2C55]/20'
                                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
                            }`}
                        >
                            <div className="flex items-center space-x-3">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                                <span>Stock de Inventario</span>
                            </div>
                            <span className="text-xs bg-[#161B22] text-gray-300 px-2 py-0.5 rounded-lg border border-gray-800 font-mono">
                                {totalStock}
                            </span>
                        </Link>

                        {['staff', 'admin'].includes(user?.role) && (
                            <Link
                                to="/users"
                                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                                    isActive('/users')
                                        ? 'bg-[#FE2C55]/10 text-[#FE2C55] border border-[#FE2C55]/20'
                                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    <span>Usuarios</span>
                                </div>
                                <span className="text-xs bg-[#161B22] text-gray-300 px-2 py-0.5 rounded-lg border border-gray-800 font-mono">
                                    {totalUsers}
                                </span>
                            </Link>
                        )}

                        <Link
                            to="/history"
                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                                isActive('/history')
                                    ? 'bg-[#FE2C55]/10 text-[#FE2C55] border border-[#FE2C55]/20'
                                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
                            }`}
                        >
                            <div className="flex items-center space-x-3">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Historial de Movimientos</span>
                            </div>
                            <span className="text-xs bg-[#161B22] text-gray-300 px-2 py-0.5 rounded-lg border border-gray-800 font-mono">
                                {totalMovements}
                            </span>
                        </Link>

                        <Link
                            to="/configuration"
                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                                isActive('/configuration')
                                    ? 'bg-[#FE2C55]/10 text-[#FE2C55] border border-[#FE2C55]/20'
                                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
                            }`}
                        >
                            <div className="flex items-center space-x-3">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>Configuración</span>
                            </div>
                        </Link>
                    </nav>
                </div>

                {/* Botón Cerrar Sesión en Sidebar */}
                <div className="p-4 border-t border-gray-800/60">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center space-x-2 text-gray-400 hover:text-red-400 bg-[#161B22] hover:bg-red-500/10 py-2.5 rounded-xl transition text-xs font-semibold border border-gray-800 hover:border-red-500/20 cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Área Principal de Contenido */}
            <div className="flex-1 flex flex-col overflow-hidden bg-[#0C1017] relative">
                {/* Header Superior */}
                <header className="bg-[#0C1017] border-b border-gray-800/60 px-4 sm:px-8 py-4 flex justify-between items-center gap-4">
                    {/* Botón Hamburguesa para Móviles */}
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="lg:hidden p-2 text-gray-400 hover:text-white bg-[#161B22] border border-gray-800 rounded-xl focus:outline-none cursor-pointer"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    {/* Buscador General */}
                    <form onSubmit={handleGlobalSearch} className="relative flex-1 max-w-xl">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar producto/SKU o escribe ‘usuario’ o ‘movimiento’ primero"
                            className="w-full pl-11 pr-4 py-2.5 bg-[#161B22] border border-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FE2C55] transition shadow-inner"
                        />
                    </form>

                    {/* Sección exclusiva para Staff: Nombre de Empresa arriba y Código protegido abajo */}
                    {user?.role === 'staff' && (
                        <div className="hidden md:flex flex-col text-right shrink-0">
                            <span className="text-xs font-bold text-white tracking-wide">
                                {tenant?.name || 'Empresa'}
                            </span>
                            <div
                                onClick={() => setShowServerCode(!showServerCode)}
                                className="cursor-pointer group flex items-center justify-end space-x-1.5 text-xs text-gray-400 mt-0.5"
                                title="Haz clic para mostrar / ocultar código"
                            >
                                <span className="font-mono tracking-wider">
                                    {showServerCode
                                        ? (tenant?.server_code || 'Código no disponible')
                                        : '•••••-•••••-•••••'}
                                </span>
                                <svg className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {showServerCode ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    )}
                                </svg>
                                <button
                                    type="button"
                                    onClick={handleCopyServerCode}
                                    disabled={!tenant?.server_code}
                                    aria-label={serverCodeCopied ? 'Código copiado' : 'Copiar código del servidor'}
                                    title={serverCodeCopied ? 'Copiado' : 'Copiar código del servidor'}
                                    className="ml-1 p-1 rounded text-gray-500 hover:text-white disabled:opacity-40"
                                >
                                    {serverCodeCopied ? (
                                        <span className="text-[10px] text-emerald-400">Copiado</span>
                                    ) : (
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 8V5.5A1.5 1.5 0 0 1 9.5 4h9A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H16M5.5 8h9A1.5 1.5 0 0 1 16 9.5v9a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 4 18.5v-9A1.5 1.5 0 0 1 5.5 8Z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Perfil e Iconos del Header */}
                    <div className="flex items-center space-x-3 sm:space-x-4 shrink-0">
                        <button
                            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                            aria-label={`Notificaciones: ${lowStockItems.length} avisos de stock bajo y ${recentActivities.length} eventos recientes`}
                            aria-expanded={isNotificationsOpen}
                            className="relative p-2.5 text-gray-400 hover:text-white bg-[#161B22] border border-gray-800 rounded-xl transition cursor-pointer"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 01-6 0v-1m6 0H9" />
                            </svg>
                            {((tenant?.auto_notifications && lowStockItems.length > 0) || recentActivities.length > 0) && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FE2C55] rounded-full"></span>
                            )}
                        </button>

                        <div className="flex items-center space-x-3 bg-[#161B22] border border-gray-800 rounded-xl px-3 py-1.5">
                            <div className="w-8 h-8 rounded-lg bg-[#FE2C55] text-white font-bold flex items-center justify-center text-xs shrink-0">
                                {getInitials(user?.name)}
                            </div>
                            <div className="text-left hidden sm:block">
                                <p className="text-xs font-semibold text-white leading-none mb-1">
                                    {user?.name || 'Usuario'}
                                </p>
                                <span className="inline-block text-[10px] font-bold text-[#FE2C55] tracking-wide uppercase leading-none">
                                    {user?.role || 'User'}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Vista Dinámica de la Ruta Actual */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-8">
                    <Outlet />
                </main>

                {/* Panel Lateral Derecho de Notificaciones */}
                {isNotificationsOpen && (
                    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
                        <div className="w-full max-w-sm bg-[#161B22] border-l border-gray-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
                            {/* Header del Panel */}
                            <div className="p-5 border-b border-gray-800 flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <svg className="w-5 h-5 text-[#FE2C55]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 01-6 0v-1m6 0H9" />
                                    </svg>
                                    <h3 className="font-bold text-white text-sm">Notificaciones</h3>
                                </div>
                                <button
                                    onClick={() => setIsNotificationsOpen(false)}
                                    className="text-gray-400 hover:text-white p-1 rounded-lg cursor-pointer"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                <section className="space-y-3">
                                    <div>
                                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Stock bajo</h4>
                                        <p className="text-[10px] text-gray-500 mt-1">Umbral: {tenant?.low_stock_threshold ?? 10} unidades</p>
                                    </div>
                                    {!tenant?.auto_notifications ? (
                                        <p className="text-xs text-gray-400">Los avisos automáticos de stock bajo están desactivados.</p>
                                    ) : lowStockItems.length === 0 ? (
                                        <p className="text-xs text-gray-400">No hay productos por debajo del umbral.</p>
                                    ) : (
                                        lowStockItems.map((item) => (
                                            <button
                                                key={item.product_id}
                                                onClick={() => { setIsNotificationsOpen(false); navigate('/stock'); }}
                                                className="w-full p-3.5 bg-[#0C1017] border border-amber-500/20 rounded-xl text-left hover:border-amber-500/50 transition"
                                            >
                                                <span className="block text-xs font-bold text-white">{item.product?.name || `Producto #${item.product_id}`}</span>
                                                <span className="block text-[10px] text-amber-400 mt-1">Stock disponible: {item.current_stock} {item.product?.unit_of_measure || 'unidades'}</span>
                                            </button>
                                        ))
                                    )}
                                </section>

                                <section className="space-y-3">
                                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-sky-300">Actividad reciente</h4>
                                    {recentActivities.length === 0 ? (
                                        <p className="text-xs text-gray-400">Todavía no hay actividad registrada.</p>
                                    ) : recentActivities.map((activity) => {
                                        const details = activity.details || {};
                                        const isInbound = activity.action === 'stock_in';
                                        const isMovement = isInbound || activity.action === 'stock_out';
                                        const actionLabels = {
                                            stock_in: 'registró una entrada',
                                            stock_out: 'registró una salida',
                                            product_created: 'creó un producto',
                                            product_updated: 'actualizó un producto',
                                            product_deleted: 'archivó un producto',
                                        };
                                        const changedFieldNames = {
                                            sku: 'SKU',
                                            name: 'nombre',
                                            description: 'descripción',
                                            category_id: 'catálogo',
                                            unit_of_measure: 'unidad de medida',
                                            unit_price: 'precio',
                                            storage_condition: 'conservación',
                                            storage_notes: 'instrucciones de conservación',
                                        };
                                        const productName = details.product_name || `Producto #${activity.product_id}`;
                                        const productReference = `${details.sku ? `${productName} · SKU ${details.sku}` : productName}${details.category_name ? ` · ${details.category_name}` : ''}`;
                                        const movementSummary = `${details.quantity} ${getInventoryUnitLabel(details.unit_of_measure)} de ${productName}`;
                                        const changeSummary = (details.changed_fields || []).map((field) => {
                                            const fieldName = changedFieldNames[field] || field;
                                            const previousValue = details.previous_values?.[field];
                                            const newValue = details.new_values?.[field];
                                            return previousValue === undefined ? fieldName : `${fieldName}: ${previousValue ?? '—'} → ${newValue ?? '—'}`;
                                        }).join(' · ');
                                        const activitySummary = isMovement
                                            ? movementSummary
                                            : productReference;
                                        const activityContext = isMovement
                                            ? `${isInbound ? 'Entrada' : 'Salida'} · ${details.location || 'ubicación desconocida'}`
                                            : activity.action === 'product_updated' && changeSummary
                                                ? `Cambios: ${changeSummary}`
                                                : activity.action === 'product_deleted'
                                                    ? 'Producto archivado; se conservan sus movimientos'
                                                    : 'Catálogo de inventario';

                                        return (
                                            <button
                                                key={activity.id}
                                                onClick={() => { setIsNotificationsOpen(false); navigate(isMovement ? '/history' : '/stock'); }}
                                                className="w-full p-3.5 bg-[#0C1017] border border-gray-800 rounded-xl text-left hover:border-sky-400/40 transition"
                                            >
                                                <span className="block text-xs font-semibold text-white">{details.actor_name || activity.user?.name || 'Usuario desconocido'} {actionLabels[activity.action] || 'actualizó el inventario'}</span>
                                                <span className="block text-[11px] text-gray-300 mt-1">{activitySummary}</span>
                                                <span className="block text-[10px] text-gray-500 mt-1">{activityContext} · {new Date(activity.created_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}</span>
                                            </button>
                                        );
                                    })}
                                </section>
                            </div>

                            {/* Footer del Panel */}
                            <div className="p-4 border-t border-gray-800 text-center">
                                <button
                                    onClick={() => { setIsNotificationsOpen(false); navigate('/stock'); }}
                                    className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-300 rounded-xl transition cursor-pointer"
                                >
                                    Ir al inventario
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Layout;
