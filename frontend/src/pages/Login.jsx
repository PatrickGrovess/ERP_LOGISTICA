import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login({ email, password });
            navigate('/dashboard');
        } catch (error) {
            // console.error('Error al iniciar sesión:', error);
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
                        Dashboard
                    </h2>
                    <p className="text-sm text-gray-400">
                        Plataforma de gestión de inventario
                    </p>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
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
                            placeholder="sarah.chen@chest.io"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                                Contraseña
                            </label>
                            <a href="#" className="text-xs text-[#FE2C55] hover:underline font-medium">
                                ¿Olvidaste tu contraseña?
                            </a>
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

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#FE2C55] hover:bg-[#e02649] text-white font-medium py-3 px-4 rounded-xl transition duration-200 disabled:opacity-50 flex items-center justify-center space-x-2 shadow-lg shadow-[#FE2C55]/20"
                    >
                        <span>{loading ? 'Ingresando...' : 'Iniciar sesión'}</span>
                        {!loading && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        )}
                    </button>
                </form>
                <div className="text-center space-y-3">
                    <p className="text-sm text-gray-400">
                         <a href="/register" className="text-[#FE2C55] hover:underline font-medium"><span className="text-gray-400">¿No tienes una cuenta? </span> Regístrate</a>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;