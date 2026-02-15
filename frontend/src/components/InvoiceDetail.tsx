import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { FinalResult } from '../types';
import { CheckCircle, AlertTriangle, FileText, Leaf, Globe, Shield, BarChart, LayoutDashboard, Upload as UploadIcon, Scan, Map } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSeedling } from '@fortawesome/free-solid-svg-icons';

const InvoiceDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [data, setData] = useState<FinalResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let isMounted = true;
        let timeoutId: any;

        const checkStatusAndFetch = async () => {
            try {
                // 1. Check current status
                const statusRes = await api.get(`/status/${id}`);
                const status = statusRes.data.status;

                if (status === 'finalized') {
                    // 2. If finalized, fetch the full invoice data
                    const invoiceRes = await api.get(`/invoice/${id}`);
                    if (isMounted) {
                        setData(invoiceRes.data);
                        setLoading(false);
                    }
                } else if (status === 'failed') {
                    if (isMounted) {
                        setError("Invoice processing failed. Please try again.");
                        setLoading(false);
                    }
                } else {
                    // 3. If still processing, poll again in 2 seconds
                    if (isMounted) {
                        timeoutId = setTimeout(checkStatusAndFetch, 2000);
                    }
                }
            } catch (err: any) {
                console.error("Polling error:", err);
                // If 404, it might not be created yet, so keep polling. 
                // Any other error, we might want to retry or fail.
                // For now, retry on error to be robust against transient network issues.
                if (isMounted) {
                    timeoutId = setTimeout(checkStatusAndFetch, 3000);
                }
            }
        };

        checkStatusAndFetch();

        return () => {
            isMounted = false;
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [id]);

    if (loading) {
        return <AgentFeed />;
    }
    if (error) return <div className="text-red-400 text-center mt-20">Error: {error}</div>;
    if (!data) return null;

    const { extraction, mapping, carbon, audit } = data;

    const isNotInvoice = audit.audit_flags.includes("Not an industry standard Invoice");

    return (
        <div className="w-full max-w-6xl mx-auto space-y-8 pb-20 pt-8">
            {/* Brand Logo */}
            <div className="flex items-center gap-3 group cursor-pointer w-fit mb-4" onClick={() => window.location.href = '/'}>
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_15px_-5px_rgba(99,230,190,0.5)] group-hover:border-emerald-500/50 transition-all duration-300">
                    <FontAwesomeIcon icon={faSeedling} style={{ color: "rgba(99, 230, 190, 1)", fontSize: '1.25rem' }} />
                </div>
                <div className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tighter">
                    AEROCARBON
                </div>
            </div>

            {isNotInvoice && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl flex items-center gap-4 text-red-400"
                >
                    <AlertTriangle className="w-8 h-8 shrink-0" />
                    <div>
                        <h3 className="text-lg font-bold">Not an industry standard Invoice</h3>
                        <p className="text-sm opacity-80">The uploaded document could not be reliably parsed as a standard invoice. Calculations may be inaccurate or incomplete.</p>
                    </div>
                </motion.div>
            )}

            {/* Header Navigation */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 bg-slate-800 p-4 rounded-xl border border-slate-700 gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Link to="/dashboard" className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 rounded-lg transition-all text-sm font-medium" title="Dashboard">
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                    </Link>
                    <Link to="/upload" className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 rounded-lg transition-all text-sm font-medium" title="Upload New Invoice">
                        <UploadIcon className="w-4 h-4" />
                        New Upload
                    </Link>
                </div>
                <div className="text-slate-500 font-mono text-xs w-full sm:w-auto text-center sm:text-right">ID: {data.doc_id}</div>
            </div>

            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Invoice Analysis</h1>
                </div>
                <div className={clsx(
                    "px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2",
                    audit.is_valid ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                )}>
                    {audit.is_valid ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {audit.is_valid ? "AUDIT PASSED" : "AUDIT FLAGGED"}
                </div>
            </div>

            {/* Top Stats - Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <div className="text-slate-400 text-sm mb-1">Total Amount</div>
                    <div className="text-2xl font-bold text-white">
                        {extraction.currency} {extraction.grand_total.toFixed(2)}
                    </div>
                </div>
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <div className="text-slate-400 text-sm mb-1">Carbon Impact</div>
                    <div className="text-xl font-bold text-emerald-400 flex items-center gap-2 whitespace-nowrap overflow-hidden">
                        <Leaf className="w-5 h-5 shrink-0" />
                        <span className="truncate" title={`${carbon.total_kg_co2e.toFixed(2)} kgCO2e`}>{carbon.total_kg_co2e.toFixed(2)}</span>
                        <span className="text-sm text-slate-500">kgCO2e</span>
                    </div>
                </div>
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col justify-between">
                    <div>
                        <div className="text-slate-400 text-sm mb-1 flex justify-between items-center">
                            NAICS Verification
                        </div>
                        <div className="text-xl font-bold text-white">
                            {carbon.naics_code || "N/A"}
                        </div>
                    </div>
                </div>
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <div className="text-slate-400 text-sm mb-1">Confidence Score</div>
                    <div className={clsx(
                        "text-2xl font-bold",
                        audit.confidence_score > 0.8 ? "text-emerald-400" : "text-yellow-400"
                    )}>
                        {(audit.confidence_score * 100).toFixed(1)}%
                    </div>
                </div>
            </div>

            {/* Top Stats - Row 2 */}
            <div className="grid grid-cols-1 gap-6">
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <div className="text-slate-400 text-sm mb-1">Impact Category</div>
                    <div className="text-xl font-bold text-white break-words" title={mapping.scope_category}>
                        {mapping.scope_category}
                    </div>
                </div>
            </div>

            {/* Detailed Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Environmental Equivalency */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                    <div className="p-4 bg-slate-700/50 border-b border-slate-700 flex items-center gap-2 font-bold text-white">
                        <Leaf className="w-4 h-4 text-emerald-400" /> Ecological Impact
                    </div>
                    <div className="p-8 flex flex-col items-center justify-center text-center">
                        <div className="relative mb-6">
                            <div className="w-32 h-32 rounded-full border-4 border-emerald-500/20 flex items-center justify-center">
                                <Leaf className="w-16 h-16 text-emerald-400 animate-pulse" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-900 font-bold text-lg w-12 h-12 rounded-full flex items-center justify-center border-4 border-slate-800">
                                {Math.ceil(carbon.total_kg_co2e / 21)}
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">
                            Full Grown Trees
                        </h3>
                        <p className="text-slate-400 text-sm max-w-sm">
                            It would take approximately <span className="text-emerald-400 font-bold">{Math.ceil(carbon.total_kg_co2e / 21)}</span> mature trees one full year to sequester the carbon emitted by this transaction.
                        </p>

                        <div className="mt-8 flex gap-1 flex-wrap justify-center max-w-[300px]">
                            {Array.from({ length: Math.min(Math.ceil(carbon.total_kg_co2e / 21), 24) }).map((_, i) => (
                                <Leaf key={i} className="w-4 h-4 text-emerald-500/40" />
                            ))}
                            {Math.ceil(carbon.total_kg_co2e / 21) > 24 && (
                                <span className="text-xs text-slate-500 font-bold">... +{Math.ceil(carbon.total_kg_co2e / 21) - 24} more</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Extracted Data */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                    <div className="p-4 bg-slate-700/50 border-b border-slate-700 flex items-center gap-2 font-bold text-white">
                        <FileText className="w-4 h-4 text-blue-400" /> Extracted Data
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-slate-500 uppercase">Vendor</label>
                                <div className="text-white">{extraction.vendor_name}</div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase">Invoice #</label>
                                <div className="text-white">{extraction.invoice_number}</div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase">Date</label>
                                <div className="text-white">{extraction.invoice_date}</div>
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="text-xs text-slate-500 uppercase mb-2 block">Line Items</label>
                            <div className="bg-slate-900 rounded-lg p-2 space-y-2 max-h-40 overflow-y-auto">
                                {extraction.line_items.map((item, i) => (
                                    <div key={i} className="flex justify-between text-sm p-2 bg-slate-800 rounded">
                                        <span className="text-slate-300">{item.description} (x{item.quantity})</span>
                                        <span className="text-white font-mono">{item.total.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Carbon Analysis */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                    <div className="p-4 bg-slate-700/50 border-b border-slate-700 flex items-center gap-2 font-bold text-white">
                        <Globe className="w-4 h-4 text-emerald-400" /> Carbon Analysis
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                <label className="text-[10px] text-slate-500 uppercase">Spend-based Impact</label>
                                <div className="text-white font-bold">{carbon.spend_based_kg_co2e.toFixed(2)} kg</div>
                            </div>
                            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                <label className="text-[10px] text-slate-500 uppercase">Logistics Impact</label>
                                <div className="text-emerald-400 font-bold">{carbon.logistics_kg_co2e.toFixed(2)} kg</div>
                            </div>
                        </div>

                        {carbon.distance_km && (
                            <div className="flex justify-between items-center bg-blue-900/10 p-3 rounded-lg border border-blue-900/30">
                                <label className="text-xs text-blue-300 font-medium">Estimated Shipping Distance</label>
                                <div className="text-blue-400 font-bold font-mono">{(carbon.distance_km * 0.621371).toFixed(1)} miles</div>
                            </div>
                        )}

                        <div>
                            <label className="text-xs text-slate-500 uppercase mb-2 block">Line-Level Emission Breakdown</label>
                            <div className="space-y-2">
                                {carbon.line_level_breakdown.map((item: any, i: number) => (
                                    <div key={i} className="flex justify-between text-sm p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                                        <span className="text-slate-300">{item.description}</span>
                                        <span className="text-emerald-400 font-mono">
                                            {item.item_emissions.toFixed(2)} kg
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Spend vs. Emission Efficiency */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                    <div className="p-4 bg-slate-700/50 border-b border-slate-700 flex items-center justify-between font-bold text-white">
                        <div className="flex items-center gap-2">
                            <BarChart className="w-4 h-4 text-purple-400" /> Efficiency Analysis
                        </div>
                        <div className="flex gap-3 text-[10px] uppercase font-bold">
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Spend</span>
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Emission</span>
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="space-y-4">
                            {(() => {
                                // Calculate totals
                                const totalSpend = extraction.grand_total || 1;
                                const totalEmission = carbon.total_kg_co2e || 1;

                                // Combine and sort items by emission % descending
                                const chartItems = carbon.line_level_breakdown.map((item: any, i: number) => {
                                    const lineItem = extraction.line_items[i] || {};
                                    const spendPct = ((lineItem.total || 0) / totalSpend) * 100;
                                    const emissionPct = ((item.item_emissions || 0) / totalEmission) * 100;
                                    return {
                                        description: item.description,
                                        spendPct,
                                        emissionPct
                                    };
                                }).sort((a: any, b: any) => b.emissionPct - a.emissionPct).slice(0, 4); // Top 4 for this larger view

                                return chartItems.map((item: any, i: number) => (
                                    <div key={i} className="space-y-1">
                                        <div className="flex justify-between text-xs text-slate-300">
                                            <span className="truncate max-w-[200px]">{item.description}</span>
                                            <span className="text-slate-500 font-mono text-[10px]">
                                                {item.spendPct.toFixed(1)}% $ / {item.emissionPct.toFixed(1)}% CO2e
                                            </span>
                                        </div>
                                        <div className="grid grid-rows-2 gap-[2px]">
                                            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                                                <div style={{ width: `${Math.max(item.spendPct, 1)}%` }} className="h-full bg-blue-500 rounded-full"></div>
                                            </div>
                                            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                                                <div style={{ width: `${Math.max(item.emissionPct, 1)}%` }} className="h-full bg-emerald-500 rounded-full"></div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            })()}
                            {carbon.line_level_breakdown.length === 0 && <div className="text-slate-500 text-sm italic">No line items available for analysis.</div>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Shipping Details (Logistics Intelligence) */}
            {extraction.shipping_details && (
                <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                    <div className="p-4 bg-slate-700/50 border-b border-slate-700 flex items-center gap-2 font-bold text-white">
                        <Leaf className="w-4 h-4 text-blue-400" /> Logistics Intelligence
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="text-xs text-slate-500 uppercase">Route</label>
                                <div className="text-white text-sm">
                                    {extraction.shipping_details.origin_address || "N/A"} → {extraction.shipping_details.destination_address || "N/A"}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase">Method</label>
                                <div className="text-white text-sm capitalize">{extraction.shipping_details.shipping_method || "Standard"}</div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase">Declared Weight</label>
                                <div className="text-white text-sm">{extraction.shipping_details.weight_kg ? `${(extraction.shipping_details.weight_kg * 2.20462).toFixed(2)} lbs` : "N/A"}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}



            {/* Audit Logs */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="p-4 bg-slate-700/50 border-b border-slate-700 flex items-center gap-2 font-bold text-white">
                    <Shield className="w-4 h-4 text-purple-400" /> Audit Findings
                </div>
                <div className="p-6">
                    {audit.audit_flags.length === 0 ? (
                        <div className="text-slate-500 italic flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-500" /> No issues found. System confidence high.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {audit.audit_flags.map((flag, i) => (
                                <div key={i} className="flex items-center gap-3 text-red-300 bg-red-900/20 p-3 rounded-lg border border-red-900/30">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    {flag}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>


        </div>
    );
};

export default InvoiceDetail;

// Agent Feed Component
const AgentFeed: React.FC = () => {
    const [step, setStep] = useState(0);

    // Simulate agent progression
    useEffect(() => {
        const intervals = [
            setTimeout(() => setStep(1), 1000), // Activate Carbon Mapper
            setTimeout(() => setStep(2), 3500), // Activate Strategy Auditor
            setTimeout(() => setStep(3), 6000), // All done (waiting for real data)
        ];
        return () => intervals.forEach(clearTimeout);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-4xl mx-auto p-8">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 mb-4">
                    Orchestrating Agents
                </h2>
                <p className="text-slate-400 text-lg">
                    Decomposing invoice data into actionable emission intelligence.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                {/* Agent 1: OCR */}
                <FeedCard
                    icon={Scan}
                    title="OCR Extractor"
                    description="Parsing unstructured PDF data..."
                    status={step === 0 ? "PROCESSING" : "COMPLETED"}
                    isActive={step === 0}
                    isDone={step > 0}
                    color="text-blue-400"
                    bgColor="bg-blue-500/10"
                    borderColor="border-blue-500/20"
                />

                {/* Agent 2: Carbon Mapper */}
                <FeedCard
                    icon={Map}
                    title="Carbon Mapper"
                    description="Matching line items to NAICS & emission factors."
                    status={step < 1 ? "WAITING" : step === 1 ? "ANALYZING" : "COMPLETED"}
                    isActive={step === 1}
                    isDone={step > 1}
                    color="text-emerald-400"
                    bgColor="bg-emerald-500/10"
                    borderColor="border-emerald-500/20"
                />

                {/* Agent 3: Auditor */}
                <FeedCard
                    icon={Shield}
                    title="Strategy Auditor"
                    description="Verifying data integrity and confidence scores."
                    status={step < 2 ? "WAITING" : step === 2 ? "AUDITING" : "COMPLETED"}
                    isActive={step === 2}
                    isDone={step > 2}
                    color="text-purple-400"
                    bgColor="bg-purple-500/10"
                    borderColor="border-purple-500/20"
                />
            </div>

            {/* Simulated Live Logs */}
            <div className="mt-12 w-full max-w-2xl bg-slate-900/80 rounded-xl border border-slate-800 p-6 font-mono text-xs overflow-hidden">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="ml-auto text-slate-500">agent_runtime.log</span>
                </div>
                <div className="space-y-2 h-32 flex flex-col justify-end text-slate-400">
                    {step >= 0 && <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-blue-300">&gt; [OCR] Initializing Tesseract engine...</motion.div>}
                    {step >= 0 && <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="text-blue-300"> &gt; [OCR] Identifying layout regions...</motion.div>}
                    {step >= 1 && <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-emerald-300">&gt; [MAPPER] Received structured JSON payload.</motion.div>}
                    {step >= 1 && <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="text-emerald-300">&gt; [MAPPER] Querying EF database for 'Steel Beams'...</motion.div>}
                    {step >= 2 && <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-purple-300">&gt; [AUDIT] Running validation checks...</motion.div>}
                    <motion.div
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        className="text-white"
                    >
                        _
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

const FeedCard: React.FC<{
    icon: React.ElementType;
    title: string;
    description: string;
    status: string;
    isActive: boolean;
    isDone: boolean;
    color: string;
    bgColor: string;
    borderColor: string;
}> = ({ icon: Icon, title, description, status, isActive, isDone, color, bgColor, borderColor }) => {
    return (
        <motion.div
            layout
            className={`p-6 rounded-2xl border backdrop-blur-sm relative overflow-hidden transition-all duration-500
                ${params(isActive, isDone, bgColor, borderColor)}
            `}
        >
            {isActive && (
                <motion.div
                    layoutId="active-glow"
                    className={`absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50`}
                />
            )}

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl ${isActive || isDone ? bgColor : 'bg-slate-800'} ${isActive || isDone ? color : 'text-slate-500'} transition-colors`}>
                        <Icon size={28} />
                    </div>
                    <div className={`text-[10px] font-bold tracking-widest px-2 py-1 rounded-full border ${isActive ? `${color} ${borderColor}` : isDone ? 'text-emerald-400 border-emerald-500/30' : 'text-slate-600 border-slate-700'}`}>
                        {status}
                    </div>
                </div>

                <h3 className={`font-bold text-lg mb-2 ${isActive || isDone ? 'text-white' : 'text-slate-500'}`}>{title}</h3>
                <p className={`text-sm ${isActive || isDone ? 'text-slate-300' : 'text-slate-600'}`}>
                    {description}
                </p>

                {isActive && (
                    <div className="mt-auto pt-4">
                        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                                className={`h-full ${color.replace('text-', 'bg-')}`}
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 2, ease: "linear" }}
                            />
                        </div>
                    </div>
                )}
                {isDone && (
                    <div className="mt-auto pt-4 flex items-center gap-2 text-emerald-400 text-xs font-bold">
                        <CheckCircle size={14} /> DONE
                    </div>
                )}
            </div>
        </motion.div>
    );
};

function params(isActive: boolean, isDone: boolean, bgColor: string, borderColor: string) {
    if (isActive) return `${bgColor} ${borderColor} shadow-lg scale-105`;
    if (isDone) return `bg-slate-900/50 border-emerald-500/30 opacity-80`;
    return `bg-slate-900/20 border-slate-800 opacity-50`;
}
