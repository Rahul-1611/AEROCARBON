import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Invoice, MetricsResponse } from '../types';
import { Link } from 'react-router-dom';
import { BarChart, CheckCircle, AlertTriangle, FileText, ChevronRight, Upload as UploadIcon } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSeedling } from '@fortawesome/free-solid-svg-icons';

const Dashboard: React.FC = () => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [invRes, metRes] = await Promise.all([
                api.get('/invoices'),
                api.get('/metrics')
            ]);
            setInvoices(invRes.data);
            setMetrics(metRes.data);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // Polling status
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'finalized': return 'text-emerald-400 bg-emerald-400/10';
            case 'failed': return 'text-red-400 bg-red-400/10';
            case 'ocr_processing':
            case 'mapped':
            case 'audited':
                return 'text-blue-400 bg-blue-400/10';
            default: return 'text-slate-400 bg-slate-400/10';
        }
    };

    return (
        <div className="w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.location.href = '/'}>
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_15px_-5px_rgba(99,230,190,0.5)] group-hover:border-emerald-500/50 transition-all duration-300">
                        <FontAwesomeIcon icon={faSeedling} style={{ color: "rgba(99, 230, 190, 1)", fontSize: '1.25rem' }} />
                    </div>
                    <div className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tighter">
                        AEROCARBON
                    </div>
                </div>
                <Link
                    to="/upload"
                    className="w-full md:w-auto flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-all shadow-lg shadow-emerald-500/20"
                >
                    <UploadIcon className="w-4 h-4" />
                    <span className="font-semibold">Upload Invoice</span>
                </Link>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-3 text-slate-400 mb-2">
                        <FileText className="w-5 h-5" /> Total Processed
                    </div>
                    <div className="text-3xl font-bold text-white">{metrics?.total_processed || 0}</div>
                </div>
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-3 text-slate-400 mb-2">
                        <BarChart className="w-5 h-5" /> Avg Carbon Impact
                    </div>
                    <div className="text-3xl font-bold text-white">{metrics?.average_carbon?.toFixed(2) || 0} <span className="text-sm font-normal text-slate-500">kgCO2e</span></div>
                </div>
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-3 text-slate-400 mb-2">
                        <AlertTriangle className="w-5 h-5" /> Failure Rate
                    </div>
                    <div className="text-3xl font-bold text-white">{(metrics?.failure_rate || 0).toFixed(1)}%</div>
                </div>
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-3 text-slate-400 mb-2">
                        <CheckCircle className="w-5 h-5 text-emerald-400" /> Top NAICS Categories
                    </div>
                    <div className="space-y-2">
                        {metrics?.top_naics && metrics.top_naics.length > 0 ? (
                            metrics.top_naics.map((code, i) => (
                                <div key={i} className="flex justify-between items-center bg-slate-900/40 p-2 rounded-lg border border-slate-700/50">
                                    <span className="text-xs font-mono text-emerald-400">{code}</span>
                                    <span className="text-[10px] text-slate-400 truncate ml-2 max-w-[120px]" title={metrics.top_categories[i]}>
                                        {metrics.top_categories[i]}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-sm text-slate-500 italic">No data yet</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Invoice List */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Recent Invoices</h2>
                    <span className="text-sm text-slate-500">Live Updates</span>
                </div>

                {loading && invoices.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">Loading...</div>
                ) : (
                    <div className="divide-y divide-slate-700">
                        {invoices.map((inv) => (
                            <Link
                                to={`/invoice/${inv.doc_id}`}
                                key={inv.doc_id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-700/50 transition-colors group gap-4"
                            >
                                <div className="flex items-center gap-4 w-full sm:w-auto overflow-hidden">
                                    <div className="w-10 h-10 rounded-full bg-slate-700 flex shrink-0 items-center justify-center text-slate-400">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-white font-medium group-hover:text-emerald-400 transition-colors truncate">
                                            {inv.file_name}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {new Date(inv.upload_ts).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end pl-14 sm:pl-0">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusColor(inv.status)}`}>
                                        {inv.status}
                                    </span>
                                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
