import React from 'react';
import { Link } from 'react-router-dom';
import { Upload as UploadIcon, LayoutDashboard, Shield, Zap, ArrowRight, Activity, Box } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSeedling } from '@fortawesome/free-solid-svg-icons';
import ParticlesBackground from './ParticlesBackground';

const LandingPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-hidden selection:bg-emerald-500/30">
            {/* Dynamic Background */}
            <ParticlesBackground />
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.1] pointer-events-none"></div>

            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[120px] animate-float"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-cyan-500/15 rounded-full blur-[120px] animate-float-delayed"></div>
            </div>

            {/* Navbar */}
            <nav className="p-6 md:p-8 relative z-10 flex justify-between items-center animate-fade-in-up" style={{ animationDelay: '0ms' }}>
                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.location.reload()}>
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_15px_-5px_rgba(99,230,190,0.5)] group-hover:border-emerald-500/50 transition-all duration-300">
                        <FontAwesomeIcon icon={faSeedling} style={{ color: "rgba(99, 230, 190, 1)", fontSize: '1.25rem' }} />
                    </div>
                    <div className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tighter">
                        AEROCARBON
                    </div>
                </div>
                {/* <div className="text-xs font-mono text-slate-500 border border-slate-800 px-2 py-1 rounded-full">v1.2.0-beta</div> */}
            </nav>

            {/* Hero Section */}
            <main className="flex-1 container mx-auto px-4 md:px-8 flex flex-col items-center justify-center text-center relative z-10 py-10 md:py-20">

                <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/50 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-8 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)] backdrop-blur-sm">
                        <Zap className="w-3 h-3 fill-emerald-400" />
                        <span>AI-Powered Analysis</span>
                    </div>
                </div>

                <h1 className="animate-fade-in-up text-5xl md:text-7xl lg:text-8xl font-black mb-8 tracking-tighter leading-[1.1]" style={{ animationDelay: '200ms' }}>
                    Emission <br className="hidden md:block" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 animate-title">
                        Intelligence
                    </span>
                </h1>

                <p className="animate-fade-in-up text-slate-400 text-lg md:text-xl max-w-2xl mb-12 leading-relaxed font-light" style={{ animationDelay: '300ms' }}>
                    Automate your Scope 3 calculations.
                    Upload invoices to instantly extract data, map carbon factors, and generate audit-ready reports.
                </p>

                {/* Main Action Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                    <Link
                        to="/upload"
                        className="group relative p-1 bg-gradient-to-br from-slate-700 to-slate-800 rounded-3xl hover:from-emerald-500 hover:to-cyan-500 transition-all duration-300 shadow-2xl shadow-black/50 hover:shadow-emerald-500/20"
                    >
                        <div className="bg-slate-900 h-full w-full rounded-[20px] p-8 flex flex-col items-start relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-32 bg-emerald-500/5 rounded-full blur-[60px] group-hover:bg-emerald-500/10 transition-colors"></div>

                            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                                <UploadIcon className="w-8 h-8 text-emerald-400" />
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                                Upload Invoice
                                <ArrowRight className="w-5 h-5 text-emerald-500 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                            </h3>
                            <p className="text-slate-400 text-sm leading-relaxed text-left">
                                Start a new analysis. Our AI extracts line items and assigns standard emission factors automatically.
                            </p>
                        </div>
                    </Link>

                    <Link
                        to="/dashboard"
                        className="group relative p-1 bg-gradient-to-br from-slate-700 to-slate-800 rounded-3xl hover:from-cyan-500 hover:to-blue-500 transition-all duration-300 shadow-2xl shadow-black/50 hover:shadow-cyan-500/20"
                    >
                        <div className="bg-slate-900 h-full w-full rounded-[20px] p-8 flex flex-col items-start relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-32 bg-cyan-500/5 rounded-full blur-[60px] group-hover:bg-cyan-500/10 transition-colors"></div>

                            <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-6 border border-cyan-500/20 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                                <LayoutDashboard className="w-8 h-8 text-cyan-400" />
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                                Dashboard
                                <ArrowRight className="w-5 h-5 text-cyan-500 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                            </h3>
                            <p className="text-slate-400 text-sm leading-relaxed text-left">
                                Track your impact. Visualize emission trends, view history, and download aggregated reports.
                            </p>
                        </div>
                    </Link>
                </div>

                {/* Feature Pills */}
                <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 w-full max-w-5xl animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                    <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/50 transition-colors">
                        <Activity className="w-8 h-8 text-emerald-500 mb-4" />
                        <div className="font-bold text-white text-lg mb-1">Real-time Factors</div>
                        <div className="text-sm text-slate-500">Live API connection to latest emission databases.</div>
                    </div>
                    <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/50 transition-colors">
                        <Shield className="w-8 h-8 text-purple-500 mb-4" />
                        <div className="font-bold text-white text-lg mb-1">Audit Trail</div>
                        <div className="text-sm text-slate-500">Full transparency on every calculation step.</div>
                    </div>
                    <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/50 transition-colors">
                        <Box className="w-8 h-8 text-blue-500 mb-4" />
                        <div className="font-bold text-white text-lg mb-1">GHG Protocol</div>
                        <div className="text-sm text-slate-500">Fully compliant categorization and reporting.</div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="p-6 text-center text-slate-600 text-sm relative z-10 animate-fade-in-up" style={{ animationDelay: '800ms' }}>
                &copy; {new Date().getFullYear()} AEROCARBON.
            </footer>
        </div>
    );
};

export default LandingPage;
