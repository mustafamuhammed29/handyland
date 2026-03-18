import React from 'react';
import { X } from 'lucide-react';

interface TicketFormState {
    name: string;
    email: string;
    phone: string;
    notes: string;
    appointmentDate: string;
}

interface RepairTicketModalProps {
    showTicketModal: boolean;
    selectedServiceForTicket: { device: string; service: string } | null;
    setShowTicketModal: (show: boolean) => void;
    handleSubmitTicket: (e: React.FormEvent) => void;
    ticketForm: TicketFormState;
    setTicketForm: React.Dispatch<React.SetStateAction<TicketFormState>>;
    isAuthenticated: boolean;
    submitting: boolean;
}

export const RepairTicketModal: React.FC<RepairTicketModalProps> = ({
    showTicketModal,
    selectedServiceForTicket,
    setShowTicketModal,
    handleSubmitTicket,
    ticketForm,
    setTicketForm,
    isAuthenticated,
    submitting,
}) => {
    if (!showTicketModal || !selectedServiceForTicket) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-cyan-400"></div>
                <button
                    onClick={() => setShowTicketModal(false)}
                    aria-label="Close form"
                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="p-6 md:p-8">
                    <h3 className="text-2xl font-black text-white mb-2">Request Repair Ticket</h3>
                    <p className="text-slate-400 text-sm mb-6">You are booking a repair for <strong className="text-blue-400">{selectedServiceForTicket.device}</strong> ({selectedServiceForTicket.service}). Our team will review this request and contact you.</p>

                    <form onSubmit={handleSubmitTicket} className="space-y-4">
                        {!isAuthenticated && (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Full Name *</label>
                                    <input
                                        type="text"
                                        required
                                        title="Full Name"
                                        placeholder="Full Name"
                                        value={ticketForm.name}
                                        onChange={e => setTicketForm({ ...ticketForm, name: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Email Address *</label>
                                    <input
                                        type="email"
                                        required
                                        title="Email Address"
                                        placeholder="Email Address"
                                        value={ticketForm.email}
                                        onChange={e => setTicketForm({ ...ticketForm, email: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
                                    />
                                    <p className="text-[10px] text-slate-500 mt-1">We need your email so you can track your repair progress later online.</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Phone Number</label>
                                    <input
                                        type="text"
                                        title="Phone Number"
                                        placeholder="Phone Number"
                                        value={ticketForm.phone}
                                        onChange={e => setTicketForm({ ...ticketForm, phone: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
                                    />
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Store Visit Date <span className="font-normal normal-case opacity-50">(Optional)</span></label>
                            <input
                                type="date"
                                title="Appointment Date"
                                value={ticketForm.appointmentDate}
                                onChange={e => setTicketForm({ ...ticketForm, appointmentDate: e.target.value })}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
                                style={{ colorScheme: 'dark' }}
                            />
                            <p className="text-[10px] text-slate-500 mt-1">When do you plan to bring the device to our store?</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Additional Notes <span className="font-normal normal-case opacity-50">(Optional)</span></label>
                            <textarea
                                rows={3}
                                value={ticketForm.notes}
                                onChange={e => setTicketForm({ ...ticketForm, notes: e.target.value })}
                                placeholder="Describe the issue in more detail if needed..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 outline-none resize-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-4 mt-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all flex justify-center items-center"
                        >
                            {submitting ? 'Creating Ticket...' : 'Confirm Request'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
