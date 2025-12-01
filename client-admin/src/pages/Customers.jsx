import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Badge, Button } from '../components/ui/Components';
import { Users, Search, Mail, Phone, Calendar, Ban, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchCustomers = async () => {
        try {
            const res = await axios.get('/admin/users?role=CUSTOMER');
            setCustomers(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching customers:', error);
            toast.error('Failed to load customers');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleStatusUpdate = async (id, currentStatus) => {
        const newStatus = currentStatus === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
        try {
            await axios.patch(`/admin/users/${id}/status`, { status: newStatus });
            toast.success(`Customer ${newStatus === 'ACTIVE' ? 'unblocked' : 'blocked'} successfully`);
            fetchCustomers();
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        }
    };

    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.phone && customer.phone.includes(searchTerm))
    );

    return (
        <div className="space-y-6">
            <Card className="flex flex-col md:flex-row justify-between items-center gap-4 border border-border">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="p-3 bg-brand-accent/10 rounded-xl text-brand-accent">
                        <Users size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-text-primary">Customers</h2>
                        <p className="text-sm text-text-secondary">Manage customer accounts</p>
                    </div>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={18} />
                    <input
                        type="text"
                        placeholder="Search customers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
                    />
                </div>
            </Card>

            <Card className="overflow-hidden p-0 border border-border">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-bg-primary border-b border-border">
                            <tr>
                                <th className="p-4 font-bold text-text-muted text-sm uppercase tracking-wider">Customer</th>
                                <th className="p-4 font-bold text-text-muted text-sm uppercase tracking-wider">Contact</th>
                                <th className="p-4 font-bold text-text-muted text-sm uppercase tracking-wider">Joined</th>
                                <th className="p-4 font-bold text-text-muted text-sm uppercase tracking-wider">Status</th>
                                <th className="p-4 font-bold text-text-muted text-sm uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-text-muted">Loading customers...</td>
                                </tr>
                            ) : filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-text-muted">No customers found.</td>
                                </tr>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <tr key={customer._id} className="hover:bg-bg-primary transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-brand-accent/10 text-brand-accent flex items-center justify-center font-bold">
                                                    {customer.name[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-text-primary">{customer.name}</p>
                                                    <p className="text-xs text-text-muted">ID: {customer._id.slice(-6)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-sm text-text-secondary">
                                                    <Mail size={14} /> {customer.email}
                                                </div>
                                                {customer.phone && (
                                                    <div className="flex items-center gap-2 text-sm text-text-muted">
                                                        <Phone size={14} /> {customer.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-sm text-text-secondary">
                                                <Calendar size={14} />
                                                {new Date(customer.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <Badge variant={customer.status === 'ACTIVE' ? 'success' : 'danger'}>
                                                {customer.status}
                                            </Badge>
                                        </td>
                                        <td className="p-4 text-right">
                                            <Button
                                                variant="outline"
                                                onClick={() => handleStatusUpdate(customer._id, customer.status)}
                                                className={`!py-1 !px-3 text-xs ${customer.status === 'ACTIVE'
                                                        ? 'text-red-500 border-red-200 hover:bg-red-50'
                                                        : 'text-green-500 border-green-200 hover:bg-green-50'
                                                    }`}
                                            >
                                                {customer.status === 'ACTIVE' ? (
                                                    <><Ban size={14} /> Block</>
                                                ) : (
                                                    <><CheckCircle size={14} /> Unblock</>
                                                )}
                                            </Button>
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

export default Customers;
