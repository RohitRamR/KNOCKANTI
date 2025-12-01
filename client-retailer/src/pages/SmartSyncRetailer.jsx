import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    RefreshCw, Upload, Database, Settings, Activity,
    CheckCircle, AlertTriangle, FileText, ArrowRight, Download, Monitor
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const SmartSyncRetailer = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [syncHistory, setSyncHistory] = useState([]);
    const [config, setConfig] = useState({
        syncSource: 'MANUAL',
        fieldMapping: { sku: 'ItemCode', stock: 'QOH', price: 'MRP', name: 'Description' }
    });
    const [jsonText, setJsonText] = useState('');
    const [file, setFile] = useState(null);
    const [syncStatus, setSyncStatus] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [showSetupGuide, setShowSetupGuide] = useState(false);
    const [activeGuideTab, setActiveGuideTab] = useState('webhook');

    // Fetch History and Profile
    useEffect(() => {
        fetchHistory();
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            let token = localStorage.getItem('token');
            if (!token && axios.defaults.headers.common['Authorization']) {
                token = axios.defaults.headers.common['Authorization'].split(' ')[1];
            }
            const res = await axios.get('http://localhost:5001/api/smartsync/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data) {
                setConfig(prev => ({ ...prev, ...res.data }));
            }
        } catch (err) {
            console.error("Failed to fetch profile", err);
        }
    };

    const fetchHistory = async () => {
        try {
            let token = localStorage.getItem('token');
            if (!token && axios.defaults.headers.common['Authorization']) {
                token = axios.defaults.headers.common['Authorization'].split(' ')[1];
            }

            // Assuming backend endpoint is accessible to retailers too
            const res = await axios.get('http://localhost:5001/api/smartsync/history', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSyncHistory(res.data);
        } catch (err) {
            console.error("Failed to fetch history", err);
        }
    };

    const handleSync = async () => {
        setSyncStatus('syncing');
        setErrorMessage('');
        try {
            let token = localStorage.getItem('token');
            if (!token && axios.defaults.headers.common['Authorization']) {
                token = axios.defaults.headers.common['Authorization'].split(' ')[1];
            }

            if (!token) {
                throw new Error('Authentication token missing. Please refresh the page.');
            }

            if (activeTab === 'smart-upload') {
                if (!file) return;
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch('http://localhost:5001/api/smartsync/ingest', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                        // Content-Type is automatically set by fetch with boundary
                    },
                    body: formData
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: response.statusText }));
                    throw new Error(errorData.message || 'Upload failed');
                }

                setFile(null);
            } else if (activeTab === 'manual-entry') {
                if (!jsonText) return;
                await axios.post('http://localhost:5001/api/smartsync/ingest', {
                    payload: JSON.parse(jsonText)
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setJsonText(''); // Reset text after success
            }

            setSyncStatus('success');
            fetchHistory();
            setTimeout(() => setSyncStatus(null), 3000);
        } catch (err) {
            console.error("Sync failed", err);
            setSyncStatus('error');
            setErrorMessage(err.message || 'Unknown error occurred');
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">
                        SmartSync™ Integration
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Connect your billing software (Zoho, Tally, Sleek Bill) to prevent out-of-stock orders.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchHistory}
                        className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw size={20} className="text-gray-600" />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200">
                {['dashboard', 'connect-source', 'smart-upload', 'manual-entry'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb - 3 px - 4 font - medium capitalize transition - colors relative ${activeTab === tab ? 'text-green-600' : 'text-gray-500 hover:text-gray-800'
                            } `}
                    >
                        {tab.replace('-', ' ')}
                        {activeTab === tab && (
                            <motion.div
                                layoutId="tab-underline"
                                className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="min-h-[500px] mt-6">
                {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-gray-500 text-sm">Sync Status</p>
                                        <h3 className="text-2xl font-bold mt-2 text-green-600">Active</h3>
                                    </div>
                                    <div className="p-3 bg-green-100 rounded-lg">
                                        <Activity className="text-green-600" size={24} />
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 mt-4">Real-time protection enabled</p>
                            </div>

                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-gray-500 text-sm">Last Sync</p>
                                        <h3 className="text-2xl font-bold mt-2 text-gray-800">
                                            {syncHistory.length > 0 ? new Date(syncHistory[0].createdAt).toLocaleTimeString() : '--'}
                                        </h3>
                                    </div>
                                    <div className="p-3 bg-blue-100 rounded-lg">
                                        <Database className="text-blue-600" size={24} />
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 mt-4">
                                    {syncHistory.length > 0 ? new Date(syncHistory[0].createdAt).toLocaleDateString() : 'No data'}
                                </p>
                            </div>
                        </div>

                        {/* Recent Activity Table */}
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-gray-200">
                                <h3 className="font-semibold text-gray-800">Sync History</h3>
                            </div>
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-500 text-sm">
                                    <tr>
                                        <th className="p-4 font-medium">Batch ID</th>
                                        <th className="p-4 font-medium">Source</th>
                                        <th className="p-4 font-medium">Status</th>
                                        <th className="p-4 font-medium">Items Updated</th>
                                        <th className="p-4 font-medium">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {syncHistory.map((log) => (
                                        <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4 font-mono text-xs text-gray-500">{log.batchId.substring(0, 8)}...</td>
                                            <td className="p-4 text-sm">{log.sourceType}</td>
                                            <td className="p-4">
                                                <span className={`px - 2 py - 1 rounded - full text - xs font - medium ${log.status === 'SUCCESS' ? 'bg-green-100 text-green-600' :
                                                    log.status === 'FAILED' ? 'bg-red-100 text-red-600' :
                                                        'bg-orange-100 text-orange-600'
                                                    } `}>
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm">{log.recordsProcessed}</td>
                                            <td className="p-4 text-sm text-gray-500">
                                                {new Date(log.createdAt).toLocaleTimeString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {syncHistory.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="p-8 text-center text-gray-500">
                                                No sync history found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'connect-source' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Option 1: Local Agent */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                                <Monitor className="text-blue-600" size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Desktop Agent (Recommended)</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Download our lightweight agent that runs on your billing PC. It watches your database file (Access, SQLite, CSV) and syncs changes automatically.
                            </p>
                            <div className="space-y-3">
                                <button
                                    onClick={() => {
                                        // Download the agent script
                                        const link = document.createElement('a');
                                        link.href = 'http://localhost:5001/agent.js';
                                        link.download = 'agent.js';
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                        toast.success('Agent script downloaded!');
                                    }}
                                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
                                >
                                    <Download size={18} /> Download Agent Script
                                </button>
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-xs text-gray-500 mb-1">Your Agent Key:</p>
                                    <code className="text-sm font-mono text-gray-800 select-all block overflow-hidden text-ellipsis">
                                        {config.apiKey || 'Loading...'}
                                    </code>
                                </div>
                            </div>
                        </div>

                        {/* Option 2: Cloud Webhook */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                                <Activity className="text-purple-600" size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Cloud Integration</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Use Zoho Books, QuickBooks, or Sleek Bill? Configure a webhook to push inventory updates directly to us.
                            </p>
                            <div className="space-y-3">
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 group relative">
                                    <p className="text-xs text-gray-500 mb-1">Webhook URL:</p>
                                    <code className="text-xs font-mono text-gray-800 break-all select-all block">
                                        http://localhost:5001/api/smartsync/webhook
                                    </code>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText('http://localhost:5001/api/smartsync/webhook');
                                            toast.success('URL copied to clipboard!');
                                        }}
                                        className="absolute top-2 right-2 p-1 bg-white border border-gray-200 rounded hover:bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Copy URL"
                                    >
                                        <FileText size={14} className="text-gray-500" />
                                    </button>
                                </div>
                                <button
                                    onClick={() => setShowSetupGuide(true)}
                                    className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                                >
                                    View Setup Guide
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'smart-upload' && (
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Upload size={20} />
                                Smart File Ingest (AI Powered)
                            </h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Upload your <strong>CSV</strong> or <strong>Excel</strong> file. Our <strong>Format Intelligence Engine (FIE™)</strong> will auto-detect columns like SKU, Price, and Stock.
                            </p>

                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors relative">
                                <input
                                    type="file"
                                    accept=".csv, .xlsx, .xls"
                                    onChange={(e) => setFile(e.target.files[0])}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                        <FileText size={32} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800">
                                            {file ? file.name : "Click to Upload or Drag File"}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">Supports .csv, .xlsx, .xls</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end items-center gap-4">
                                {syncStatus === 'success' && (
                                    <span className="text-green-600 flex items-center gap-2 text-sm font-medium">
                                        <CheckCircle size={16} /> Sync Complete
                                    </span>
                                )}
                                {syncStatus === 'error' && (
                                    <div className="flex flex-col items-end">
                                        <span className="text-red-600 flex items-center gap-2 text-sm font-medium">
                                            <AlertTriangle size={16} /> Sync Failed
                                        </span>
                                        {errorMessage && (
                                            <span className="text-xs text-red-500 mt-1">{errorMessage}</span>
                                        )}
                                    </div>
                                )}
                                <button
                                    onClick={handleSync}
                                    disabled={syncStatus === 'syncing' || !file}
                                    className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {syncStatus === 'syncing' ? (
                                        <>
                                            <RefreshCw size={18} className="animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Activity size={18} />
                                            Process File
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'manual-entry' && (
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <FileText size={20} />
                                Manual Data Entry
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Paste your inventory data as a JSON array. Useful for quick fixes or developer testing.
                            </p>

                            <textarea
                                value={jsonText}
                                onChange={(e) => setJsonText(e.target.value)}
                                placeholder='[{"sku": "123", "stock": 10, "price": 100}]'
                                className="w-full h-64 p-4 font-mono text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none resize-none"
                            />

                            <div className="mt-6 flex justify-end items-center gap-4">
                                {syncStatus === 'success' && (
                                    <span className="text-green-600 flex items-center gap-2 text-sm font-medium">
                                        <CheckCircle size={16} /> Sync Complete
                                    </span>
                                )}
                                {syncStatus === 'error' && (
                                    <div className="flex flex-col items-end">
                                        <span className="text-red-600 flex items-center gap-2 text-sm font-medium">
                                            <AlertTriangle size={16} /> Sync Failed
                                        </span>
                                        {errorMessage && (
                                            <span className="text-xs text-red-500 mt-1">{errorMessage}</span>
                                        )}
                                    </div>
                                )}
                                <button
                                    onClick={handleSync}
                                    disabled={syncStatus === 'syncing' || !jsonText}
                                    className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {syncStatus === 'syncing' ? (
                                        <>
                                            <RefreshCw size={18} className="animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Activity size={18} />
                                            Sync Data
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Setup Guide Modal */}
            {showSetupGuide && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-800">Setup Instructions</h3>
                            <button
                                onClick={() => setShowSetupGuide(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>

                        {/* Guide Tabs */}
                        <div className="flex gap-2 mb-6 border-b border-gray-100">
                            <button
                                onClick={() => setActiveGuideTab('webhook')}
                                className={`pb-2 px-4 text-sm font-medium transition-colors relative ${activeGuideTab === 'webhook' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
                            >
                                Cloud Webhook
                                {activeGuideTab === 'webhook' && (
                                    <motion.div layoutId="guide-tab" className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600" />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveGuideTab('agent')}
                                className={`pb-2 px-4 text-sm font-medium transition-colors relative ${activeGuideTab === 'agent' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
                            >
                                Desktop Agent
                                {activeGuideTab === 'agent' && (
                                    <motion.div layoutId="guide-tab" className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600" />
                                )}
                            </button>
                        </div>

                        {/* Webhook Content */}
                        {activeGuideTab === 'webhook' && (
                            <div className="space-y-6">
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-blue-800 text-sm">
                                    <p className="font-medium mb-1">👋 Easy Setup</p>
                                    <p className="mb-2">This connects your billing software to our app so inventory updates automatically.</p>
                                    <p className="text-xs text-blue-600">Just copy and paste these 3 details into your billing software's <strong>Webhook</strong> settings.</p>
                                </div>

                                <div className="space-y-5">
                                    {/* Field 1: URL */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-baseline">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">1. Paste this URL</label>
                                            <span className="text-xs text-gray-400 italic">Paste in "Callback URL" or "Endpoint"</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <code className="flex-1 bg-gray-50 border border-gray-200 p-3 rounded-lg text-sm font-mono text-gray-800 break-all flex items-center">
                                                http://localhost:5001/api/smartsync/webhook
                                            </code>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText('http://localhost:5001/api/smartsync/webhook');
                                                    toast.success('URL copied!');
                                                }}
                                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 rounded-lg font-medium text-sm transition-colors"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    </div>

                                    {/* Field 2: Header Name */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-baseline">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">2. Header Name</label>
                                            <span className="text-xs text-gray-400 italic">Paste in "Header Name" or "Key"</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <code className="flex-1 bg-gray-50 border border-gray-200 p-3 rounded-lg text-sm font-mono text-gray-800 flex items-center">
                                                x-api-key
                                            </code>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText('x-api-key');
                                                    toast.success('Header Name copied!');
                                                }}
                                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 rounded-lg font-medium text-sm transition-colors"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    </div>

                                    {/* Field 3: Header Value */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-baseline">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">3. Header Value</label>
                                            <span className="text-xs text-gray-400 italic">Paste in "Header Value" or "Secret"</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <code className="flex-1 bg-gray-50 border border-gray-200 p-3 rounded-lg text-sm font-mono text-gray-800 break-all flex items-center">
                                                {config.apiKey}
                                            </code>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(config.apiKey);
                                                    toast.success('Key copied!');
                                                }}
                                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 rounded-lg font-medium text-sm transition-colors"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Desktop Agent Content */}
                        {activeGuideTab === 'agent' && (
                            <div className="space-y-6">
                                {/* How it Works Section */}
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border border-green-100">
                                    <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                                        <Activity size={18} /> How it Works
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-white/60 p-3 rounded-lg">
                                            <p className="font-semibold text-green-900 text-xs uppercase mb-1">1. Watch</p>
                                            <p className="text-xs text-green-800">The agent monitors your inventory file (e.g., <code>inventory.csv</code>) 24/7.</p>
                                        </div>
                                        <div className="bg-white/60 p-3 rounded-lg">
                                            <p className="font-semibold text-green-900 text-xs uppercase mb-1">2. Detect</p>
                                            <p className="text-xs text-green-800">As soon as your billing software saves changes, the agent detects them instantly.</p>
                                        </div>
                                        <div className="bg-white/60 p-3 rounded-lg">
                                            <p className="font-semibold text-green-900 text-xs uppercase mb-1">3. Sync</p>
                                            <p className="text-xs text-green-800">Updates are securely pushed to the cloud using your unique API Key.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    {/* Step 1 */}
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                                            <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">1</span>
                                            Install Node.js Runtime
                                        </h4>
                                        <p className="text-xs text-gray-500 pl-8 leading-relaxed">
                                            The agent is built on Node.js, a lightweight runtime. You need to install it once to run the script.
                                            <br />
                                            <a href="https://nodejs.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium mt-1 inline-block">
                                                Download Node.js (LTS Version) &rarr;
                                            </a>
                                        </p>
                                    </div>

                                    {/* Step 2 */}
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                                            <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">2</span>
                                            Get the Agent Script
                                        </h4>
                                        <div className="pl-8">
                                            <p className="text-xs text-gray-500 mb-2">
                                                This small file contains the logic to watch your files and talk to our server.
                                            </p>
                                            <button
                                                onClick={() => {
                                                    const link = document.createElement('a');
                                                    link.href = 'http://localhost:5001/agent.js';
                                                    link.download = 'agent.js';
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    document.body.removeChild(link);
                                                    toast.success('Agent script downloaded!');
                                                }}
                                                className="py-2 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 flex items-center gap-2 text-sm"
                                            >
                                                <Download size={16} /> Download agent.js
                                            </button>
                                        </div>
                                    </div>

                                    {/* Step 3 */}
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                                            <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">3</span>
                                            Launch the Agent
                                        </h4>
                                        <p className="text-xs text-gray-500 pl-8 mb-2">
                                            Open your terminal (Command Prompt) in the folder where you saved <code>agent.js</code> and paste this command.
                                        </p>
                                        <div className="pl-8">
                                            <div className="bg-gray-900 rounded-lg p-3 relative group">
                                                <code className="text-green-400 font-mono text-xs block break-all pr-8">
                                                    node agent.js {config.apiKey}
                                                </code>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(`node agent.js ${config.apiKey}`);
                                                        toast.success('Command copied!');
                                                    }}
                                                    className="absolute top-2 right-2 p-1 bg-gray-800 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                                                >
                                                    <FileText size={14} />
                                                </button>
                                            </div>

                                            {/* Command Breakdown */}
                                            <div className="mt-3 grid grid-cols-3 gap-2">
                                                <div className="bg-gray-50 p-2 rounded border border-gray-100">
                                                    <p className="text-[10px] font-bold text-gray-600 uppercase">Node</p>
                                                    <p className="text-[10px] text-gray-500">The engine that runs the script.</p>
                                                </div>
                                                <div className="bg-gray-50 p-2 rounded border border-gray-100">
                                                    <p className="text-[10px] font-bold text-gray-600 uppercase">Agent.js</p>
                                                    <p className="text-[10px] text-gray-500">The brain that watches files.</p>
                                                </div>
                                                <div className="bg-gray-50 p-2 rounded border border-gray-100">
                                                    <p className="text-[10px] font-bold text-gray-600 uppercase">Key</p>
                                                    <p className="text-[10px] text-gray-500">Your secure password.</p>
                                                </div>
                                            </div>

                                            <p className="text-[10px] text-gray-400 mt-2">
                                                <span className="font-bold text-gray-500">Tip:</span> Keep this window open to maintain the sync.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Agent Capabilities */}
                                    <div className="pt-4 border-t border-gray-100">
                                        <h5 className="text-xs font-bold text-gray-700 mb-2">Agent Capabilities</h5>
                                        <ul className="space-y-1">
                                            <li className="text-xs text-gray-500 flex items-center gap-2">
                                                <CheckCircle size={12} className="text-green-500" />
                                                <span><strong>Smart Parsing:</strong> Auto-detects CSV/Excel columns.</span>
                                            </li>
                                            <li className="text-xs text-gray-500 flex items-center gap-2">
                                                <CheckCircle size={12} className="text-green-500" />
                                                <span><strong>Debouncing:</strong> Waits for file save to finish before syncing.</span>
                                            </li>
                                            <li className="text-xs text-gray-500 flex items-center gap-2">
                                                <CheckCircle size={12} className="text-green-500" />
                                                <span><strong>Error Recovery:</strong> Retries automatically if internet fails.</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={() => setShowSetupGuide(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                            >
                                Close Guide
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default SmartSyncRetailer;
