import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const Register = () => {
    const [companyName, setCompanyName] = useState('');
    const [serverCode, setServerCode] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    // Función para generar un código aleatorio único con formato XXXXX-XXXXX-XXXXX
    const generateServerCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const generateSegment = () => {
            let segment = '';
            for (let i = 0; i < 5; i++) {
                segment += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return segment;
        };
        const randomCode = `${generateSegment()}-${generateSegment()}-${generateSegment()}`;
        setServerCode(randomCode);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validación estricta del formato del Código de Servidor (Ej. JDU73-IEH83-OH382)
        const serverCodeRegex = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/;
        const formattedCode = serverCode.toUpperCase();

        if (!serverCodeRegex.test(formattedCode)) {
            setError('El código de servidor debe tener el formato exacto: ABC12-DEF34-GHI56 (bloques de 5 caracteres separados por guiones).');
            return;
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        setLoading(true);

        try {
            // Enviamos los datos ajustados al backend multi-tenant
            await register({
                company_name: companyName,
                server_code: formattedCode,
                name,
                email,
                password,
                password_confirmation: confirmPassword,
            });
            navigate('/login', { state: { serverCode: formattedCode, registered: true } });
        } catch (error) {
            const validationErrors = Object.values(error.response?.data?.errors || {}).flat();
            const message = validationErrors[0] || error.response?.data?.message || 'Error al registrar la empresa';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0C1017] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#161B22] border border-gray-800 rounded-2xl p-8 shadow-2xl space-y-6">

                {/* Header del Formulario */}
                <div className="text-center">
                    <h1 className="text-[20px] font-bold text-[#FE2C55] uppercase tracking-wide">Crear registro para tu negocio</h1>
                    <p className="text-xs text-gray-400 mt-1.5">
                        Registra tu organización y define tu código de servidor
                    </p>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* Nombre de la Empresa */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                            Nombre de la Empresa
                        </label>
                        <input
                            type="text"
                            placeholder="Ej. Mi Empresa S.A."
                            className="w-full px-3.5 py-2.5 bg-[#0C1017] border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FE2C55] transition"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            required
                        />
                    </div>

                    {/* Código de Servidor Personalizado (Server Code) */}
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Código de Servidor (Server Code)
                            </label>
                            <button
                                type="button"
                                onClick={generateServerCode}
                                className="text-[11px] text-[#FE2C55] hover:underline font-medium cursor-pointer"
                            >
                                Generar Automático
                            </button>
                        </div>
                        <input
                            type="text"
                            placeholder="Ej. JDU73-IEH83-OH382"
                            className="w-full px-3.5 py-2.5 bg-[#0C1017] border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FE2C55] transition uppercase"
                            value={serverCode}
                            onChange={(e) => setServerCode(e.target.value)}
                            required
                        />
                        <p className="text-[10px] text-gray-500 mt-1">Formato requerido: XXXXX-XXXXX-XXXXX</p>
                    </div>

                    {/* Nombre Completo del Administrador / Staff */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                            Nombre del Administrador (Staff)
                        </label>
                        <input
                            type="text"
                            placeholder="Ej. Juan Pérez"
                            className="w-full px-3.5 py-2.5 bg-[#0C1017] border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FE2C55] transition"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    {/* Correo Electrónico */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                            Correo Electrónico
                        </label>
                        <input
                            type="email"
                            placeholder="usuario@ejemplo.com"
                            className="w-full px-3.5 py-2.5 bg-[#0C1017] border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FE2C55] transition"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    {/* Contraseña */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full px-3.5 py-2.5 bg-[#0C1017] border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FE2C55] transition"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={10}
                            maxLength={255}
                            required
                        />
                    </div>

                    {/* Confirmar Contraseña */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                            Confirmar Contraseña
                        </label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full px-3.5 py-2.5 bg-[#0C1017] border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FE2C55] transition"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            minLength={10}
                            maxLength={255}
                            required
                        />
                    </div>

                    {/* Botón de Submit */}
                    <div className="pt-2">
                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full py-3 bg-[#FE2C55] hover:bg-[#e02447] text-white rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-50 transition shadow-lg shadow-[#FE2C55]/20 cursor-pointer"
                        >
                            <span>{loading ? 'Registrando empresa...' : 'Registrar Empresa y Cuenta'}</span>
                        </button>
                    </div>
                </form>

                {/* Footer del card */}
                <div className="text-center pt-2 border-t border-gray-800/80">
                    <p className="text-xs text-gray-400">
                        ¿Ya tienes una cuenta o código de servidor?{' '}
                        <a href="/login" className="text-[#FE2C55] font-semibold hover:underline">
                            Iniciar sesión
                        </a>
                    </p>
                </div>

            </div>
        </div>
    );
};

export default Register;
