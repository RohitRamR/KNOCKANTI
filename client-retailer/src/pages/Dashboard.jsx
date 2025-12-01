import { useEffect, useState } from 'react';
import axios from 'axios';
import { DollarSign, ShoppingBag, TrendingUp } from 'lucide-react';

import io from 'socket.io-client';

const Dashboard = () => {
    const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0 });

    useEffect(() => {
        fetchStats();

        const socket = io('http://localhost:5002');

        socket.on('connect', () => {
            console.log('Dashboard connected to socket', socket.id);
        });

        socket.on('orderPlaced', (data) => {
            console.log('Order placed event received', data);
            fetchStats();
        });
        socket.on('stockUpdate', (data) => {
            console.log('Stock update event received', data);
            fetchStats();
        });

        return () => socket.disconnect();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await axios.get('/retailer/reports/sales');
            setStats(res.data);
        } catch (error) {
            console.error('Error fetching stats', error);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-green-100 text-green-600 rounded-full">
                    <DollarSign size={24} />
                </div>
                <div>
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Total Revenue</h3>
                    <p className="text-2xl font-bold text-gray-800">₹{stats.totalRevenue.toFixed(2)}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                    <ShoppingBag size={24} />
                </div>
                <div>
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Total Orders</h3>
                    <p className="text-2xl font-bold text-gray-800">{stats.totalOrders}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
                    <TrendingUp size={24} />
                </div>
                <div>
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Today's Sales</h3>
                    <p className="text-2xl font-bold text-gray-800">₹0.00</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
