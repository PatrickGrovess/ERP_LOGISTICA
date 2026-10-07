import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Users = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal para invitar / crear usuario
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteData, setInviteData] = useState({ name: '', email: '', role: 'Staff' });
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteError, setInviteError] = useState('');

    // Obtener listado de usuarios
    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(Array.isArray(response.data) ? response.data : (response.data?.data || []));
        } catch (err) {
            setError('Error al obtener la lista de usuarios.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Cálculo de métricas dinámicas
    const totalUsers = users.length;
    const adminCount = users.filter(u => u.role?.toLowerCase() === 'admin' || u.role?.toLowerCase() === 'owner').length;
    const activeCount = users.filter(u => u.status?.toLowerCase() === 'active' || u.is_active === true || u.is_active === 1).length;
    const restrictedCount = totalUsers - activeCount;

    // Cambiar estado de acceso (Toggle Active/Restricted)
    const handleToggleAccess = async (targetUser) => {
        const newStatus = targetUser.status === 'Active' ? 'Restricted' : 'Active';
        try {
            await api.patch(`/users/${targetUser.id}`, { status: newStatus });
            setUsers(users.map(u => u.id === targetUser.id ? { ...u, status: newStatus } : u));
        } catch (err) {
            console.error('Error al cambiar el acceso del usuario', err);
        }
    };

    // Cambiar rol de usuario
    const handleChangeRole = async (targetUser) => {
        const newRole = targetUser.role?.toLowerCase() === 'admin' ? 'Staff' : 'Admin';
        try {
            await api.patch(`/users/${targetUser.id}`, { role: newRole });
            setUsers(users.map(u => u.id === targetUser.id ? { ...u, role: newRole } : u));
        } catch (err) {
            console.error('Error al cambiar el rol del usuario', err);
        }
    };

    // Generar iniciales a partir del nombre
    const getInitials = (name = '') => {
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.slice(0, 2).toUpperCase() || 'US';
    };

    // Colores para los avatares de iniciales
    const avatarColors = [
        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        'bg-blue-500/10 text-blue-400 border-blue-500/20',
        'bg-purple-500/10 text-purple-400 border-purple-500/20',
        'bg-amber-500/10 text-amber-400 border-amber-500/20',
        'bg-rose-500/10 text-rose-400 border-rose-500/20'
    ];

    // Enviar invitación
    const handleInviteSubmit = async (e) => {
        e.preventDefault();
        setInviteError('');
        setInviteLoading(true);

        try {
            await api.post('/users/invite', inviteData);
            setShowInviteModal(false);
            setInviteData({ name: '', email: '', role: 'Staff' });
            fetchUsers();
        } catch (err) {
            setInviteError(err.response?.data?.message || 'Error al enviar la invitación.');
        } finally {
            setInviteLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex items-center space-x-3 text-gray-400">
                    <svg className="w-6 h-6 animate-spin text-[#6366F1]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm font-medium">Cargando usuarios...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <div className="flex items-center space-x-3">
                        <h1 className="text-2xl font-bold text-white tracking-wide">User Management</h1>
                        <span className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#6366F1]/10 border border-[#6366F1]/30 text-[#818CF8] rounded-full text-xs font-semibold">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span>Admin Only</span>
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                        Manage team access, roles, and permissions
                    </p>
                </div>

                <button
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center space-x-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow-lg shadow-[#6366F1]/20"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Invite Member</span>
                </button>
            </div>

            {/* Tarjetas de Métricas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-5 shadow-lg">
                    <span className="text-2xl font-bold text-emerald-400 block">{totalUsers}</span>
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">TOTAL</span>
                </div>
                <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-5 shadow-lg">
                    <span className="text-2xl font-bold text-purple-400 block">{adminCount}</span>
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">ADMINS</span>
                </div>
                <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-5 shadow-lg">
                    <span className="text-2xl font-bold text-blue-400 block">{activeCount}</span>
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">ACTIVE</span>
                </div>
                <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-5 shadow-lg">
                    <span className="text-2xl font-bold text-rose-500 block">{restrictedCount}</span>
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">RESTRICTED</span>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">
                    {error}
                </div>
            )}

            {/* Tabla de Usuarios */}
            <div className="bg-[#161B22] rounded-2xl border border-gray-800/80 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#0C1017]/50 border-b border-gray-800/80 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                                <th className="px-6 py-4">MEMBER</th>
                                <th className="px-6 py-4">EMAIL</th>
                                <th className="px-6 py-4">ROLE</th>
                                <th className="px-6 py-4">JOINED</th>
                                <th className="px-6 py-4">STATUS</th>
                                <th className="px-6 py-4">ACCESS</th>
                                <th className="px-6 py-4 text-right">PERMISSIONS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/60 text-sm">
                            {users.map((item, idx) => {
                                const isActive = item.status === 'Active' || item.is_active === true;
                                const avatarColor = avatarColors[idx % avatarColors.length];

                                return (
                                    <tr key={item.id} className="hover:bg-gray-800/30 transition-colors">
                                        {/* Avatar e Iniciales + Nombre */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold text-xs ${avatarColor}`}>
                                                    {getInitials(item.name)}
                                                </div>
                                                <span className="font-semibold text-white">{item.name}</span>
                                            </div>
                                        </td>

                                        {/* Email */}
                                        <td className="px-6 py-4 font-mono text-xs text-gray-400">
                                            {item.email}
                                        </td>

                                        {/* Role Badge */}
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                                                item.role?.toLowerCase() === 'admin'
                                                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                                    : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            }`}>
                                                {item.role || 'Staff'}
                                            </span>
                                        </td>

                                        {/* Fecha de registro */}
                                        <td className="px-6 py-4 font-mono text-xs text-gray-400">
                                            {item.joined || (item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Jan 2025')}
                                        </td>

                                        {/* Status Indicador */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-rose-500'}`}></span>
                                                <span className={`text-xs font-semibold ${isActive ? 'text-emerald-400' : 'text-rose-500'}`}>
                                                    {isActive ? 'Active' : 'Restricted'}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Access Toggle Switch */}
                                        <td className="px-6 py-4">
                                            <button
                                                type="button"
                                                onClick={() => handleToggleAccess(item)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                                                    isActive ? 'bg-emerald-500' : 'bg-gray-700'
                                                }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                        isActive ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                                />
                                            </button>
                                        </td>

                                        {/* Botón de Cambiar Rol */}
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleChangeRole(item)}
                                                className="px-3 py-1.5 border border-gray-800 hover:border-gray-700 bg-[#0C1017] text-gray-300 hover:text-white rounded-xl text-xs font-medium transition"
                                            >
                                                Change Role
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal para Invitar Integrante */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
                        <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-800">
                            <h2 className="text-lg font-bold text-white">Invite Team Member</h2>
                            <button
                                onClick={() => setShowInviteModal(false)}
                                className="text-gray-400 hover:text-white transition"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {inviteError && (
                            <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2 rounded-xl text-xs">
                                {inviteError}
                            </div>
                        )}

                        <form onSubmit={handleInviteSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Sarah Chen"
                                    value={inviteData.name}
                                    onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-[#0C1017] border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#6366F1] transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    placeholder="sarah.chen@chest.io"
                                    value={inviteData.email}
                                    onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-[#0C1017] border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#6366F1] transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                                    Role
                                </label>
                                <select
                                    value={inviteData.role}
                                    onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-[#0C1017] border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-[#6366F1] transition"
                                >
                                    <option value="Staff">Staff</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>

                            <div className="flex justify-end space-x-3 pt-3 border-t border-gray-800/80">
                                <button
                                    type="button"
                                    onClick={() => setShowInviteModal(false)}
                                    className="px-4 py-2 border border-gray-800 text-gray-300 rounded-xl text-xs font-semibold hover:bg-gray-800/50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={inviteLoading}
                                    className="px-4 py-2 bg-[#6366F1] text-white rounded-xl text-xs font-semibold hover:bg-[#4F46E5] disabled:opacity-50 transition shadow-lg shadow-[#6366F1]/20"
                                >
                                    {inviteLoading ? 'Sending...' : 'Send Invitation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;