import { useState } from 'react';

const Register = () => {
    // Estado para controlar únicamente la selección visual del rol
    const [role, setRole] = useState('admin');

    return (
        <div className="min-h-screen bg-[#0C1017] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#161B22] border border-gray-800 rounded-2xl p-8 shadow-2xl space-y-6">
                
                {/* Header del Formulario */}
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white tracking-wide">Crear una Cuenta</h1>
                    <p className="text-xs text-gray-400 mt-1.5">
                        Ingresa tus datos para registrarte en la plataforma
                    </p>
                </div>

                <form className="space-y-4">
                    {/* Selector SIGN IN AS / TIPO DE CUENTA */}
                    <div>
                        <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-wider">
                            SIGN IN AS
                        </label>
                        <div className="bg-[#0C1017] p-1.5 rounded-2xl border border-gray-800 flex items-center space-x-1">
                            <button
                                type="button"
                                onClick={() => setRole('admin')}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                                    role === 'admin'
                                        ? 'bg-[#FE2C55] text-black shadow-lg shadow-[#10B981]/20'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                Operador / Admin
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('owner')}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                                    role === 'owner'
                                        ? 'bg-[#FE2C55] text-black shadow-lg shadow-[#10B981]/20'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                Dueño
                            </button>
                        </div>
                    </div>

                    {/* Nombre Completo */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                            Nombre Completo
                        </label>
                        <input
                            type="text"
                            placeholder="Ej. Juan Pérez"
                            className="w-full px-3.5 py-2.5 bg-[#0C1017] border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FE2C55] transition"
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
                        />
                    </div>

                    {/* Botón de Submit */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            className="w-full py-3 bg-[#FE2C55] hover:bg-[#e02447] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-[#FE2C55]/20"
                        >
                            Registrarse
                        </button>
                    </div>
                </form>

                {/* Footer del card */}
                <div className="text-center pt-2 border-t border-gray-800/80">
                    <p className="text-xs text-gray-400">
                        ¿Ya tienes una cuenta?{' '}
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