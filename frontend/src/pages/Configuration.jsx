import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'system'

    // Estados Formulario Perfil
    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [profileSuccess, setProfileSuccess] = useState('');
    const [profileError, setProfileError] = useState('');
    const [profileLoading, setProfileLoading] = useState(false);

    // Estados Formulario Sistema
    const [systemData, setSystemData] = useState({
        company_name: 'Mi Empresa S.A.',
        low_stock_threshold: 5,
        currency: 'USD',
        auto_notifications: true
    });
    const [systemSuccess, setSystemSuccess] = useState('');
    const [systemError, setSystemError] = useState('');
    const [systemLoading, setSystemLoading] = useState(false);

    // Guardar cambios de perfil
    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setProfileError('');
        setProfileSuccess('');

        if (profileData.new_password && profileData.new_password !== profileData.confirm_password) {
            setProfileError('Las contraseñas nuevas no coinciden.');
            return;
        }

        setProfileLoading(true);
        try {
            // Reemplaza con tu endpoint de actualización de usuario
            // await api.put('/user/profile', profileData);
            
            setProfileSuccess('Perfil actualizado correctamente.');
            setProfileData(prev => ({ ...prev, current_password: '', new_password: '', confirm_password: '' }));
        } catch (err) {
            setProfileError(err.response?.data?.message || 'Error al actualizar el perfil.');
        } finally {
            setProfileLoading(false);
        }
    };

    // Guardar cambios del sistema
    const handleSystemSubmit = async (e) => {
        e.preventDefault();
        setSystemError('');
        setSystemSuccess('');
        setSystemLoading(true);

        try {
            // Reemplaza con tu endpoint de configuración del sistema
            // await api.put('/system/settings', systemData);
            
            setSystemSuccess('Configuración del sistema guardada.');
        } catch (err) {
            setSystemError(err.response?.data?.message || 'Error al guardar la configuración.');
        } finally {
            setSystemLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white tracking-wide">Configuración</h1>
                <p className="text-xs text-gray-400 mt-1">
                    Administra las preferencias de tu cuenta y los parámetros generales de la plataforma.
                </p>
            </div>

            {/* Pestañas de Navegación */}
            <div className="flex border-b border-gray-800 space-x-6 text-sm">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`pb-3 font-semibold transition relative ${
                        activeTab === 'profile'
                            ? 'text-[#FE2C55]'
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    Mi Cuenta
                    {activeTab === 'profile' && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#FE2C55] rounded-full"></span>
                    )}
                </button>

                {/* Pestaña Sistema (Lista para restringir a Owner en el futuro) */}
                <button
                    onClick={() => setActiveTab('system')}
                    className={`pb-3 font-semibold transition relative flex items-center space-x-2 ${
                        activeTab === 'system'
                            ? 'text-[#FE2C55]'
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    <span>Sistema</span>
                    {user?.role !== 'owner' && (
                        <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded border border-gray-700">
                            Owner
                        </span>
                    )}
                    {activeTab === 'system' && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#FE2C55] rounded-full"></span>
                    )}
                </button>
            </div>

            {/* PESTAÑA 1: Configuración de la Cuenta */}
            {activeTab === 'profile' && (
                <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6">
                    <h2 className="text-lg font-bold text-white">Información Personal</h2>

                    {profileSuccess && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs">
                            {profileSuccess}
                        </div>
                    )}
                    {profileError && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs">
                            {profileError}
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
                                    required
                                    value={profileData.name}
                                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-[#0C1017] border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-[#FE2C55] transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                                    Correo Electrónico
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={profileData.email}
                                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
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
                                value={profileData.current_password}
                                onChange={(e) => setProfileData({ ...profileData, current_password: e.target.value })}
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
                                    value={profileData.new_password}
                                    onChange={(e) => setProfileData({ ...profileData, new_password: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-[#0C1017] border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-[#FE2C55] transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                                    Confirmar Nueva Contraseña
                                </label>
                                <input
                                    type="password"
                                    value={profileData.confirm_password}
                                    onChange={(e) => setProfileData({ ...profileData, confirm_password: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-[#0C1017] border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-[#FE2C55] transition"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-3">
                            <button
                                type="submit"
                                disabled={profileLoading}
                                className="px-5 py-2.5 bg-[#FE2C55] text-white rounded-xl text-xs font-semibold hover:bg-[#e02447] disabled:opacity-50 transition shadow-lg shadow-[#FE2C55]/20"
                            >
                                {profileLoading ? 'Guardando...' : 'Actualizar Cuenta'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* PESTAÑA 2: Configuración General del Sistema */}
            {activeTab === 'system' && (
                <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold text-white">Parámetros del Sistema</h2>
                        {/* Bloqueo visual preventivo si no es owner */}
                        {user?.role !== 'owner' && (
                            <span className="text-xs bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2.5 py-1 rounded-lg">
                                Solo lectura (Requiere permisos de Owner)
                            </span>
                        )}
                    </div>

                    {systemSuccess && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs">
                            {systemSuccess}
                        </div>
                    )}
                    {systemError && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs">
                            {systemError}
                        </div>
                    )}

                    <form onSubmit={handleSystemSubmit} className="space-y-4">
                        <fieldset disabled={user?.role !== 'owner'} className="space-y-4 disabled:opacity-60">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                                        Nombre de la Organización
                                    </label>
                                    <input
                                        type="text"
                                        value={systemData.company_name}
                                        onChange={(e) => setSystemData({ ...systemData, company_name: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-[#0C1017] border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-[#FE2C55] transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                                        Moneda Principal
                                    </label>
                                    <select
                                        value={systemData.currency}
                                        onChange={(e) => setSystemData({ ...systemData, currency: e.target.value })}
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
                                    min="1"
                                    value={systemData.low_stock_threshold}
                                    onChange={(e) => setSystemData({ ...systemData, low_stock_threshold: Number(e.target.value) })}
                                    className="w-full px-3.5 py-2.5 bg-[#0C1017] border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-[#FE2C55] transition"
                                />
                            </div>

                            <div className="flex items-center space-x-3 pt-2">
                                <input
                                    type="checkbox"
                                    id="notifications"
                                    checked={systemData.auto_notifications}
                                    onChange={(e) => setSystemData({ ...systemData, auto_notifications: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-800 bg-[#0C1017] text-[#FE2C55] focus:ring-0 focus:ring-offset-0"
                                />
                                <label htmlFor="notifications" className="text-xs text-gray-300">
                                    Activar alertas automáticas al detectar stock crítico
                                </label>
                            </div>
                        </fieldset>

                        {/* Botón de guardar solo habilitado para owner */}
                        {user?.role === 'owner' && (
                            <div className="flex justify-end pt-3">
                                <button
                                    type="submit"
                                    disabled={systemLoading}
                                    className="px-5 py-2.5 bg-[#FE2C55] text-white rounded-xl text-xs font-semibold hover:bg-[#e02447] disabled:opacity-50 transition shadow-lg shadow-[#FE2C55]/20"
                                >
                                    {systemLoading ? 'Guardando...' : 'Guardar Ajustes del Sistema'}
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            )}
        </div>
    );
};

export default Settings;