import React from 'react';
import { Package, Truck, CheckCircle2, Clock, Wrench, Search, ShieldCheck, Inbox, XCircle } from 'lucide-react';

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
                { id: 'received', label: 'Device Received', icon: <Inbox className="w-5 h-5" /> },
                { id: 'diagnosing', label: 'Diagnosing', icon: <Search className="w-5 h-5" /> },
                { id: 'waiting parts', label: 'Waiting Parts', icon: <Clock className="w-5 h-5" /> },
                { id: 'repairing', label: 'Repairing', icon: <Wrench className="w-5 h-5" /> },
                { id: 'testing', label: 'Testing', icon: <ShieldCheck className="w-5 h-5" /> },
                { id: 'ready for pickup', label: 'Ready for Pickup', icon: <Truck className="w-5 h-5" /> },
                { id: 'completed', label: 'Completed', icon: <CheckCircle2 className="w-5 h-5" /> }
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

    // For order common variations fallback
    if (currentStepIndex === -1 && type === 'order') {
        if (normalizedStatus === 'created' || normalizedStatus === 'new') currentStepIndex = 0;
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
                <div className="overflow-x-auto pb-4 custom-scrollbar w-full">
                    <div className="relative min-w-full md:min-w-[900px]">
                        {/* Progression Line (Background) */}
                        <div className="absolute top-6 left-6 right-6 h-1 bg-slate-800 rounded-full hidden md:block"></div>

                        {/* Progression Line (Active Fill) */}
                        <div
                            className="absolute top-6 left-6 h-1 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full hidden md:block transition-all duration-1000 ease-out"
                            style={{ width: `calc(${currentStepIndex >= 0 ? (currentStepIndex / (steps.length - 1)) * 100 : 0}% - 3rem)` }}
                        ></div>

                        <div className="flex flex-col md:flex-row justify-between relative z-10 gap-8 md:gap-2">
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
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all duration-500 z-10 md:mx-auto
                                        ${isCompleted ? 'bg-brand-primary border-cyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]' :
                                            isActive ? 'bg-slate-900 border-brand-primary text-brand-primary animate-pulse shadow-[0_0_20px_rgba(6,182,212,0.2)]' :
                                                'bg-slate-900 border-slate-800 text-slate-600'}
                                    `}>
                                        {step.icon}
                                    </div>

                                    {/* Text Info */}
                                    <div className="md:text-center mt-1 md:mt-2 md:max-w-[100px]">
                                        <p className={`font-bold text-xs md:text-sm leading-tight md:break-words ${isActive ? 'text-white' : isCompleted ? 'text-slate-300' : 'text-slate-500'}`}>
                                            {step.label}
                                        </p>
                                        <p className="text-[10px] font-mono text-slate-500 mt-1">
                                            {historyItem ? new Date(historyItem.date).toLocaleDateString() : (isActive ? 'In Progress' : '')}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                </div>
            )}
        </div>
    );
};
