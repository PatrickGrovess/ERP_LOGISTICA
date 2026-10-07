import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const FloatingAssistants = () => {
    const { user } = useAuth();
    
    // Control de modales flotantes (solo uno abierto a la vez)
    const [activeWidget, setActiveWidget] = useState(null); // null | 'ai' | 'support'
    const [prompt, setPrompt] = useState('');

    const toggleWidget = (widget) => {
        setActiveWidget(prev => prev === widget ? null : widget);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-3">
            
            {/* WIDGET 1: PANEL ASISTENTE IA (AI Insights) */}
            {activeWidget === 'ai' && (
                <div className="w-[360px] sm:w-[400px] bg-[#161B22] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden mb-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
                    {/* Header IA */}
                    <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-[#0C1017]/60">
                        <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-xl bg-[#FE2C55]/10 border border-[#FE2C55]/20 flex items-center justify-center text-[#FE2C55]">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white tracking-wide">AI Insights</h3>
                                <p className="text-[10px] text-gray-400">Updated just now</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setActiveWidget(null)}
                            className="text-gray-400 hover:text-white p-1 transition"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Cuerpo de Insights */}
                    <div className="p-4 space-y-3 max-h-[420px] overflow-y-auto">
                        {/* Greeting Card */}
                        <div className="bg-[#0C1017]/80 border border-red-500/10 rounded-xl p-3.5">
                            <h4 className="text-xs font-bold text-white">Good afternoon, {user?.name || 'Usuario'}</h4>
                            <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                                Here are the highest-impact actions based on your latest business activity.
                            </p>
                        </div>

                        <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider pt-1">
                            Recommended Actions
                        </span>

                        {/* Recommendation 1 */}
                        <div className="bg-[#0C1017] border border-gray-800/80 rounded-xl p-3 hover:border-gray-700 transition">
                            <div className="flex items-center space-x-1.5 text-[10px] font-bold text-[#FE2C55] uppercase tracking-wider mb-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#FE2C55]"></span>
                                <span>RETENTION RISK</span>
                            </div>
                            <h5 className="text-xs font-bold text-white">3 members are at risk of churning this week</h5>
                            <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                                Daily usage is down 42% across these accounts. A personal check-in could improve retention.
                            </p>
                        </div>

                        {/* Recommendation 2 */}
                        <div className="bg-[#0C1017] border border-gray-800/80 rounded-xl p-3 hover:border-gray-700 transition">
                            <div className="flex items-center space-x-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                <span>GROWTH OPPORTUNITY</span>
                            </div>
                            <h5 className="text-xs font-bold text-white">Offer a $25 monthly upgrade to daily users</h5>
                            <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                                12 members have exceeded their plan average for three consecutive weeks.
                            </p>
                        </div>

                        {/* Recommendation 3 */}
                        <div className="bg-[#0C1017] border border-gray-800/80 rounded-xl p-3 hover:border-gray-700 transition">
                            <div className="flex items-center space-x-1.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                <span>INVENTORY SIGNAL</span>
                            </div>
                            <h5 className="text-xs font-bold text-white">Restock keyboards before Friday</h5>
                        </div>
                    </div>

                    {/* Input Prompt IA */}
                    <div className="p-3 border-t border-gray-800 bg-[#0C1017]">
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Ask about your business..."
                                className="w-full pl-3 pr-10 py-2 bg-[#161B22] border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FE2C55] transition"
                            />
                            <button className="absolute right-1.5 p-1.5 bg-[#FE2C55] hover:bg-[#e02447] text-white rounded-lg transition shadow-md shadow-[#FE2C55]/20">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </button>
                        </div>
                        <p className="text-[9px] text-gray-500 text-center mt-2">
                            AI suggestions may require review before acting.
                        </p>
                    </div>
                </div>
            )}

            {/* WIDGET 2: PANEL DE SOPORTE */}
            {activeWidget === 'support' && (
                <div className="w-[320px] bg-[#161B22] border border-gray-800 rounded-2xl shadow-2xl p-5 mb-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-base font-bold text-white">How can we help?</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Choose the best way to get support.</p>
                        </div>
                        <button
                            onClick={() => setActiveWidget(null)}
                            className="text-gray-400 hover:text-white p-1 transition"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-3">
                        {/* Opción 1: Chat */}
                        <button className="w-full p-3 bg-[#0C1017] border border-gray-800 hover:border-gray-700 rounded-xl flex items-center justify-between text-left transition group">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-lg bg-[#FE2C55]/10 border border-[#FE2C55]/20 flex items-center justify-center text-[#FE2C55]">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-white">Chat with Support</h4>
                                    <p className="text-[10px] text-gray-400">Typical response under 5 minutes</p>
                                </div>
                            </div>
                            <svg className="w-4 h-4 text-gray-500 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </button>

                        {/* Opción 2: Documentación */}
                        <button className="w-full p-3 bg-[#0C1017] border border-gray-800 hover:border-gray-700 rounded-xl flex items-center justify-between text-left transition group">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-lg bg-[#FE2C55]/10 border border-[#FE2C55]/20 flex items-center justify-center text-[#FE2C55]">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-white">Read Documentation</h4>
                                    <p className="text-[10px] text-gray-400">Browse guides and best practices</p>
                                </div>
                            </div>
                            <svg className="w-4 h-4 text-gray-500 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </button>

                        {/* Opción 3: Ticket */}
                        <button className="w-full p-3 bg-[#0C1017] border border-gray-800 hover:border-gray-700 rounded-xl flex items-center justify-between text-left transition group">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-lg bg-[#FE2C55]/10 border border-[#FE2C55]/20 flex items-center justify-center text-[#FE2C55]">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 001 1.5 2 2 0 011 1.5 2 2 0 01-1 1.5A2 2 0 003 17v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 00-1-1.5 2 2 0 01-1-1.5 2 2 0 011-1.5A2 2 0 0021 10V7a2 2 0 00-2-2H5z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-white">Submit a Ticket</h4>
                                    <p className="text-[10px] text-gray-400">We'll reply by email</p>
                                </div>
                            </div>
                            <svg className="w-4 h-4 text-gray-500 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* BOTONES FLOTANTES DE ACTIVACIÓN */}
            <div className="flex items-center space-x-3">
                {/* Botón Soporte */}
                <button
                    onClick={() => toggleWidget('support')}
                    className={`p-3.5 rounded-full shadow-2xl transition border ${
                        activeWidget === 'support'
                            ? 'bg-[#FE2C55] text-white border-[#FE2C55]'
                            : 'bg-[#161B22] text-gray-300 border-gray-800 hover:text-white hover:border-gray-700'
                    }`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>

                {/* Botón Asistente IA */}
                <button
                    onClick={() => toggleWidget('ai')}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-full shadow-2xl transition border font-semibold text-xs ${
                        activeWidget === 'ai'
                            ? 'bg-[#FE2C55] text-white border-[#FE2C55]'
                            : 'bg-[#161B22] text-white border-gray-800 hover:border-gray-700'
                    }`}
                >
                    <svg className="w-4 h-4 text-[#FE2C55]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>AI Insights</span>
                </button>
            </div>
        </div>
    );
};

export default FloatingAssistants;