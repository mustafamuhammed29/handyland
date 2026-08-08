import React from 'react';
import { createPortal } from 'react-dom';
import { formatDate } from '../../../utils/formatDate';

interface Loaner {
    _id: string;
    name: string;
    imei: string;
    status: string;
    currentCustomer?: { name: string; phone: string; email: string };
    lentDate?: string;
    dueDate?: string;
    notes?: string;
    createdAt: string;
}

interface LoanPrintTemplateProps {
    loaner: Loaner | null;
}

export const LoanPrintTemplate: React.FC<LoanPrintTemplateProps> = ({ loaner }) => {
    if (!loaner) return null;

    const customer = loaner.currentCustomer || { name: 'Kein Name', phone: '-', email: '-' };

    const printContent = (
        <div className="print-container">
            <div id="print-section" className="bg-white text-black p-8 max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-8">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tighter">HandyLand</h1>
                        <p className="text-gray-600 font-medium">Reparatur & Zubehör Spezialist</p>
                        <p className="text-gray-500 text-sm mt-2">Musterstraße 123, 10115 Berlin<br/>Tel: 030 1234567<br/>info@handyland.de</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl font-bold text-gray-800 uppercase tracking-widest mb-2">Leihvertrag</h2>
                        <div className="inline-block border-2 border-gray-800 p-2 text-center rounded">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Datum</p>
                            <p className="text-xl font-mono font-bold text-gray-900">{formatDate(new Date().toISOString())}</p>
                        </div>
                    </div>
                </div>

                {/* Customer Details */}
                <div className="grid grid-cols-2 gap-12 mb-8">
                    <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-200 pb-2">Kundendaten</h3>
                        <div className="space-y-2 text-gray-800">
                            <p><span className="font-bold inline-block w-24">Name:</span> {customer.name}</p>
                            <p><span className="font-bold inline-block w-24">Telefon:</span> {customer.phone}</p>
                            {customer.email && customer.email !== '-' && <p><span className="font-bold inline-block w-24">Email:</span> {customer.email}</p>}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-200 pb-2">Ausleihe Zeitraum</h3>
                        <div className="space-y-2 text-gray-800">
                            <p><span className="font-bold inline-block w-24">Ausgestellt:</span> {loaner.lentDate ? formatDate(loaner.lentDate) : formatDate(new Date().toISOString())}</p>
                            <p><span className="font-bold inline-block w-24">Rückgabe bis:</span> {loaner.dueDate ? formatDate(loaner.dueDate) : '-'}</p>
                        </div>
                    </div>
                </div>

                {/* Device Details */}
                <div className="mb-12">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-200 pb-2">Details zum Leihgerät</h3>
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase">Gerät</p>
                                <p className="text-lg font-bold text-gray-900">{loaner.name}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase">IMEI / Seriennummer</p>
                                <p className="text-lg font-mono font-bold text-gray-900">{loaner.imei}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Handover Protocol */}
                {loaner.notes && (
                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Übergabeprotokoll / Zustand</h3>
                        <p className="text-gray-700 italic border-l-4 border-gray-300 pl-4 py-2">{loaner.notes}</p>
                    </div>
                )}

                {/* Terms */}
                <div className="mb-16 mt-auto">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-200 pb-2">Allgemeine Leihbedingungen</h3>
                    <ul className="list-disc pl-5 space-y-2 text-xs text-gray-600">
                        <li>Das Leihgerät bleibt Eigentum von HandyLand und darf nicht an Dritte weitergegeben oder veräußert werden.</li>
                        <li>Der Kunde verpflichtet sich, das Gerät sorgfältig zu behandeln und vor Beschädigungen (z.B. Sturz, Feuchtigkeit) zu schützen.</li>
                        <li>Bei Beschädigung, Verlust oder Diebstahl haftet der Kunde für den entstandenen Schaden bis zum vollen Wiederbeschaffungswert des Gerätes.</li>
                        <li>Das Gerät muss spätestens am vereinbarten Rückgabedatum im gleichen Zustand zurückgegeben werden. Bei Überschreitung der Frist behalten wir uns vor, eine Leihgebühr zu berechnen.</li>
                        <li>Bitte entfernen Sie vor Rückgabe alle persönlichen Daten (Konten, Passwörter). Für Datenverlust auf dem Leihgerät übernehmen wir keine Haftung.</li>
                    </ul>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-12 pt-8 border-t border-gray-200">
                    <div className="text-center">
                        <div className="h-16 border-b border-gray-400 mb-2"></div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Unterschrift HandyLand</p>
                    </div>
                    <div className="text-center">
                        <div className="h-16 border-b border-gray-400 mb-2"></div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Unterschrift Kunde</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(printContent, document.body);
};
