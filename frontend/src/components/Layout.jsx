import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Cerrar sidebar al cambiar de ruta en móviles
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location.pathname]);

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
            <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-[#0C1017] border-r border-gray-800/60 flex flex-col justify-between transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
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
                                className="lg:hidden text-gray-400 hover:text-white p-1 rounded-lg"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Menú de Navegación */}
                    <nav className="p-4 space-y-1">
                        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                            Main Menu
                        </div>

                        <Link
                            to="/dashboard"
                            className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${isActive('/dashboard')
                                    ? 'bg-[#FE2C55]/10 text-[#FE2C55] border border-[#FE2C55]/20'
                                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                            <span>Metricas de Rendimiento</span>
                        </Link>

                        <Link
                            to="/stock"
                            className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${isActive('/stock')
                                    ? 'bg-[#FE2C55]/10 text-[#FE2C55] border border-[#FE2C55]/20'
                                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <span>Stock de Inventario</span>
                        </Link>

                        <Link
                            to="/users"
                            className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${isActive('/users')
                                    ? 'bg-[#FE2C55]/10 text-[#FE2C55] border border-[#FE2C55]/20'
                                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <span>Usuarios</span>
                        </Link>

                        <Link
                            to="/history"
                            className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${isActive('/history')
                                    ? 'bg-[#FE2C55]/10 text-[#FE2C55] border border-[#FE2C55]/20'
                                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Historial de Movimientos</span>
                        </Link>

                        <Link
                            to="/Configuration"
                            className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${isActive('/Configuration')
                                    ? 'bg-[#FE2C55]/10 text-[#FE2C55] border border-[#FE2C55]/20'
                                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>Configuración</span>
                        </Link>
                    </nav>
                </div>

                {/* Botón Cerrar Sesión en Sidebar (Sin el usuario duplicado) */}
                <div className="p-4 border-t border-gray-800/60">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center space-x-2 text-gray-400 hover:text-red-400 bg-[#161B22] hover:bg-red-500/10 py-2.5 rounded-xl transition text-xs font-semibold border border-gray-800 hover:border-red-500/20"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Área Principal de Contenido */}
            <div className="flex-1 flex flex-col overflow-hidden bg-[#0C1017]">
                {/* Header Superior */}
                <header className="bg-[#0C1017] border-b border-gray-800/60 px-4 sm:px-8 py-4 flex justify-between items-center gap-4">
                    {/* Botón Hamburguesa para Móviles */}
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="lg:hidden p-2 text-gray-400 hover:text-white bg-[#161B22] border border-gray-800 rounded-xl focus:outline-none"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    {/* Buscador General (Más amplio y cómodo) */}
                    <div className="relative flex-1 max-w-xl">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar en inventario, SKUs, usuarios..."
                            className="w-full pl-11 pr-4 py-2.5 bg-[#161B22] border border-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FE2C55] transition shadow-inner"
                        />
                    </div>

                    {/* Perfil e Iconos del Header */}
                    <div className="flex items-center space-x-3 sm:space-x-4 shrink-0">
                        <button className="relative p-2.5 text-gray-400 hover:text-white bg-[#161B22] border border-gray-800 rounded-xl transition">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 01-6 0v-1m6 0H9" />
                            </svg>
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FE2C55] rounded-full"></span>
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
            </div>
        </div>
    );
};

export default Layout;