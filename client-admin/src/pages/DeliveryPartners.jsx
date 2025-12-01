import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Truck, Search, CheckCircle, XCircle, AlertCircle, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Card, Badge, Button } from '../components/ui/Components';

const DeliveryPartners = () => {
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL'); // ALL, ACTIVE, BLOCKED, PENDING

    useEffect(() => {
        fetchPartners();
    }, []);

    const fetchPartners = async () => {
        try {
            const res = await axios.get('/admin/users?role=DELIVERY_PARTNER');
            setPartners(res.data);
        } catch (error) {
            console.error('Error fetching partners', error);
            toast.error('Failed to load delivery partners');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, newStatus) => {
        if (!window.confirm(`Are you sure you want to change status to ${newStatus}?`)) return;

        try {
            await axios.patch(`/admin/users/${id}/status`, { status: newStatus });
            toast.success(`Partner marked as ${newStatus}`);
            fetchPartners();
        } catch (error) {
            console.error('Error updating status', error);
            toast.error('Failed to update status');
        }
    };

    const filteredPartners = partners.filter(p => {
        if (filter === 'ALL') return true;
        return p.status === filter;
    });

    const getStatusVariant = (status) => {
        switch (status) {
            case 'ACTIVE': return 'success';
            case 'BLOCKED': return 'danger';
            default: return 'warning';
        }
    };

    if (loading) return (
        <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <Card className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                        <Truck className="text-brand-primary" /> Delivery Partners
                    </h2>
                    <span className="px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold">
                        {partners.length} Total
                    </span>
                </div>

                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    {['ALL', 'ACTIVE', 'BLOCKED'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap ${filter === f
                                ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30'
                                : 'bg-bg-primary text-text-secondary hover:bg-bg-secondary'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </Card>

            {/* Partners Table */}
            <Card className="overflow-hidden p-0 border border-border">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-bg-primary border-b border-border">
                            <tr>
                                <th className="p-4 font-bold text-text-muted text-sm uppercase tracking-wider">Name</th>
                                <th className="p-4 font-bold text-text-muted text-sm uppercase tracking-wider">Contact</th>
                                <th className="p-4 font-bold text-text-muted text-sm uppercase tracking-wider">Status</th>
                                <th className="p-4 font-bold text-text-muted text-sm uppercase tracking-wider">Online</th>
                                <th className="p-4 font-bold text-text-muted text-sm uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredPartners.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center text-text-muted">
                                        No delivery partners found.
                                    </td>
                                </tr>
                            ) : (
                                filteredPartners.map(partner => (
                                    <tr key={partner._id} className="hover:bg-bg-primary transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-text-primary">{partner.name}</div>
                                            <div className="text-xs text-text-muted">ID: {partner._id.slice(-6)}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-text-secondary">{partner.email}</div>
                                            <div className="text-sm text-text-muted">{partner.phone}</div>
                                        </td>
                                        <td className="p-4">
                                            <Badge variant={getStatusVariant(partner.status)}>
                                                {partner.status}
                                            </Badge>
                                        </td>
                                        <td className="p-4">
                                            {partner.isOnline ? (
                                                <span className="flex items-center gap-2 text-green-500 text-xs font-bold">
                                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Online
                                                </span>
                                            ) : (
                                                <span className="text-text-muted text-xs font-bold flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-gray-400"></div> Offline
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            {partner.status === 'ACTIVE' ? (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => updateStatus(partner._id, 'BLOCKED')}
                                                    className="text-red-500 hover:bg-red-50 border-red-200 !py-1 !px-3 text-xs"
                                                >
                                                    Block
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => updateStatus(partner._id, 'ACTIVE')}
                                                    className="!py-1 !px-3 text-xs"
                                                >
                                                    Unblock
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default DeliveryPartners;
