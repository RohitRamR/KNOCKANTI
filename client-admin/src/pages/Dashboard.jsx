import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
    Users, ShoppingBag, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight,
    Activity, Calendar
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Card } from '../components/ui/Components';
import DeliveryProcess from '../components/dashboard/DeliveryProcess';
import { io } from 'socket.io-client';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeRetailers: 0,
        ordersToday: 0,
        totalRevenue: 0,
        revenueHistory: [],
        topRetailers: []
    });

    const fetchStats = async () => {
        try {
            const res = await axios.get('/admin/stats');
            setStats(res.data);
        } catch (error) {
            // Silent fail for stats or use toast if critical
        }
    };

    useEffect(() => {
        fetchStats();
        const socket = io('http://localhost:5001');
        socket.on('orderPlaced', fetchStats);
        return () => socket.disconnect();
    }, []);

    // KPI Card Component
    const KPICard = ({ title, value, icon: Icon, trend, color }) => (
        <Card className="relative overflow-hidden group border border-border">
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${color} opacity-10 group-hover:scale-150 transition-transform duration-500`}></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-${color.split('-')[1]}-500`}>
                    <Icon size={24} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {Math.abs(trend)}%
                </div>
            </div>
            <div className="relative z-10">
                <h3 className="text-text-secondary text-sm font-medium mb-1">{title}</h3>
                <p className="text-3xl font-bold text-text-primary">{value}</p>
            </div>
        </Card>
    );

    return (
        <div className="space-y-6">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Total Revenue"
                    value={`₹${stats.totalRevenue.toLocaleString()}`}
                    icon={DollarSign}
                    trend={12.5}
                    color="bg-brand-primary"
                />
                <KPICard
                    title="Active Retailers"
                    value={stats.activeRetailers}
                    icon={ShoppingBag}
                    trend={8.2}
                    color="bg-brand-secondary"
                />
                <KPICard
                    title="Total Users"
                    value={stats.totalUsers}
                    icon={Users}
                    trend={-2.4}
                    color="bg-brand-accent"
                />
                <KPICard
                    title="Orders Today"
                    value={stats.ordersToday}
                    icon={Activity}
                    trend={5.7}
                    color="bg-brand-neonBlue"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <Card className="lg:col-span-2 min-h-[400px] border border-border">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-text-primary">Revenue Analytics</h3>
                            <p className="text-sm text-text-secondary">Monthly revenue performance</p>
                        </div>
                        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-primary text-sm font-medium text-text-secondary hover:bg-bg-secondary border border-transparent hover:border-border transition-all">
                            <Calendar size={16} />
                            Last 30 Days
                        </button>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.revenueHistory}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(var(--border-color))" opacity={0.5} />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'rgb(var(--text-muted))', fontSize: 12 }}
                                    tickFormatter={(str) => {
                                        const d = new Date(str);
                                        return `${d.getDate()}/${d.getMonth() + 1}`;
                                    }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'rgb(var(--text-muted))', fontSize: 12 }}
                                    tickFormatter={(val) => `₹${val}`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgb(var(--bg-card))',
                                        border: '1px solid rgb(var(--border-color))',
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                    }}
                                    itemStyle={{ color: 'rgb(var(--text-primary))' }}
                                    labelStyle={{ color: 'rgb(var(--text-muted))' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#3B82F6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Delivery Process Visualization */}
                <Card className="border border-border h-full">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-text-primary">Delivering Process</h3>
                        <p className="text-sm text-text-secondary">Real-time order tracking</p>
                    </div>
                    <DeliveryProcess />
                </Card>
            </div>

            {/* Top Retailers Table */}
            <Card className="border border-border">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-text-primary">Top Performing Retailers</h3>
                    <button className="text-brand-primary text-sm font-bold hover:underline">View All</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left border-b border-border">
                                <th className="pb-4 text-sm font-medium text-text-muted">Rank</th>
                                <th className="pb-4 text-sm font-medium text-text-muted">Retailer</th>
                                <th className="pb-4 text-sm font-medium text-text-muted">Orders</th>
                                <th className="pb-4 text-sm font-medium text-text-muted text-right">Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {stats.topRetailers.map((retailer, index) => (
                                <tr key={retailer._id} className="group hover:bg-bg-primary transition-colors">
                                    <td className="py-4">
                                        <div className="w-8 h-8 rounded-full bg-bg-primary flex items-center justify-center font-bold text-text-secondary group-hover:bg-brand-primary group-hover:text-white transition-colors">
                                            {index + 1}
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                                                {retailer.storeName[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-text-primary">{retailer.storeName}</p>
                                                <p className="text-xs text-text-muted">ID: {retailer._id.slice(-6)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold">
                                            {retailer.orderCount} Orders
                                        </span>
                                    </td>
                                    <td className="py-4 text-right font-bold text-text-primary">
                                        ₹{retailer.totalSales.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default Dashboard;
