import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

// Configuración de pestañas escalable
const TABS = [
    { id: 'profile', label: 'Mi Cuenta', allowedRoles: ['*'] },
    { id: 'system', label: 'Sistema', allowedRoles: ['admin', 'owner'] },
    // Futuras pestañas:
    // { id: 'notifications', label: 'Notificaciones', allowedRoles: ['*'] },
    // { id: 'integrations', label: 'Integraciones', allowedRoles: ['admin', 'owner'] },
];

const Settings = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');

    // Verificar si el usuario es Admin u Owner
    const isAdmin = ['admin', 'owner'].includes(user?.role?.toLowerCase());

    // Filtrar pestañas visibles según el rol del usuario
    const visibleTabs = TABS.filter(tab => 
        tab.allowedRoles.includes('*') || tab.allowedRoles.includes(user?.role?.toLowerCase())
    );

    // --- ESTADOS: PERFIL ---
    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [profileStatus, setProfileStatus] = useState({ loading: false, error: '', success: '' });

    // --- ESTADOS: SISTEMA ---
    const [systemData, setSystemData] = useState({
        company_name: 'Mi Empresa S.A.',
        low_stock_threshold: 5,
        currency: 'USD',
        auto_notifications: true
    });
    const [systemStatus, setSystemStatus] = useState({ loading: false, error: '', success: '' });

    // Handlers de cambio de input dinámicos
    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handleSystemChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSystemData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Submit Perfil
    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setProfileStatus({ loading: true, error: '', success: '' });

        if (profileData.new_password && profileData.new_password !== profileData.confirm_password) {
            setProfileStatus({ loading: false, error: 'Las contraseñas nuevas no coinciden.', success: '' });
            return;
        }

        try {
            // API Call: await api.put('/user/profile', profileData);
            setProfileStatus({ loading: false, error: '', success: 'Perfil actualizado correctamente.' });
            setProfileData(prev => ({ ...prev, current_password: '', new_password: '', confirm_password: '' }));
        } catch (err) {
            setProfileStatus({
                loading: false,
                error: err.response?.data?.message || 'Error al actualizar el perfil.',
                success: ''
            });
        }
    };

    // Submit Sistema
    const handleSystemSubmit = async (e) => {
        e.preventDefault();
        if (!isAdmin) return;

        setSystemStatus({ loading: true, error: '', success: '' });

        try {
            // API Call: await api.put('/system/settings', systemData);
            setSystemStatus({ loading: false, error: '', success: 'Configuración del sistema guardada.' });
        } catch (err) {
            setSystemStatus({
                loading: false,
                error: err.response?.data?.message || 'Error al guardar la configuración.',
                success: ''
            });
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white tracking-wide">Configuración</h1>
                <p className="text-xs text-gray-400 mt-1">
                    Administra las preferencias de tu cuenta y los parámetros generales de la plataforma.
                </p>
            </div>

            {/* Navegación por Pestañas */}
            <div className="flex border-b border-gray-800 space-x-6 text-sm">
                {visibleTabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`pb-3 font-semibold transition relative capitalize ${
                            activeTab === tab.id
                                ? 'text-[#FE2C55]'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#FE2C55] rounded-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* SECCIÓN 1: MI CUENTA (Accesible para todos) */}
            {activeTab === 'profile' && (
                <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6">
                    <h2 className="text-lg font-bold text-white">Información Personal</h2>

                    {profileStatus.success && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs">
                            {profileStatus.success}
                        </div>
                    )}
                    {profileStatus.error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs">
                            {profileStatus.error}
                        </div>
                    )}

                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                                    Nombre Completo
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={profileData.name}
                                    onChange={handleProfileChange}
                                    className="w-full px-3.5 py-2.5 bg-[#0C1017] border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-[#FE2C55] transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                                    Correo Electrónico
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    value={profileData.email}
                                    onChange={handleProfileChange}
                                    className="w-full px-3.5 py-2.5 bg-[#0C1017] border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-[#FE2C55] transition"
                                />
                            </div>
                        </div>

                        <hr className="border-gray-800/80 my-4" />

                        <h3 className="text-sm font-semibold text-gray-200">Cambiar Contraseña</h3>

                        <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                                Contraseña Actual
                            </label>
                            <input
                                type="password"
                                name="current_password"
                                value={profileData.current_password}
                                onChange={handleProfileChange}
                                className="w-full px-3.5 py-2.5 bg-[#0C1017] border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-[#FE2C55] transition"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                                    Nueva Contraseña
                                </label>
                                <input
                                    type="password"
                                    name="new_password"
                                    value={profileData.new_password}
                                    onChange={handleProfileChange}
                                    className="w-full px-3.5 py-2.5 bg-[#0C1017] border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-[#FE2C55] transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                                    Confirmar Nueva Contraseña
                                </label>
                                <input
                                    type="password"
                                    name="confirm_password"
                                    value={profileData.confirm_password}
                                    onChange={handleProfileChange}
                                    className="w-full px-3.5 py-2.5 bg-[#0C1017] border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-[#FE2C55] transition"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-3">
                            <button
                                type="submit"
                                disabled={profileStatus.loading}
                                className="px-5 py-2.5 bg-[#FE2C55] text-white rounded-xl text-xs font-semibold hover:bg-[#e02447] disabled:opacity-50 transition shadow-lg shadow-[#FE2C55]/20"
                            >
                                {profileStatus.loading ? 'Guardando...' : 'Actualizar Cuenta'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* SECCIÓN 2: SISTEMA (Restringido solo a Admin / Owner) */}
            {activeTab === 'system' && isAdmin && (
                <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold text-white">Parámetros del Sistema</h2>
                        <span className="text-[11px] bg-[#FE2C55]/10 border border-[#FE2C55]/30 text-[#FE2C55] px-2.5 py-1 rounded-lg font-medium">
                            Panel de Administración
                        </span>
                    </div>

                    {systemStatus.success && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs">
                            {systemStatus.success}
                        </div>
                    )}
                    {systemStatus.error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs">
                            {systemStatus.error}
                        </div>
                    )}

                    <form onSubmit={handleSystemSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                                    Nombre de la Organización
                                </label>
                                <input
                                    type="text"
                                    name="company_name"
                                    value={systemData.company_name}
                                    onChange={handleSystemChange}
                                    className="w-full px-3.5 py-2.5 bg-[#0C1017] border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-[#FE2C55] transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                                    Moneda Principal
                                </label>
                                <select
                                    name="currency"
                                    value={systemData.currency}
                                    onChange={handleSystemChange}
                                    className="w-full px-3.5 py-2.5 bg-[#0C1017] border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-[#FE2C55] transition"
                                >
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="PAB">PAB (B/.)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                                Umbral de Stock Bajo (Mínimo por defecto)
                            </label>
                            <input
                                type="number"
                                name="low_stock_threshold"
                                min="1"
                                value={systemData.low_stock_threshold}
                                onChange={handleSystemChange}
                                className="w-full px-3.5 py-2.5 bg-[#0C1017] border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-[#FE2C55] transition"
                            />
                        </div>

                        <div className="flex items-center space-x-3 pt-2">
                            <input
                                type="checkbox"
                                id="auto_notifications"
                                name="auto_notifications"
                                checked={systemData.auto_notifications}
                                onChange={handleSystemChange}
                                className="w-4 h-4 rounded border-gray-800 bg-[#0C1017] text-[#FE2C55] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                            />
                            <label htmlFor="auto_notifications" className="text-xs text-gray-300 cursor-pointer select-none">
                                Activar alertas automáticas al detectar stock crítico
                            </label>
                        </div>

                        <div className="flex justify-end pt-3">
                            <button
                                type="submit"
                                disabled={systemStatus.loading}
                                className="px-5 py-2.5 bg-[#FE2C55] text-white rounded-xl text-xs font-semibold hover:bg-[#e02447] disabled:opacity-50 transition shadow-lg shadow-[#FE2C55]/20"
                            >
                                {systemStatus.loading ? 'Guardando...' : 'Guardar Ajustes del Sistema'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Settings;