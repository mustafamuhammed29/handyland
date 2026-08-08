import React from 'react';
import { createPortal } from 'react-dom';
import { formatDate } from '../../../utils/formatDate';

interface Warranty {
    _id: string;
    warrantyCode: string;
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    itemType: string;
    itemName: string;
    imeiOrSerial: string;
    supplierName?: string;
    startDate: string;
    durationDays: number;
    endDate: string;
    status: string;
    notes?: string;
    createdAt: string;
}

interface WarrantyPrintTemplateProps {
    warranty: Warranty | null;
}

export const WarrantyPrintTemplate: React.FC<WarrantyPrintTemplateProps> = ({ warranty }) => {
    if (!warranty) return null;

    const printContent = (
        <div className="print-container">
            <div id="print-section" className="bg-white text-black p-8 max-w-4xl mx-auto border-2 border-gray-200 rounded-lg">
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-8">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tighter">HandyLand</h1>
                        <p className="text-gray-600 font-medium">Reparatur & Zubehör Spezialist</p>
                        <p className="text-gray-500 text-sm mt-2">Musterstraße 123, 10115 Berlin<br/>Tel: 030 1234567<br/>info@handyland.de</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl font-bold text-gray-800 uppercase tracking-widest mb-2">Garantiezertifikat</h2>
                        <div className="inline-block border-2 border-gray-800 p-2 text-center rounded">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Garantie-Nr.</p>
                            <p className="text-xl font-mono font-bold text-gray-900">{warranty._id.slice(-6).toUpperCase()}</p>
                        </div>
                    </div>
                </div>

                {/* Customer Details */}
                <div className="grid grid-cols-2 gap-12 mb-8">
                    <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-200 pb-2">Kundendaten</h3>
                        <div className="space-y-2 text-gray-800">
                            <p><span className="font-bold inline-block w-24">Name:</span> {warranty.customerName}</p>
                            {warranty.customerPhone && <p><span className="font-bold inline-block w-24">Telefon:</span> {warranty.customerPhone}</p>}
                            {warranty.customerEmail && <p><span className="font-bold inline-block w-24">Email:</span> {warranty.customerEmail}</p>}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-200 pb-2">Garantiezeitraum</h3>
                        <div className="space-y-2 text-gray-800">
                            <p><span className="font-bold inline-block w-24">Ausgestellt:</span> {formatDate(warranty.startDate)}</p>
                            <p><span className="font-bold inline-block w-24">Gültig bis:</span> <span className="font-bold text-black">{formatDate(warranty.endDate)}</span></p>
                            <p><span className="font-bold inline-block w-24">Dauer:</span> {warranty.durationDays} Tage</p>
                        </div>
                    </div>
                </div>

                {/* Device & Repair Details */}
                <div className="mb-12">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-200 pb-2">Gerät & Reparaturdetails</h3>
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-200">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase">Gerät / Artikel</p>
                                <p className="text-lg font-bold text-gray-900">{warranty.itemName}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase">IMEI / Seriennummer</p>
                                <p className="text-lg font-mono font-bold text-gray-900">{warranty.imeiOrSerial || '-'}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Typ</p>
                            <p className="text-lg font-bold text-gray-900">{warranty.itemType}</p>
                        </div>
                    </div>
                </div>

                {/* Terms */}
                <div className="mb-16 mt-auto">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-200 pb-2">Garantiebedingungen</h3>
                    <ul className="list-disc pl-5 space-y-2 text-xs text-gray-600">
                        <li>Diese Garantie deckt ausschließlich Material- und Verarbeitungsfehler der ausgetauschten Ersatzteile ab.</li>
                        <li>Ausgeschlossen von der Garantie sind Schäden durch unsachgemäße Handhabung, Sturz, Wasserschäden oder Fremdeingriffe nach unserer Reparatur.</li>
                        <li>Zur Inanspruchnahme der Garantie muss dieses Zertifikat zusammen mit dem Original-Kaufbeleg vorgelegt werden.</li>
                        <li>Die Garantiezeit verlängert sich nicht durch eine durchgeführte Garantiereparatur.</li>
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
