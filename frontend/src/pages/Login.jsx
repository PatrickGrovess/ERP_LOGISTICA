import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Login = () => {
    const location = useLocation();
    const [serverCode, setServerCode] = useState(location.state?.serverCode || '');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('staff'); // 'staff' u 'operator'

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [recoveringServerCode, setRecoveringServerCode] = useState(false);
    const [recoveryMessage, setRecoveryMessage] = useState('');

    const { login } = useAuth();
    const navigate = useNavigate();
    const registered = location.state?.registered === true;

    const handleRecoverServerCode = async () => {
        setRecoveryMessage('');
        if (!email.trim() || !password) {
            setRecoveryMessage('Escribe el correo y la contraseña del dueño para verificar la cuenta.');
            return;
        }

        setRecoveringServerCode(true);
        try {
            const response = await api.post('v1/auth/recover-server-code', { email, password });
            setServerCode(response.data.server_code);
            setRecoveryMessage(`Cuenta verificada. Tu código de servidor es: ${response.data.server_code}`);
        } catch (recoveryError) {
            setRecoveryMessage(recoveryError.response?.data?.message || 'No se pudo verificar la cuenta con esos datos.');
        } finally {
            setRecoveringServerCode(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Se envían todos los parámetros exigidos por el backend
            await login({
                server_code: serverCode.toUpperCase(),
                email,
                password,
                role
            });
            navigate('/dashboard');
        } catch (error) {
            const message = error.response?.data?.message || 'Error al iniciar sesión';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0C1017] p-4 font-sans text-gray-200">
            <div className="max-w-md w-full bg-[#161B22] border border-gray-800/80 rounded-2xl shadow-2xl p-8 space-y-6">

                {/* Header / Logo */}
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#FE2C55]/10 border border-[#FE2C55]/20 text-[#FE2C55] mb-2">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">
                        Iniciar Sesión
                    </h2>
                    <p className="text-sm text-gray-400">
                        Plataforma de gestión de inventario
                    </p>
                </div>

                {registered && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-xl text-sm text-center">
                        Empresa creada. Conserva el código de servidor que aparece en el formulario para próximos inicios de sesión.
                    </div>
                )}

                {/* Error Banner */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Selector SIGN IN AS / TIPO DE ROL */}
                    <div>
                        <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-wider">
                            SIGN IN AS
                        </label>
                        <div className="bg-[#0C1017] p-1.5 rounded-2xl border border-gray-800 flex items-center space-x-1">
                            <button
                                type="button"
                                onClick={() => setRole('staff')}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${role === 'staff'
                                    ? 'bg-[#FE2C55] text-white shadow-lg shadow-[#FE2C55]/20'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                Staff User (Dueño)
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('admin')}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${role === 'admin'
                                    ? 'bg-[#FE2C55] text-white shadow-lg shadow-[#FE2C55]/20'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                Admin
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('operator')}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${role === 'operator'
                                    ? 'bg-[#FE2C55] text-white shadow-lg shadow-[#FE2C55]/20'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                Operador
                            </button>
                        </div>
                    </div>

                    {/* Server Code */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                            Código de Servidor (Server Code)
                        </label>
                        <input
                            type="text"
                            value={serverCode}
                            onChange={(e) => setServerCode(e.target.value.toUpperCase())}
                            maxLength={17}
                            required
                            className="w-full px-4 py-3 bg-[#0C1017] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#FE2C55] focus:ring-1 focus:ring-[#FE2C55] transition-all duration-200 uppercase"
                            placeholder="Ej. JDU73-IEH83-OH382"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                            Correo
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-[#0C1017] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#FE2C55] focus:ring-1 focus:ring-[#FE2C55] transition-all duration-200"
                            placeholder="usuario@empresa.com"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                                Contraseña
                            </label>
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-[#0C1017] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#FE2C55] focus:ring-1 focus:ring-[#FE2C55] transition-all duration-200"
                            placeholder="••••••••"
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#FE2C55] hover:bg-[#e02649] text-white font-medium py-3 px-4 rounded-xl transition duration-200 disabled:opacity-50 flex items-center justify-center space-x-2 shadow-lg shadow-[#FE2C55]/20 mt-2"
                    >
                        <span>{loading ? 'Ingresando...' : 'Iniciar sesión'}</span>
                        {!loading && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        )}
                    </button>
                </form>

                {role === 'staff' && (
                    <div className="text-center space-y-2">
                        <button
                            type="button"
                            onClick={handleRecoverServerCode}
                            disabled={recoveringServerCode}
                            className="text-xs text-[#FE2C55] hover:underline disabled:opacity-50"
                        >
                            {recoveringServerCode ? 'Verificando cuenta...' : '¿Olvidaste el código de servidor?'}
                        </button>
                        {recoveryMessage && (
                            <p className={`text-xs rounded-xl px-3 py-2 ${recoveryMessage.startsWith('Cuenta verificada') ? 'text-emerald-300 bg-emerald-500/10' : 'text-amber-300 bg-amber-500/10'}`}>
                                {recoveryMessage}
                            </p>
                        )}
                        <p className="text-[10px] text-gray-500">Se verifica con el correo y la contraseña del dueño. Máximo 5 intentos por minuto.</p>
                    </div>
                )}

                <div className="text-center space-y-3">
                    <p className="text-sm text-gray-400">
                        <a href="/register" className="text-[#FE2C55] hover:underline font-medium"><span className="text-gray-400">¿No tienes una cuenta? </span> Regístrate</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
