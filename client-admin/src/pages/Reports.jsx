import React from 'react';
import { Card } from '../components/ui/Components';
import { FileText, BarChart } from 'lucide-react';

const Reports = () => {
    return (
        <div className="space-y-6">
            <Card className="flex items-center gap-4 py-8 border border-border">
                <div className="p-4 bg-brand-secondary/10 rounded-full text-brand-secondary">
                    <FileText size={32} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-text-primary">Reports & Analytics</h2>
                    <p className="text-text-secondary">View detailed sales and performance reports.</p>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="flex flex-col items-center justify-center py-16 text-center hover:border-brand-primary transition-colors cursor-pointer group border border-border">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <BarChart size={32} className="text-blue-500" />
                    </div>
                    <h3 className="text-lg font-bold text-text-primary">Sales Report</h3>
                    <p className="text-sm text-text-secondary mt-1">Download monthly sales data</p>
                </Card>

                <Card className="flex flex-col items-center justify-center py-16 text-center hover:border-brand-secondary transition-colors cursor-pointer group border border-border">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <FileText size={32} className="text-green-500" />
                    </div>
                    <h3 className="text-lg font-bold text-text-primary">Tax Invoice</h3>
                    <p className="text-sm text-text-secondary mt-1">Generate tax invoices for orders</p>
                </Card>
            </div>
        </div>
    );
};

export default Reports;
