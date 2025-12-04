import React, { useState, useEffect } from 'react';
import ConnectSource from '../components/SmartSync/ConnectSource';
import axios from 'axios';

const SmartSyncDashboard = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [history, setHistory] = useState([]);

    useEffect(() => {
        if (activeTab === 'dashboard') {
            fetchHistory();
        }
    }, [activeTab]);

    const fetchHistory = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/smartsync/history', {
                withCredentials: true
            });
            setHistory(response.data);
        } catch (error) {
            console.error('Failed to fetch history', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">SmartSync™ Integration</h1>
                    <p className="text-gray-600 mt-2">Manage your inventory connections and sync status.</p>
                </header>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-8">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`py-4 px-6 font-medium text-sm focus:outline-none ${activeTab === 'dashboard' ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('connect')}
                        className={`py-4 px-6 font-medium text-sm focus:outline-none ${activeTab === 'connect' ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Connect Source
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm border">
                                <h3 className="text-gray-500 text-sm font-medium">Total Products Synced</h3>
                                <p className="text-3xl font-bold mt-2">1,248</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border">
                                <h3 className="text-gray-500 text-sm font-medium">Last Sync</h3>
                                <p className="text-3xl font-bold mt-2">2 mins ago</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border">
                                <h3 className="text-gray-500 text-sm font-medium">Sync Health</h3>
                                <p className="text-3xl font-bold mt-2 text-green-500">Excellent</p>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                            <div className="px-6 py-4 border-b bg-gray-50">
                                <h3 className="font-semibold text-gray-900">Recent Sync Activity</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3">Time</th>
                                            <th className="px-6 py-3">Type</th>
                                            <th className="px-6 py-3">Direction</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map((log) => (
                                            <tr key={log._id} className="bg-white border-b hover:bg-gray-50">
                                                <td className="px-6 py-4">{new Date(log.createdAt).toLocaleString()}</td>
                                                <td className="px-6 py-4 font-medium">{log.type}</td>
                                                <td className="px-6 py-4">{log.direction}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${log.status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                                                            log.status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {log.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500">
                                                    {log.errorMessage || `Processed: ${log.requestPayload?.count || 0}`}
                                                </td>
                                            </tr>
                                        ))}
                                        {history.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                                    No sync history available.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'connect' && <ConnectSource />}
            </div>
        </div>
    );
};

export default SmartSyncDashboard;
