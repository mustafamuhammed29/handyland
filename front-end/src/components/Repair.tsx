import React, { useState, useEffect } from 'react';
import { LanguageCode } from '../types';
import { Search, Wrench, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../utils/api';
import { RepairDevice } from './repair/types';
import { RepairDeviceModal } from './repair/RepairDeviceModal';
import { RepairCatalogList } from './repair/RepairCatalogList';
import { RepairTicketModal } from './repair/RepairTicketModal';

interface RepairProps {
    lang: LanguageCode;
}

export const Repair: React.FC<RepairProps> = ({ lang }) => {
    const { t } = useTranslation();
    const { settings } = useSettings();
    const { isAuthenticated, user } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDevice, setSelectedDevice] = useState<RepairDevice | null>(null);
    const [repairCatalog, setRepairCatalog] = useState<RepairDevice[]>([]);
    const [loading, setLoading] = useState(true);

    // Ticket Modal State
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [selectedServiceForTicket, setSelectedServiceForTicket] = useState<{ device: string, service: string } | null>(null);
    const [ticketForm, setTicketForm] = useState({
        name: '',
        email: '',
        phone: '',
        notes: '',
        appointmentDate: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const loadRepairs = async () => {
            if (!searchTerm || searchTerm.trim() === '') {
                setRepairCatalog([]);
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const response = await api.get<RepairDevice[]>(`/api/repairs?search=${searchTerm}`);

                // Axios returns the data in the .data property, but interceptor already unwraps it
                // So 'response' IS the data (RepairDevice[])
                const repairsData = (Array.isArray(response) ? response : response['data']) || [];

                if (Array.isArray(repairsData)) {
                    setRepairCatalog(repairsData);
                } else {
                    setRepairCatalog([]);
                }
            } catch (err) {
                addToast('Failed to load repair catalog. Check console.', 'error');
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            loadRepairs();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const filteredDevices = repairCatalog;

    const handleOpenTicketModal = (deviceModel: string, serviceLabel?: string) => {
        setSelectedServiceForTicket({ device: deviceModel, service: serviceLabel || 'General Diagnostic' });
        setShowTicketModal(true);
    };

    const handleSubmitTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedServiceForTicket) return;
        setSubmitting(true);
        try {
            const payload: any = {
                device: selectedServiceForTicket.device,
                issue: selectedServiceForTicket.service,
                notes: ticketForm.notes,
                appointmentDate: ticketForm.appointmentDate,
                serviceType: 'In-Store'
            };

            if (!isAuthenticated) {
                payload.guestContact = {
                    name: ticketForm.name,
                    email: ticketForm.email,
                    phone: ticketForm.phone
                };
            }

            const response: any = await api.post('/api/repairs/tickets', payload);
            if (response?.success) {
                addToast('Repair Ticket Created Successfully!', 'success');
                setShowTicketModal(false);
                setSelectedDevice(null);
                setTicketForm({ name: '', email: '', phone: '', notes: '', appointmentDate: '' });
                // Redirect user to track repair with their new ticket ID
                setTimeout(() => {
                    navigate('/track-repair', { 
                        state: { 
                            ticketId: response.ticket.ticketId, 
                            email: isAuthenticated ? user?.email : ticketForm.email 
                        } 
                    });
                }, 1500);
            } else {
                addToast(response?.message || 'Failed to create repair ticket. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Ticket creation error', error);
            addToast('Failed to create repair ticket. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="relative min-h-screen py-20 overflow-hidden bg-slate-900">

            {/* Abstract Background Tech Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none"></div>

            {/* --- SERVICE DETAIL MODAL (BLUEPRINT STYLE) --- */}
            {selectedDevice && (
                <RepairDeviceModal
                    selectedDevice={selectedDevice}
                    setSelectedDevice={setSelectedDevice}
                    handleOpenTicketModal={handleOpenTicketModal}
                />
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Wrench className="w-6 h-6 text-blue-500" />
                            <span className="text-blue-500 font-mono text-sm tracking-widest uppercase">{t('repair.title')}</span>
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-black text-white">
                            {settings?.content?.repairTitle || t('repair.title')}
                        </h2>
                        <p className="text-slate-400 mt-2 font-light border-l-2 border-blue-900 pl-4">
                            {settings?.content?.repairSubtitle || t('repair.subtitle')}
                        </p>
                    </div>

                    {/* The Custom Diagnostics button has been removed based on user feedback */}
                </div>

                {/* Search & Interface Panel */}
                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700 rounded-3xl p-1 mb-10 shadow-[0_0_50px_rgba(37,99,235,0.1)]">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="SEARCH DEVICE MODEL (e.g. iPhone 15, S24)..."
                            className="w-full pl-14 pr-6 py-5 bg-black/50 border border-transparent rounded-2xl text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-lg font-mono placeholder:text-slate-600 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="absolute left-5 top-5 text-slate-500">
                            <Search className="w-6 h-6" />
                        </div>

                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none opacity-50 hidden md:flex">
                        </div>
                    </div>
                </div>

                {/* DEVICE CATALOG GRID */}
                <RepairCatalogList
                    filteredDevices={filteredDevices}
                    setSelectedDevice={setSelectedDevice}
                    searchTerm={searchTerm}
                />

            </div>

            {/* --- REPAIR TICKET MODAL --- */}
            <RepairTicketModal
                showTicketModal={showTicketModal}
                selectedServiceForTicket={selectedServiceForTicket}
                setShowTicketModal={setShowTicketModal}
                handleSubmitTicket={handleSubmitTicket}
                ticketForm={ticketForm}
                setTicketForm={setTicketForm}
                isAuthenticated={isAuthenticated}
                submitting={submitting}
            />
        </div>
    );
};