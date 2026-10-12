import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Users = () => {
    const { user } = useAuth();
    const isAdmin = ['staff', 'admin'].includes(user?.role?.toLowerCase());

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal para invitar / crear usuario
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteData, setInviteData] = useState({ name: '', email: '', role: 'operator' });
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteError, setInviteError] = useState('');

    // Cargar usuarios procesando los movimientos de inventario
    const fetchUsersFromMovements = async () => {
        try {
            const response = await api.get('/inventory/movements');
            const movements = Array.isArray(response.data) ? response.data : (response.data?.data || []);

            const uniqueUsersMap = new Map();

            movements.forEach(movement => {
                if (movement.user && movement.user.id) {
                    uniqueUsersMap.set(movement.user.id, {
                        id: movement.user.id,
                        name: movement.user.name || 'Sin Nombre',
                        email: movement.user.email || 'Sin Email',
                        role: movement.user.role || 'operator',
                        status: movement.user.status || 'Active',
                        joinedDate: movement.created_at 
                            ? new Date(movement.created_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                year: 'numeric' 
                              })
                            : 'Jan 2025'
                    });
                }
            });

            setUsers(Array.from(uniqueUsersMap.values()));
            setError('');
        } catch (err) {
            console.error('Error al procesar usuarios desde movimientos:', err);
            setError('Error al obtener la lista de usuarios.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsersFromMovements();
    }, []);

    // Métricas para la interfaz visual
    const totalUsers = users.length;
    const adminCount = users.filter(u => u.role?.toLowerCase() === 'admin').length;
    const activeCount = users.filter(u => u.status?.toLowerCase() === 'active' || u.status === undefined).length;
    const restrictedCount = totalUsers - activeCount;

    // Toggle de estado de acceso
    const handleToggleAccess = async (targetUser) => {
        if (!isAdmin) return;
        const currentStatus = targetUser.status || 'Active';
        const newStatus = currentStatus.toLowerCase() === 'active' ? 'Restricted' : 'Active';
        try {
            await api.patch(`/users/${targetUser.id}`, { status: newStatus });
            setUsers(users.map(u => u.id === targetUser.id ? { ...u, status: newStatus } : u));
        } catch (err) {
            console.error('Error al cambiar el acceso del usuario', err);
        }
    };

    // Cambiar rol
    const handleChangeRole = async (targetUser) => {
        if (!isAdmin) return;
        const newRole = targetUser.role?.toLowerCase() === 'admin' ? 'operator' : 'admin';
        try {
            await api.patch(`/users/${targetUser.id}`, { role: newRole });
            setUsers(users.map(u => u.id === targetUser.id ? { ...u, role: newRole } : u));
        } catch (err) {
            console.error('Error al cambiar el rol del usuario', err);
        }
    };

    // Iniciales para avatar
    const getInitials = (name = '') => {
        const parts = name.trim().split(' ');
        if (parts.length >= 2 && parts[0] && parts[1]) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.slice(0, 2).toUpperCase() || 'US';
    };

    // Registrar / Invitar usuario
    const handleInviteSubmit = async (e) => {
        e.preventDefault();
        if (!isAdmin) return;
        setInviteError('');
        setInviteLoading(true);

        try {
            await api.post('v1/auth/register', {
                email: inviteData.email,
                password: 'Password123!',
                fullName: inviteData.name,
                role: inviteData.role
            });
            setShowInviteModal(false);
            setInviteData({ name: '', email: '', role: 'operator' });
            fetchUsersFromMovements();
        } catch (err) {
            setInviteError(err.response?.data?.message || 'Error al enviar la invitación.');
        } finally {
            setInviteLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-[#0D1117] space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#FE2C55]"></div>
                <span className="text-gray-400 font-medium text-sm">Cargando gestión de usuarios...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 text-gray-200 font-sans p-2">
            {/* Header completo de User Management */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center space-x-3">
                        <h1 className="text-2xl font-bold text-white tracking-tight">Gestión de usuarios</h1>
                        <span className="text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
                            Solo el staff y los administradores pueden invitar y gestionar usuarios
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Gestión del acceso, los roles y los permisos del equipo.</p>
                </div>
                {isAdmin && (
                    <button 
                        onClick={() => setShowInviteModal(true)}
                        className="bg-[#FE2C55] hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-md shadow-blue-600/10 self-start sm:self-center"
                    >
                        + Invitar miembro del equipo
                    </button>
                )}
            </div>

            {/* Las 4 Tarjetas de Métricas de la Interfaz */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#161B22] border border-gray-800/80 rounded-2xl p-4 flex flex-col justify-between h-24">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">TOTAL</span>
                    <p className="text-2xl font-extrabold text-white tracking-tight">{totalUsers}</p>
                </div>
                <div className="bg-[#161B22] border border-gray-800/80 rounded-2xl p-4 flex flex-col justify-between h-24">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">ADMINS</span>
                    <p className="text-2xl font-extrabold text-purple-400 tracking-tight">{adminCount}</p>
                </div>
                <div className="bg-[#161B22] border border-gray-800/80 rounded-2xl p-4 flex flex-col justify-between h-24">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">ACTIVE</span>
                    <p className="text-2xl font-extrabold text-emerald-400 tracking-tight">{activeCount}</p>
                </div>
                <div className="bg-[#161B22] border border-gray-800/80 rounded-2xl p-4 flex flex-col justify-between h-24">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">RESTRICTED</span>
                    <p className="text-2xl font-extrabold text-red-400 tracking-tight">{restrictedCount}</p>
                </div>
            </div>

            {/* Banner de error si falla la petición */}
            {error && (
                <div className="p-4 bg-red-900/20 border border-red-800/60 text-red-400 rounded-xl text-sm font-medium">
                    {error}
                </div>
            )}

            {/* Tabla Principal */}
            <div className="bg-[#161B22] border border-gray-800/80 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-800/60 bg-[#1f242c]/40 text-gray-400 text-[11px] font-semibold uppercase tracking-wider">
                                <th className="px-6 py-3.5">MEMBER</th>
                                <th className="px-6 py-3.5">EMAIL</th>
                                <th className="px-6 py-3.5">ROLE</th>
                                <th className="px-6 py-3.5">STATUS</th>
                                <th className="px-6 py-3.5 text-center">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/40 text-sm">
                            {users.length > 0 ? (
                                users.map((u) => {
                                    const isRestricted = u.status?.toLowerCase() === 'restricted';
                                    return (
                                        <tr key={u.id} className="hover:bg-[#1f242c]/20 transition-colors">
                                            <td className="px-6 py-4 flex items-center space-x-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400">
                                                    {getInitials(u.name)}
                                                </div>
                                                <span className="font-semibold text-white truncate max-w-[150px]">
                                                    {u.name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-400 truncate max-w-[180px]">{u.email}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded text-xs font-semibold capitalize ${u.role?.toLowerCase() === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/15' : 'bg-gray-700/30 text-gray-400 border border-gray-700/50'}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${isRestricted ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${isRestricted ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                                                    <span>{isRestricted ? 'Restricted' : 'Active'}</span>
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center space-x-2">
                                                {isAdmin ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleToggleAccess(u)}
                                                            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-xs font-medium rounded-lg text-gray-300 transition"
                                                        >
                                                            {isRestricted ? 'Activate' : 'Restrict'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleChangeRole(u)}
                                                            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-xs font-medium rounded-lg text-gray-300 transition"
                                                        >
                                                            Change Role
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            disabled
                                                            className="px-3 py-1 bg-gray-800/40 text-xs font-medium rounded-lg text-gray-600 cursor-not-allowed opacity-50"
                                                        >
                                                            Solo Admin
                                                        </button>
                                                        <button
                                                            disabled
                                                            className="px-3 py-1 bg-gray-800/40 text-xs font-medium rounded-lg text-gray-600 cursor-not-allowed opacity-50"
                                                        >
                                                            Solo Admin
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                                        No se encontraron miembros en el equipo.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Invitación */}
            {showInviteModal && isAdmin && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#161B22] border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                            <h2 className="text-lg font-bold text-white">Invite Team Member</h2>
                            <button
                                onClick={() => setShowInviteModal(false)}
                                className="text-gray-400 hover:text-white transition font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        {inviteError && (
                            <div className="p-3 bg-red-900/20 border border-red-800/60 text-red-400 rounded-xl text-xs font-medium">
                                {inviteError}
                            </div>
                        )}

                        <form onSubmit={handleInviteSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={inviteData.name}
                                    onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
                                    className="w-full bg-[#0D1117] border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={inviteData.email}
                                    onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                                    className="w-full bg-[#0D1117] border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                                    placeholder="johndoe@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                                    Role Type
                                </label>
                                <select
                                    value={inviteData.role}
                                    onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
                                    className="w-full bg-[#0D1117] border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition font-medium"
                                >
                                    <option value="staff">Staff/Dueño</option>
                                    <option value="admin">Administrator</option>
                                    <option value="operator">Operator</option>
                                </select>
                            </div>

                            <div className="flex justify-end space-x-3 pt-2 border-t border-gray-800">
                                <button
                                    type="button"
                                    onClick={() => setShowInviteModal(false)}
                                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-xl text-xs font-semibold transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={inviteLoading}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition disabled:opacity-50"
                                >
                                    {inviteLoading ? 'Sending...' : 'Send Invite'}
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