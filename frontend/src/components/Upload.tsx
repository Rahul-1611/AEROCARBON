
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Upload as UploadIcon, FileText, Scan, Map, Shield, CheckCircle, Loader, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSeedling } from '@fortawesome/free-solid-svg-icons';

// Types for our particle system
interface Particle {
    id: number;
    x: number;
    y: number;
    size: number;
    duration: number;
    delay: number;
}

const Upload: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);

    const navigate = useNavigate();

    // Background Particles
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        // Generate random particles
        const newParticles = Array.from({ length: 30 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100, // percentage
            y: Math.random() * 100 + 100, // start below screen
            size: Math.random() * 4 + 1,
            duration: Math.random() * 20 + 10,
            delay: Math.random() * 5
        }));
        setParticles(newParticles);
    }, []);

    // Refs for drag handling
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            // Animate out or show success before navigating?
            // For now, let's navigate after a brief delay to show the "success" state
            setTimeout(() => {
                navigate(`/invoice/${response.data.doc_id}`);
            }, 1000);
        } catch (error) {
            console.error(error);
            setUploading(false);
        }
    };

    // Animation Variants
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.2 }
        }
    };

    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 300, damping: 24 }
        }
    };

    return (
        <div className="relative w-full h-screen overflow-hidden bg-slate-950 text-slate-100 flex items-center justify-center">

            {/* Background: Floating Particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {particles.map((p) => (
                    <motion.div
                        key={p.id}
                        className="absolute rounded-full bg-emerald-500/30"
                        style={{
                            left: `${p.x}%`,
                            width: p.size,
                            height: p.size,
                        }}
                        initial={{ y: "110vh", opacity: 0 }}
                        animate={{
                            opacity: [0, 0.8, 0],
                            // Accelerate if dragging
                            y: isDragging ? "50%" : "-10vh",
                            x: isDragging ? "50%" : `${p.x}%`, // Move towards center if dragging (simplified)
                        }}
                        transition={{
                            duration: isDragging ? 1 : p.duration,
                            repeat: Infinity,
                            delay: p.delay,
                            ease: "linear"
                        }}
                    />
                ))}

                {/* Floating Invoice Icons (Background Decor) */}
                <motion.div
                    initial={{ x: -100, y: 100, opacity: 0 }}
                    animate={{ x: 100, y: -100, opacity: 0.1 }}
                    transition={{ duration: 25, repeat: Infinity, repeatType: "reverse" }}
                    className="absolute top-1/4 left-1/4 text-slate-700"
                >
                    <FileText size={120} />
                </motion.div>
                <motion.div
                    initial={{ x: 100, y: 400, opacity: 0 }}
                    animate={{ x: -50, y: 200, opacity: 0.05 }}
                    transition={{ duration: 30, repeat: Infinity, repeatType: "reverse" }}
                    className="absolute bottom-1/3 right-1/4 text-slate-700"
                >
                    <FileText size={80} />
                </motion.div>
            </div>

            {/* Header / Logo */}
            <div className="absolute top-0 left-0 w-full p-6 md:p-8 z-50 flex justify-between items-center animate-fade-in-up">
                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_15px_-5px_rgba(99,230,190,0.5)] group-hover:border-emerald-500/50 transition-all duration-300">
                        <FontAwesomeIcon icon={faSeedling} style={{ color: "rgba(99, 230, 190, 1)", fontSize: '1.25rem' }} />
                    </div>
                    <div className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tighter">
                        AEROCARBON
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <motion.div
                className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8 p-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >

                {/* Left/Center: Gravity Well (Upload Zone) */}
                <motion.div className="lg:col-span-2 flex flex-col justify-center items-center" variants={itemVariants}>
                    <div className="text-center mb-8">
                        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 mb-4">
                            Invoice Upload
                        </h1>
                        <p className="text-slate-400 text-lg">
                            Upload your invoice to get started.
                        </p>
                    </div>

                    {/* The Gravity Well */}
                    <motion.div
                        className={`relative w-full max-w-xl aspect-[4/3] rounded-3xl border-2 border-dashed transition-all duration-500 flex flex-col items-center justify-center cursor-pointer overflow-hidden backdrop-blur-sm
                            ${isDragging
                                ? 'border-emerald-400 bg-emerald-500/10 shadow-[0_0_50px_rgba(52,211,153,0.3)] scale-105'
                                : 'border-slate-700 bg-slate-900/50 hover:border-slate-500'
                            }
                            ${file ? 'border-emerald-500/50 bg-slate-900/80' : ''}
                        `}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => inputRef.current?.click()}
                        animate={isDragging ? { scale: 1.02 } : { scale: 1 }}
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            className="hidden"
                            onChange={handleFileChange}
                            accept=".pdf,.png,.jpg,.jpeg"
                        />

                        {/* Aura Effect */}
                        <div className={`absolute inset-0 bg-gradient-to-b from-transparent to-emerald-500/5 opacity-0 transition-opacity duration-500 ${isDragging ? 'opacity-100' : ''}`} />

                        <AnimatePresence mode="wait">
                            {file ? (
                                <motion.div
                                    key="file-selected"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    className="flex flex-col items-center gap-4 p-8 text-center"
                                >
                                    <div className="relative">
                                        <FileText className="w-20 h-20 text-emerald-400" />
                                        <motion.div
                                            className="absolute -top-2 -right-2 bg-emerald-500 text-slate-900 rounded-full p-1"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            <CheckCircle className="w-5 h-5" />
                                        </motion.div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-white mb-1">{file.name}</h3>
                                        {/* <p className="text-slate-400 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p> */}
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                        className="text-sm text-red-400 hover:text-red-300 transition-colors mt-2"
                                        disabled={uploading}
                                    >
                                        Remove File
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="idle"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center gap-6 p-8 text-center pointer-events-none"
                                >
                                    <motion.div
                                        animate={isDragging ? { y: 10, scale: 1.1 } : { y: 0, scale: 1 }}
                                        transition={{ type: "spring", stiffness: 300 }}
                                    >
                                        <UploadIcon className={`w-24 h-24 ${isDragging ? 'text-emerald-400' : 'text-slate-600'}`} />
                                    </motion.div>
                                    <div className="space-y-2">
                                        <p className="text-2xl font-medium text-slate-300">
                                            Drag & Drop your invoice here
                                        </p>
                                        <p className="text-slate-500">
                                            or click to browse from your computer
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* CTA Button */}
                    <AnimatePresence>
                        {file && !uploading && (
                            <motion.button
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 20, opacity: 0 }}
                                className="mt-8 group relative px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-lg shadow-[0_0_20px_rgba(16,185,129,0.5)] hover:shadow-[0_0_40px_rgba(16,185,129,0.7)] transition-all flex items-center gap-3 overflow-hidden"
                                onClick={handleUpload}
                            >
                                <span className="relative z-10">Initiate Analysis</span>
                                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </motion.button>
                        )}
                        {uploading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-8 flex items-center gap-3 text-emerald-400 bg-emerald-500/10 px-6 py-3 rounded-full border border-emerald-500/20"
                            >
                                <Loader className="w-5 h-5 animate-spin" />
                                <span className="font-mono">Processing Invoice Data...</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>


                {/* Right: Agent Status Rail */}
                <motion.div className="flex flex-col justify-center gap-4" variants={itemVariants}>
                    <h3 className="text-slate-500 font-mono text-xs uppercase tracking-widest mb-2 pl-2">
                        System Status
                    </h3>

                    <StatusCard
                        icon={Scan}
                        title="OCR Extractor"
                        status="Ready"
                        statusColor="text-emerald-400"
                        active={true}
                    />
                    <StatusCard
                        icon={Map}
                        title="Carbon Mapper"
                        status={uploading ? "Analyzing..." : "Awaiting Data"}
                        statusColor={uploading ? "text-amber-400" : "text-slate-500"}
                        active={uploading}
                        delay={0.1}
                    />
                    <StatusCard
                        icon={Shield}
                        title="Strategy Auditor"
                        status={uploading ? "Queueing..." : "Awaiting Data"}
                        statusColor={uploading ? "text-slate-400" : "text-slate-500"}
                        active={false}
                        delay={0.2}
                    />

                    {/* Decorative Info Block */}
                    <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 backdrop-blur-md">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-mono text-emerald-400">LIVE CONNECTION</span>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            AeroCarbon agents are standing by to process your emissions data in real-time.
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

// Start Card Component
const StatusCard: React.FC<{
    icon: React.ElementType;
    title: string;
    status: string;
    statusColor: string;
    active: boolean;
    delay?: number;
}> = ({ icon: Icon, title, status, statusColor, active, delay = 0 }) => {
    return (
        <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 + delay }}
            className={`flex items-center gap-4 p-5 rounded-2xl border backdrop-blur-md transition-all duration-300
                ${active
                    ? 'bg-slate-800/80 border-emerald-500/30 shadow-lg shadow-emerald-900/20'
                    : 'bg-slate-900/40 border-slate-800 hover:bg-slate-800/60'
                }
            `}
        >
            <div className={`p-3 rounded-xl ${active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                <Icon size={24} />
            </div>
            <div>
                <h4 className={`font-semibold ${active ? 'text-white' : 'text-slate-400'}`}>{title}</h4>
                <p className={`text-xs font-mono mt-1 ${statusColor}`}>{status}</p>
            </div>
            {active && (
                <div className="ml-auto">
                    <Loader className="w-4 h-4 animate-spin text-emerald-500" />
                </div>
            )}
        </motion.div>
    );
};

export default Upload;
