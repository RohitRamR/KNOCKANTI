import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    RefreshCw, Upload, Database, Settings, Activity,
    CheckCircle, AlertTriangle, FileText, ArrowRight
} from 'lucide-react';
import axios from 'axios';

const SmartSyncControlCenter = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [syncHistory, setSyncHistory] = useState([]);
    const [config, setConfig] = useState({
        syncSource: 'MANUAL',
        fieldMapping: { sku: 'ItemCode', stock: 'QOH', price: 'MRP', name: 'Description' }
    });
    const [manualPayload, setManualPayload] = useState(JSON.stringify([
        { "ItemCode": "SKU001", "QOH": "50", "MRP": "19.99", "Description": "Cola Zero" },
        { "ItemCode": "SKU002", "QOH": "120", "MRP": "15.50", "Description": "Orange Soda" }
    ], null, 2));
    const [syncStatus, setSyncStatus] = useState(null);

    // Fetch History
    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            // In real app, use configured axios instance with auth headers
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5002/api/smartsync/history', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSyncHistory(res.data);
        } catch (err) {
            console.error("Failed to fetch history", err);
        }
    };

    const handleSync = async () => {
        setSyncStatus('syncing');
        try {
            const token = localStorage.getItem('token');
            // Mock retailer ID for now if not in token, or assume backend handles it from token
            // For prototype, we send the payload
            const payload = JSON.parse(manualPayload);

            const res = await axios.post('http://localhost:5002/api/smartsync/ingest', {
                payload,
                retailerId: '674b34460777130541295968' // HARDCODED FOR DEMO - REPLACE WITH REAL ID
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSyncStatus('success');
            fetchHistory();
            setTimeout(() => setSyncStatus(null), 3000);
        } catch (err) {
            console.error("Sync failed", err);
            setSyncStatus('error');
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                        SmartSync™ Control Center
                    </h1>
                    <p className="text-text-secondary mt-1">
                        Patent-Grade Inventory Synchronization Engine
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchHistory}
                        className="p-2 rounded-lg bg-bg-secondary hover:bg-bg-primary border border-border transition-colors"
                    >
                        <RefreshCw size={20} className="text-text-secondary" />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-border">
                {['dashboard', 'configuration', 'manual-ingest'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-3 px-4 font-medium capitalize transition-colors relative ${activeTab === tab ? 'text-brand-primary' : 'text-text-secondary hover:text-text-primary'
                            }`}
                    >
                        {tab.replace('-', ' ')}
                        {activeTab === tab && (
                            <motion.div
                                layoutId="tab-underline"
                                className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-primary"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="min-h-[500px]">
                {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-bg-secondary p-6 rounded-xl border border-border">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-text-secondary text-sm">Last Sync Status</p>
                                        <h3 className="text-2xl font-bold mt-2 text-green-500">Active</h3>
                                    </div>
                                    <div className="p-3 bg-green-500/10 rounded-lg">
                                        <Activity className="text-green-500" size={24} />
                                    </div>
                                </div>
                                <p className="text-xs text-text-secondary mt-4">Updated 2 mins ago</p>
                            </div>

                            <div className="bg-bg-secondary p-6 rounded-xl border border-border">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-text-secondary text-sm">Total SKUs Synced</p>
                                        <h3 className="text-2xl font-bold mt-2 text-text-primary">1,240</h3>
                                    </div>
                                    <div className="p-3 bg-blue-500/10 rounded-lg">
                                        <Database className="text-blue-500" size={24} />
                                    </div>
                                </div>
                                <p className="text-xs text-text-secondary mt-4">+12% from last week</p>
                            </div>

                            <div className="bg-bg-secondary p-6 rounded-xl border border-border">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-text-secondary text-sm">Conflict Rate</p>
                                        <h3 className="text-2xl font-bold mt-2 text-orange-500">0.4%</h3>
                                    </div>
                                    <div className="p-3 bg-orange-500/10 rounded-lg">
                                        <AlertTriangle className="text-orange-500" size={24} />
                                    </div>
                                </div>
                                <p className="text-xs text-text-secondary mt-4">Auto-resolved by CRF™</p>
                            </div>
                        </div>

                        {/* Recent Activity Table */}
                        <div className="bg-bg-secondary rounded-xl border border-border overflow-hidden">
                            <div className="p-4 border-b border-border">
                                <h3 className="font-semibold text-text-primary">Sync Ledger (Audit Trail)</h3>
                            </div>
                            <table className="w-full text-left">
                                <thead className="bg-bg-primary text-text-secondary text-sm">
                                    <tr>
                                        <th className="p-4 font-medium">Batch ID</th>
                                        <th className="p-4 font-medium">Source</th>
                                        <th className="p-4 font-medium">Status</th>
                                        <th className="p-4 font-medium">Processed</th>
                                        <th className="p-4 font-medium">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {syncHistory.map((log) => (
                                        <tr key={log._id} className="hover:bg-bg-primary/50 transition-colors">
                                            <td className="p-4 font-mono text-xs text-text-secondary">{log.batchId.substring(0, 8)}...</td>
                                            <td className="p-4 text-sm">{log.sourceType}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${log.status === 'SUCCESS' ? 'bg-green-500/10 text-green-500' :
                                                    log.status === 'FAILED' ? 'bg-red-500/10 text-red-500' :
                                                        'bg-orange-500/10 text-orange-500'
                                                    }`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm">{log.recordsProcessed} / {log.recordsProcessed + log.recordsFailed}</td>
                                            <td className="p-4 text-sm text-text-secondary">
                                                {new Date(log.createdAt).toLocaleTimeString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {syncHistory.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="p-8 text-center text-text-secondary">
                                                No sync history found. Start a sync to see data.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'configuration' && (
                    <div className="max-w-2xl mx-auto space-y-8">
                        <div className="bg-bg-secondary p-6 rounded-xl border border-border">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Settings size={20} />
                                Source Configuration
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Sync Source</label>
                                    <select
                                        className="w-full p-3 rounded-lg bg-bg-primary border border-border focus:ring-2 focus:ring-brand-primary outline-none"
                                        value={config.syncSource}
                                        onChange={(e) => setConfig({ ...config, syncSource: e.target.value })}
                                    >
                                        <option value="MANUAL">Manual Upload (CSV/JSON)</option>
                                        <option value="FILE">File Watcher Agent (Local)</option>
                                        <option value="API_PUSH">ERP Webhook</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="bg-bg-secondary p-6 rounded-xl border border-border">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Database size={20} />
                                Intelligence Mapping (FIE™)
                            </h3>
                            <p className="text-sm text-text-secondary mb-4">
                                Map your external system's column headers to internal SmartSync fields.
                            </p>
                            <div className="space-y-4">
                                {Object.entries(config.fieldMapping).map(([key, val]) => (
                                    <div key={key} className="grid grid-cols-2 gap-4 items-center">
                                        <label className="text-sm font-medium text-text-secondary capitalize">{key}</label>
                                        <div className="flex items-center gap-2">
                                            <ArrowRight size={16} className="text-text-secondary" />
                                            <input
                                                type="text"
                                                value={val}
                                                onChange={(e) => setConfig({
                                                    ...config,
                                                    fieldMapping: { ...config.fieldMapping, [key]: e.target.value }
                                                })}
                                                className="w-full p-2 rounded-lg bg-bg-primary border border-border text-sm"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'manual-ingest' && (
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-bg-secondary p-6 rounded-xl border border-border">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Upload size={20} />
                                Manual Payload Ingest
                            </h3>
                            <p className="text-sm text-text-secondary mb-4">
                                Paste a JSON payload simulating a parsed CSV file. The FIE™ will normalize this data based on your mapping configuration.
                            </p>

                            <textarea
                                value={manualPayload}
                                onChange={(e) => setManualPayload(e.target.value)}
                                className="w-full h-64 p-4 font-mono text-sm bg-bg-primary border border-border rounded-xl focus:ring-2 focus:ring-brand-primary outline-none resize-none"
                            />

                            <div className="mt-6 flex justify-end items-center gap-4">
                                {syncStatus === 'success' && (
                                    <span className="text-green-500 flex items-center gap-2 text-sm font-medium">
                                        <CheckCircle size={16} /> Sync Complete
                                    </span>
                                )}
                                {syncStatus === 'error' && (
                                    <span className="text-red-500 flex items-center gap-2 text-sm font-medium">
                                        <AlertTriangle size={16} /> Sync Failed
                                    </span>
                                )}
                                <button
                                    onClick={handleSync}
                                    disabled={syncStatus === 'syncing'}
                                    className="px-6 py-3 bg-brand-primary text-white rounded-xl font-medium hover:bg-brand-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {syncStatus === 'syncing' ? (
                                        <>
                                            <RefreshCw size={18} className="animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Activity size={18} />
                                            Run SmartSync™
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SmartSyncControlCenter;
