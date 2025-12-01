import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Card, Badge, Button } from '../components/ui/Components';
import toast from 'react-hot-toast';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [search, setSearch] = useState('');

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/admin/orders', {
                params: { page, status: statusFilter, search }
            });
            setOrders(res.data.orders);
            setTotalPages(res.data.totalPages);
        } catch (error) {
            // console.error('Error fetching orders', error);
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [page, statusFilter]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchOrders();
    };

    const getStatusVariant = (status) => {
        switch (status) {
            case 'DELIVERED': return 'success';
            case 'CANCELLED': return 'danger';
            case 'PLACED': return 'warning';
            case 'CONFIRMED': return 'info';
            case 'OUT_FOR_DELIVERY': return 'info';
            default: return 'default';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <Card className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <h2 className="text-xl font-bold text-text-primary">Orders</h2>
                    <span className="px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold">
                        {orders.length} Results
                    </span>
                </div>

                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    {/* Search */}
                    <form onSubmit={handleSearch} className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Search Order ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 rounded-xl border border-border bg-bg-primary focus:outline-none focus:ring-2 focus:ring-brand-primary w-full md:w-64 text-sm text-text-primary placeholder-text-muted transition-all"
                        />
                    </form>

                    {/* Filter */}
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="pl-4 pr-10 py-2 rounded-xl border border-border bg-bg-primary focus:outline-none focus:ring-2 focus:ring-brand-primary appearance-none text-sm cursor-pointer text-text-primary transition-all"
                        >
                            <option value="ALL">All Status</option>
                            <option value="PLACED">Placed</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                        <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    </div>
                </div>
            </Card>

            {/* Orders Table */}
            <Card className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-bg-primary border-b border-border">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Order ID</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Retailer</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-text-muted uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-text-muted">Loading orders...</td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-text-muted">No orders found.</td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order._id} className="group hover:bg-bg-primary transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-primary">
                                            #{order._id.slice(-6).toUpperCase()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-text-primary">{order.customer?.name || 'Unknown'}</div>
                                            <div className="text-xs text-text-muted">{order.customer?.phone}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-text-primary">{order.retailer?.storeName || 'Unknown'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-text-primary">
                                            ₹{order.totalAmount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge variant={getStatusVariant(order.status)}>
                                                {order.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => toast('Order details view not implemented yet', { icon: 'ℹ️' })}
                                                className="text-text-muted hover:text-brand-primary transition-colors"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                    <span className="text-sm text-text-secondary">
                        Page {page} of {totalPages}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="!px-2 !py-1"
                        >
                            <ChevronLeft size={16} />
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="!px-2 !py-1"
                        >
                            <ChevronRight size={16} />
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Orders;
