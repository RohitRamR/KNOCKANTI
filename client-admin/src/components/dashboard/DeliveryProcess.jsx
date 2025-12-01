import React from 'react';
import { motion } from 'framer-motion';
import { Package, Truck, CheckCircle, Clock, MapPin } from 'lucide-react';

const DeliveryProcess = () => {
    // Mock data for visualization
    const steps = [
        { id: 1, label: 'Order Placed', count: 12, icon: Clock, color: 'text-blue-400', bg: 'bg-blue-400/20' },
        { id: 2, label: 'Processing', count: 8, icon: Package, color: 'text-purple-400', bg: 'bg-purple-400/20' },
        { id: 3, label: 'In Transit', count: 5, icon: Truck, color: 'text-orange-400', bg: 'bg-orange-400/20' },
        { id: 4, label: 'Delivered', count: 45, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/20' },
    ];

    return (
        <div className="relative h-full flex flex-col justify-between">
            <div className="space-y-6 relative">
                {/* Vertical Line - Now scoped to the steps container */}
                <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-gradient-to-b from-brand-primary/50 to-brand-secondary/50 hidden md:block"></div>

                {steps.map((step, index) => (
                    <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-4 group cursor-pointer relative z-10"
                    >
                        <div className={`w-16 h-16 rounded-2xl ${step.bg} backdrop-blur-md flex items-center justify-center border border-border shadow-lg relative z-10 group-hover:scale-110 transition-transform`}>
                            <step.icon size={28} className={step.color} />
                        </div>

                        <div className="flex-1 p-4 rounded-xl bg-bg-primary border border-border hover:bg-bg-secondary transition-colors">
                            <div className="flex justify-between items-center">
                                <h4 className="font-bold text-text-primary">{step.label}</h4>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${step.bg} ${step.color}`}>
                                    {step.count}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-3 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.random() * 100}%` }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                    className={`h-full ${step.color.replace('text-', 'bg-')}`}
                                />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Live Map Placeholder */}
            <div className="mt-8 p-4 rounded-xl bg-brand-primary/10 border border-brand-primary/20 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex items-center gap-3 text-brand-primary">
                    <div className="relative ml-1.5">
                        <span className="absolute -inset-1 rounded-full bg-brand-primary/50 animate-ping"></span>
                        <MapPin size={20} className="relative z-10" />
                    </div>
                    <span className="font-bold text-sm">Live Tracking Active</span>
                </div>
                <p className="text-xs text-text-secondary mt-1 pl-8">5 drivers currently active on routes</p>
            </div>
        </div>
    );
};

export default DeliveryProcess;
