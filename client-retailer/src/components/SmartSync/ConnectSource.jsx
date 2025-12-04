import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ConnectSource = () => {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAgents();
    }, []);

    const fetchAgents = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/smartsync/agents', {
                withCredentials: true
            });
            setAgents(response.data);
        } catch (error) {
            console.error('Failed to fetch agents', error);
        } finally {
            setLoading(false);
        }
    };

    const togglePermission = async (agentId, currentStatus) => {
        try {
            await axios.patch(`http://localhost:5000/api/smartsync/agents/${agentId}/permissions`, {
                allowedWriteBack: !currentStatus
            }, { withCredentials: true });
            fetchAgents();
        } catch (error) {
            console.error('Failed to update permissions', error);
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6">Connect Source</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Desktop Agent Card */}
                <div className="border rounded-xl p-6 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-xl font-semibold">Desktop Agent</h3>
                            <p className="text-gray-500 text-sm mt-1">Recommended for Tally, SQL, and Offline POS</p>
                        </div>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Recommended</span>
                    </div>

                    <div className="space-y-4">
                        <p className="text-gray-600">
                            Install the SmartSync Agent on your billing PC to automatically sync inventory and orders.
                        </p>
                        <div className="flex gap-3">
                            <a href="http://localhost:5000/api/smartsync/agent-zip" className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800">
                                Download Agent
                            </a>
                        </div>
                    </div>

                    {/* Connected Agents List */}
                    <div className="mt-6 pt-6 border-t">
                        <h4 className="font-medium mb-3">Connected Agents</h4>
                        {loading ? <p>Loading...</p> : (
                            <div className="space-y-3">
                                {agents.length === 0 && <p className="text-gray-500 text-sm">No agents connected yet.</p>}
                                {agents.map(agent => (
                                    <div key={agent._id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${agent.status === 'ONLINE' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                <span className="font-medium">{agent.agentName}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">Last seen: {new Date(agent.lastSeenAt).toLocaleString()}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="flex items-center cursor-pointer">
                                                <div className="relative">
                                                    <input type="checkbox" className="sr-only" checked={agent.allowedWriteBack} onChange={() => togglePermission(agent._id, agent.allowedWriteBack)} />
                                                    <div className={`block w-10 h-6 rounded-full ${agent.allowedWriteBack ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${agent.allowedWriteBack ? 'transform translate-x-4' : ''}`}></div>
                                                </div>
                                                <span className="ml-2 text-xs font-medium text-gray-700">Write-back</span>
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Cloud Integration Card */}
                <div className="border rounded-xl p-6 hover:shadow-lg transition-shadow opacity-75">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-xl font-semibold">Cloud Integration</h3>
                            <p className="text-gray-500 text-sm mt-1">For Zoho Books, QuickBooks Online</p>
                        </div>
                        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">Coming Soon</span>
                    </div>
                    <p className="text-gray-600 mb-4">
                        Directly connect your cloud accounting software without installing any agent.
                    </p>
                    <button disabled className="bg-gray-200 text-gray-500 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed">
                        Configure
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConnectSource;
