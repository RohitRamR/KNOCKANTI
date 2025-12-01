import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Check, X, Store, MapPin, Phone, Mail, Clock } from 'lucide-react';
import { Card, Badge, Button } from '../components/ui/Components';
import toast from 'react-hot-toast';

const Retailers = () => {
    const [pendingRetailers, setPendingRetailers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPendingRetailers();
    }, []);

    const fetchPendingRetailers = async () => {
        try {
            const res = await axios.get('/admin/retailers/pending');
            setPendingRetailers(res.data);
        } catch (error) {
            console.error('Error fetching pending retailers', error);
            toast.error('Failed to load pending retailers');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        if (!window.confirm('Are you sure you want to approve this retailer?')) return;
        try {
            await axios.post(`/admin/retailers/${id}/approve`);
            setPendingRetailers(pendingRetailers.filter(r => r._id !== id));
            toast.success('Retailer approved successfully!');
        } catch (error) {
            console.error('Error approving retailer', error);
            toast.error('Error approving retailer');
        }
    };

    if (loading) return (
        <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            <Card className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-text-primary">Pending Approvals</h2>
                    <p className="text-sm text-text-secondary">Review and approve new retailer partners.</p>
                </div>
                <Badge variant="warning" className="text-sm px-3 py-1">
                    {pendingRetailers.length} Pending
                </Badge>
            </Card>

            {pendingRetailers.length === 0 ? (
                <Card className="text-center py-16 border border-border">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-text-primary mb-2">All Caught Up!</h3>
                    <p className="text-text-secondary">No pending retailer applications at the moment.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingRetailers.map((retailer) => (
                        <Card key={retailer._id} className="group hover:scale-[1.02] transition-transform duration-300 border border-border">
                            <div className="flex items-start justify-between mb-6">
                                <div className="w-14 h-14 bg-brand-secondary/10 text-brand-secondary rounded-2xl flex items-center justify-center">
                                    <Store size={28} />
                                </div>
                                <Badge variant="warning">PENDING</Badge>
                            </div>

                            <h3 className="text-lg font-bold text-text-primary mb-1">
                                {retailer.retailerProfile?.storeName || 'Unknown Store'}
                            </h3>
                            <p className="text-sm text-text-secondary mb-6">Owner: {retailer.name}</p>

                            <div className="space-y-3 text-sm text-text-muted mb-8">
                                <div className="flex items-center gap-3">
                                    <Mail size={16} className="text-text-muted" />
                                    <span className="truncate">{retailer.email}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone size={16} className="text-text-muted" />
                                    <span>{retailer.phone}</span>
                                </div>
                                {retailer.retailerProfile?.address?.street && (
                                    <div className="flex items-start gap-3">
                                        <MapPin size={16} className="text-text-muted mt-0.5" />
                                        <span className="line-clamp-2">{retailer.retailerProfile.address.street}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3">
                                    <Clock size={16} className="text-text-muted" />
                                    <span>Applied: {new Date(retailer.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    variant="secondary"
                                    onClick={() => handleApprove(retailer._id)}
                                    className="w-full"
                                >
                                    <Check size={18} /> Approve
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full text-red-500 hover:bg-red-50 border-red-200"
                                >
                                    <X size={18} /> Reject
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Retailers;
