import React from 'react';
import { Package, Truck, CheckCircle2, Clock, Wrench } from 'lucide-react';

interface TimelineStep {
    id: string;
    label: string;
    description?: string;
    date?: string;
    icon: React.ReactNode;
}

interface VisualOrderTimelineProps {
    currentStatus: string;
    type?: 'order' | 'repair' | 'valuation';
    history?: { status: string; date: string }[];
}

export const VisualOrderTimeline: React.FC<VisualOrderTimelineProps> = ({ currentStatus, type = 'order', history = [] }) => {

    // Abstract the mapping logic based on type
    const getStepsForType = () => {
        if (type === 'repair') {
            return [
                { id: 'pending', label: 'Ticket Created', icon: <Package className="w-5 h-5" /> },
                { id: 'processing', label: 'Device Received', icon: <Wrench className="w-5 h-5" /> },
                { id: 'in_repair', label: 'In Repair', icon: <Clock className="w-5 h-5" /> },
                { id: 'completed', label: 'Fixed & Shipped', icon: <Truck className="w-5 h-5" /> },
                { id: 'delivered', label: 'Delivered', icon: <CheckCircle2 className="w-5 h-5" /> }
            ];
        }
        // Default order steps
        return [
            { id: 'pending', label: 'Order Placed', icon: <Package className="w-5 h-5" /> },
            { id: 'processing', label: 'Processing', icon: <Clock className="w-5 h-5" /> },
            { id: 'shipped', label: 'Shipped', icon: <Truck className="w-5 h-5" /> },
            { id: 'delivered', label: 'Delivered', icon: <CheckCircle2 className="w-5 h-5" /> }
        ];
    };

    const steps = getStepsForType();

    // Find the index of the current status
    // Note: If status is 'cancelled' or unrecognized, current step might be -1.
    const normalizedStatus = currentStatus.toLowerCase();

    // For repairs, we map 'created' -> 'pending', 'diagnosing' -> 'processing', etc. if needed
    // Assuming backend returns standard statuses or they match `id`.
    let currentStepIndex = steps.findIndex(s => s.id === normalizedStatus || normalizedStatus.includes(s.id));

    // Fallback logic for common variations
    if (currentStepIndex === -1) {
        if (normalizedStatus === 'created' || normalizedStatus === 'new') currentStepIndex = 0;
        else if (normalizedStatus === 'diagnosing' || normalizedStatus === 'approved') currentStepIndex = 1; // Repair specific mapping
        else if (normalizedStatus === 'in-transit') currentStepIndex = 2; // Shipped / Fixed
        else if (normalizedStatus === 'completed') currentStepIndex = steps.length - 1; // Sometimes completed == delivered
    }

    const isCancelled = normalizedStatus === 'cancelled' || normalizedStatus === 'failed';

    return (
        <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-6">Tracking Status</h3>

            {isCancelled ? (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500">
                    <XCircle className="w-6 h-6 shrink-0" />
                    <div>
                        <p className="font-bold">Order Cancelled</p>
                        <p className="text-sm opacity-80">This transaction has been cancelled and will not proceed.</p>
                    </div>
                </div>
            ) : (
                <div className="relative">
                    {/* Progression Line (Background) */}
                    <div className="absolute top-6 left-0 w-full h-1 bg-slate-800 rounded-full hidden md:block"></div>

                    {/* Progression Line (Active Fill) */}
                    <div
                        className="absolute top-6 left-0 h-1 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full hidden md:block transition-all duration-1000 ease-out"
                        style={{ width: `${currentStepIndex >= 0 ? (currentStepIndex / (steps.length - 1)) * 100 : 0}%` }}
                    ></div>

                    <div className="flex flex-col md:flex-row justify-between relative z-10 gap-6 md:gap-0">
                        {steps.map((step, index) => {
                            const isCompleted = index < currentStepIndex;
                            const isActive = index === currentStepIndex;
                            const isPending = index > currentStepIndex;

                            // Find matching history date if available
                            const historyItem = history.find(h => h.status.toLowerCase() === step.id);

                            return (
                                <div key={step.id} className="flex md:flex-col items-center gap-4 md:gap-3 flex-1">
                                    {/* Mobile/Vertical Line */}
                                    {index !== steps.length - 1 && (
                                        <div className={`absolute left-[1.3rem] top-12 bottom-[-1.5rem] w-0.5 md:hidden ${isCompleted ? 'bg-brand-primary' : 'bg-slate-800'}`}></div>
                                    )}

                                    {/* Icon Container */}
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all duration-500 z-10
                                        ${isCompleted ? 'bg-brand-primary border-cyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]' :
                                            isActive ? 'bg-slate-900 border-brand-primary text-brand-primary animate-pulse shadow-[0_0_20px_rgba(6,182,212,0.2)]' :
                                                'bg-slate-900 border-slate-800 text-slate-600'}
                                    `}>
                                        {step.icon}
                                    </div>

                                    {/* Text Info */}
                                    <div className="md:text-center mt-1">
                                        <p className={`font-bold text-sm ${isActive ? 'text-white' : isCompleted ? 'text-slate-300' : 'text-slate-500'}`}>
                                            {step.label}
                                        </p>
                                        <p className="text-xs font-mono text-slate-500 mt-0.5">
                                            {historyItem ? new Date(historyItem.date).toLocaleDateString() : (isActive ? 'In Progress' : '')}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

// Quick fix for missing XCircle import in the cancelled state
import { XCircle } from 'lucide-react';
