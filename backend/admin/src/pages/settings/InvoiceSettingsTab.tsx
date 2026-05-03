import React from 'react';
import { FileText, Eye } from 'lucide-react';
import ImageUpload from '../../components/ImageUpload';

interface InvoiceSettingsTabProps {
    settings: any;
    handleChange: (section: any, key: string, value: any) => void;
}

const Input = ({ label, value, onChange, placeholder = '' }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string }) => (
    <div className="mb-4">
        <label className="block text-slate-400 text-sm font-bold mb-2">{label}</label>
        <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors"
        />
    </div>
);

export const InvoiceSettingsTab: React.FC<InvoiceSettingsTabProps> = ({ settings, handleChange }) => {
    // Ensure invoice object exists
    const invoice = settings.invoice || {};
    const taxRate = settings.taxRate || 19;

    // Dummy order data for preview
    const dummyDate = new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' });
    const dummyOrderNumber = '1000248';
    
    // Using import.meta.env to mock the image URL if possible, otherwise it will just use relative or absolute
    // Note: in admin pane, ImageUpload might return relative '/uploads/...'. 
    // Usually it resolves if proxy is set or we prepend baseUrl, but for preview we can just render the direct path
    // if it's external, or rely on normal browser resolution.
    const renderLogo = invoice.logoUrl 
        ? <img src={invoice.logoUrl.startsWith('http') ? invoice.logoUrl : `http://localhost:5000${invoice.logoUrl}`} alt="Logo" style={{ maxHeight: `${invoice.logoHeight || 40}px` }} className="object-contain" />
        : <div className="text-xl font-bold" style={{ color: '#000' }}>{(invoice.companyName || 'HandyLand').replace('Land', '')}<span style={{ color: invoice.primaryColor || '#00bcd4' }}>Land</span></div>;

    return (
        <div className="flex flex-col xl:flex-row gap-8">
            {/* Left Column: Settings Form */}
            <div className="flex-1 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-indigo-500/10 rounded-xl">
                        <FileText className="text-indigo-400" size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Rechnungs-Einstellungen</h3>
                        <p className="text-slate-400 text-sm">Konfigurieren Sie das Aussehen und die Details der generierten Rechnungen für Kundenbestellungen.</p>
                    </div>
                </div>

                {/* German Legal Compliance Notice */}
                <div className="p-4 bg-emerald-900/20 border border-emerald-800 rounded-xl text-sm flex gap-3 items-start">
                    <span className="text-2xl mt-0.5">🇩🇪</span>
                    <div>
                        <p className="text-emerald-400 font-bold mb-1">Finanzamt-konforme Rechnungen</p>
                        <p className="text-emerald-300/80 mb-2">Damit Ihre Rechnungen in Deutschland rechtlich gültig sind, stellen Sie sicher, dass Sie Ihren vollständigen Firmennamen, die Adresse und die <strong className="text-emerald-300">USt-IdNr. (VAT ID)</strong> angeben. Wenn Sie Kleinunternehmer sind, setzen Sie die Steuer auf 0% und fügen Sie den Hinweis gemäß §19 UStG in die Fußzeile ein.</p>
                    </div>
                </div>

                {/* Brand & Identity */}
                <div className="p-5 border border-slate-700 rounded-xl space-y-5 bg-slate-900/50">
                    <h4 className="text-blue-400 font-bold mb-2 text-lg">Marke & Identität</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <ImageUpload 
                                label="Rechnungslogo (Optional)" 
                                value={invoice.logoUrl || ''} 
                                onChange={(url) => handleChange('invoice', 'logoUrl', url)} 
                            />
                            <p className="text-xs text-slate-500 mt-1">Falls leer, wird der Firmenname verwendet.</p>
                            
                            <div className="mt-4">
                                <label className="block text-slate-400 text-sm font-bold mb-2">Logogröße (Höhe in px)</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min="20"
                                        max="150"
                                        title="Logogröße"
                                        aria-label="Logogröße"
                                        value={invoice.logoHeight || 40}
                                        onChange={(e) => handleChange('invoice', 'logoHeight', parseInt(e.target.value))}
                                        className="w-full cursor-pointer accent-blue-500"
                                    />
                                    <span className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-sm text-white min-w-[50px] text-center">
                                        {invoice.logoHeight || 40}px
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-slate-400 text-sm font-bold mb-2">Primärfarbe (Akzentfarbe)</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    title="Farbauswahl"
                                    aria-label="Farbauswahl"
                                    value={invoice.primaryColor || '#00bcd4'}
                                    onChange={(e) => handleChange('invoice', 'primaryColor', e.target.value)}
                                    className="w-12 h-12 rounded cursor-pointer bg-transparent border-none appearance-none p-0"
                                />
                                <input
                                    type="text"
                                    title="Farbcode"
                                    aria-label="Farbcode"
                                    placeholder="#00bcd4"
                                    value={invoice.primaryColor || '#00bcd4'}
                                    onChange={(e) => handleChange('invoice', 'primaryColor', e.target.value)}
                                    className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors w-full uppercase font-mono text-sm"
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Wird für Titel und Hervorhebungen verwendet.</p>
                        </div>
                    </div>
                </div>

                {/* Company Information */}
                <div className="p-5 border border-slate-700 rounded-xl space-y-5 bg-slate-900/50">
                    <h4 className="text-blue-400 font-bold mb-2 text-lg">Unternehmensdaten</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Offizieller Firmenname" value={invoice.companyName} onChange={(v) => handleChange('invoice', 'companyName', v)} placeholder="Musterfirma GmbH" />
                        <Input label="USt-IdNr. (VAT ID)" value={invoice.vatNumber} onChange={(v) => handleChange('invoice', 'vatNumber', v)} placeholder="DE123456789" />
                    </div>
                    <div className="mb-4">
                        <label className="block text-slate-400 text-sm font-bold mb-2">Vollständige Adresse</label>
                        <textarea
                            value={invoice.companyAddress || ''}
                            onChange={(e) => handleChange('invoice', 'companyAddress', e.target.value)}
                            placeholder="Musterstraße 1 - 10115 Berlin - Deutschland"
                            rows={2}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none resize-none transition-colors"
                        />
                    </div>
                </div>

                {/* Bank Information */}
                <div className="p-5 border border-slate-700 rounded-xl space-y-5 bg-slate-900/50">
                    <h4 className="text-blue-400 font-bold mb-2 text-lg">Bankverbindung (Für Fußzeile)</h4>
                    <p className="text-sm text-slate-400 mb-4">Erforderlich für Kunden, die per Vorkasse/Überweisung bezahlen.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input label="Name der Bank" value={invoice.bankName} onChange={(v) => handleChange('invoice', 'bankName', v)} placeholder="Sparkasse Berlin" />
                        <Input label="IBAN" value={invoice.iban} onChange={(v) => handleChange('invoice', 'iban', v)} placeholder="DE12 3456 ..." />
                        <Input label="BIC / SWIFT" value={invoice.bic} onChange={(v) => handleChange('invoice', 'bic', v)} placeholder="WELADED..." />
                    </div>
                </div>

                {/* Formatting & Text */}
                <div className="p-5 border border-slate-700 rounded-xl space-y-5 bg-slate-900/50">
                    <h4 className="text-blue-400 font-bold mb-2 text-lg">Formatierung & Fußzeile</h4>
                    <div className="mb-4 w-full md:w-1/2 pr-0 md:pr-2">
                        <Input label="Präfix der Rechnungsnummer" value={invoice.prefix} onChange={(v) => handleChange('invoice', 'prefix', v)} placeholder="RE-" />
                        <p className="text-xs text-slate-500 mt-1">Beispiel: RE-[Bestellnummer]</p>
                    </div>
                    <div className="mb-4">
                        <label className="block text-slate-400 text-sm font-bold mb-2">Fußzeilen-Text / Rechtlicher Hinweis</label>
                        <textarea
                            value={invoice.footerText || ''}
                            onChange={(e) => handleChange('invoice', 'footerText', e.target.value)}
                            placeholder="Vielen Dank für Ihren Einkauf! / Gemäß § 19 UStG wird keine Umsatzsteuer berechnet."
                            rows={3}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none resize-none transition-colors"
                        />
                    </div>
                </div>

                {/* Translations */}
                <div className="p-5 border border-slate-700 rounded-xl space-y-5 bg-slate-900/50">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <h4 className="text-blue-400 font-bold mb-2 text-lg">Bezeichnungen & Übersetzungen</h4>
                            <p className="text-slate-400 text-sm">Passen Sie die Standardbegriffe der Rechnung an Ihre Sprache an.</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-0">
                        {/* Column 1: Header */}
                        <div>
                            <h5 className="text-xs font-bold text-slate-500 uppercase mb-3 pb-1 border-b border-slate-800">Kopfbereich</h5>
                            <Input label="Rechnungstitel" value={invoice.titleLabel} onChange={(v) => handleChange('invoice', 'titleLabel', v)} placeholder="Rechnung" />
                            <Input label="Datum Label" value={invoice.dateLabel} onChange={(v) => handleChange('invoice', 'dateLabel', v)} placeholder="Datum:" />
                            <Input label="Rechnungsnummer" value={invoice.numberLabel} onChange={(v) => handleChange('invoice', 'numberLabel', v)} placeholder="Rechnungsnr.:" />
                            <Input label="USt-IdNr. Label" value={invoice.vatIdLabel} onChange={(v) => handleChange('invoice', 'vatIdLabel', v)} placeholder="USt-IdNr.:" />
                        </div>
                        
                        {/* Column 2: Table */}
                        <div>
                            <h5 className="text-xs font-bold text-slate-500 uppercase mb-3 pb-1 border-b border-slate-800">Tabellenspalten</h5>
                            <Input label="Artikel Label" value={invoice.itemLabel} onChange={(v) => handleChange('invoice', 'itemLabel', v)} placeholder="Artikel" />
                            <Input label="Menge Label" value={invoice.quantityLabel} onChange={(v) => handleChange('invoice', 'quantityLabel', v)} placeholder="Menge" />
                            <Input label="Preis Label" value={invoice.priceLabel} onChange={(v) => handleChange('invoice', 'priceLabel', v)} placeholder="Preis" />
                        </div>
                        
                        {/* Column 3: Totals & Buttons */}
                        <div>
                            <h5 className="text-xs font-bold text-slate-500 uppercase mb-3 pb-1 border-b border-slate-800">Summen & Aktionen</h5>
                            <Input label="Zwischensumme" value={invoice.subtotalLabel} onChange={(v) => handleChange('invoice', 'subtotalLabel', v)} placeholder="Zwischensumme:" />
                            <Input label="Steuer Label" value={invoice.taxLabel} onChange={(v) => handleChange('invoice', 'taxLabel', v)} placeholder="MwSt" />
                            <Input label="Versand" value={invoice.shippingLabel} onChange={(v) => handleChange('invoice', 'shippingLabel', v)} placeholder="Versand:" />
                            <Input label="Rabatt" value={invoice.discountLabel} onChange={(v) => handleChange('invoice', 'discountLabel', v)} placeholder="Rabatt" />
                            <Input label="Gesamtbetrag" value={invoice.totalLabel} onChange={(v) => handleChange('invoice', 'totalLabel', v)} placeholder="Gesamtbetrag:" />
                            <Input label="Drucken Button" value={invoice.printBtnLabel} onChange={(v) => handleChange('invoice', 'printBtnLabel', v)} placeholder="Drucken" />
                            <Input label="Schließen Button" value={invoice.closeBtnLabel} onChange={(v) => handleChange('invoice', 'closeBtnLabel', v)} placeholder="Schließen" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Live Preview */}
            <div className="w-full xl:w-[500px] shrink-0 xl:sticky xl:top-24 self-start">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Eye className="text-blue-400" size={20} />
                        Live Vorschau
                    </h3>
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">Aktualisiert sofort</span>
                </div>
                
                {/* The Invoice Paper A4 Mock */}
                <div className="bg-white rounded-lg shadow-2xl p-6 text-sm overflow-hidden select-none" style={{ color: '#333', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                    {/* Header */}
                    <div className="flex justify-between items-center border-b-2 border-slate-200 pb-5 mb-5">
                        <div className="text-xl font-bold">
                            {renderLogo}
                        </div>
                        <div className="text-right">
                            <h2 className="text-2xl font-bold uppercase m-0" style={{ color: invoice.primaryColor || '#333' }}>
                                {invoice.titleLabel || 'Invoice'}
                            </h2>
                            <div className="text-xs mt-1 text-slate-600">{invoice.dateLabel || 'Date:'} {dummyDate}</div>
                            <div className="text-xs text-slate-600">{invoice.numberLabel || 'Invoice #:'} {invoice.prefix || 'HL-'}{dummyOrderNumber}</div>
                            {invoice.vatNumber && <div className="text-xs text-slate-600">{invoice.vatIdLabel || 'VAT ID:'} {invoice.vatNumber}</div>}
                        </div>
                    </div>

                    {/* Bill To */}
                    <div className="flex justify-between mb-6 text-xs">
                        <div className="w-1/2">
                            <h3 className="text-xs uppercase font-bold text-slate-400 border-b border-slate-200 pb-1 mb-2">Rechnungsadresse:</h3>
                            <div>Jane Doe</div>
                            <div>Main Street 42</div>
                            <div>10115 Berlin</div>
                            <div>Deutschland</div>
                        </div>
                        <div className="w-1/2 ml-4">
                            <h3 className="text-xs uppercase font-bold text-slate-400 border-b border-slate-200 pb-1 mb-2">Lieferadresse:</h3>
                            <div>Jane Doe</div>
                            <div>Main Street 42</div>
                            <div>10115 Berlin</div>
                            <div>Deutschland</div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <table className="w-full text-left border-collapse mb-5 text-xs">
                        <thead>
                            <tr className="bg-slate-50 border-b-2 border-slate-200">
                                <th className="p-2 py-2 text-slate-500 uppercase">{invoice.itemLabel || 'Item'}</th>
                                <th className="p-2 py-2 text-slate-500 uppercase text-right">{invoice.priceLabel || 'Price'}</th>
                                <th className="p-2 py-2 text-slate-500 uppercase text-center">{invoice.quantityLabel || 'Qty'}</th>
                                <th className="p-2 py-2 text-slate-500 uppercase text-right">{invoice.totalLabel || 'Total'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-slate-100">
                                <td className="p-2">
                                    <strong>iPhone 13 Pro (Refurbished)</strong>
                                    <div className="text-[10px] text-slate-400">Product</div>
                                </td>
                                <td className="p-2 text-right">699.00€</td>
                                <td className="p-2 text-center">1</td>
                                <td className="p-2 text-right">699.00€</td>
                            </tr>
                            <tr className="border-b border-slate-100">
                                <td className="p-2">
                                    <strong>Premium Magsafe Case</strong>
                                    <div className="text-[10px] text-slate-400">Accessory</div>
                                </td>
                                <td className="p-2 text-right">29.99€</td>
                                <td className="p-2 text-center">1</td>
                                <td className="p-2 text-right">29.99€</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className="w-[200px] ml-auto text-xs">
                        <div className="flex justify-between py-1">
                            <span>{invoice.subtotalLabel || 'Subtotal:'}</span>
                            <span>728.99€</span>
                        </div>
                        <div className="flex justify-between py-1 text-slate-500">
                            <span>{invoice.taxLabel || 'VAT'} ({taxRate}%):</span>
                            <span>138.50€</span>
                        </div>
                        <div className="flex justify-between py-1">
                            <span>{invoice.shippingLabel || 'Shipping:'}</span>
                            <span>0.00€</span>
                        </div>
                        <div className="flex justify-between py-2 mt-2 border-t-2 border-slate-800 font-bold text-sm">
                            <span>{invoice.totalLabel || 'Total:'}</span>
                            <span style={{ color: invoice.primaryColor || '#000' }}>728.99€</span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-500 space-y-1">
                        <p className="font-bold text-slate-700">{invoice.footerText || 'Thank you for your business!'}</p>
                        <p>{invoice.companyAddress || 'Tech Street 123 - 10115 Berlin - Germany'}</p>
                        
                        {(invoice.bankName || invoice.iban || invoice.bic) && (
                            <div className="mt-2 pt-2 border-t border-slate-100 flex justify-center gap-4 text-slate-400">
                                {invoice.bankName && <span>Bank: {invoice.bankName}</span>}
                                {invoice.iban && <span>IBAN: {invoice.iban}</span>}
                                {invoice.bic && <span>BIC: {invoice.bic}</span>}
                            </div>
                        )}
                        
                        <div className="flex justify-center gap-2 mt-4 pt-2 pointer-events-none opacity-50">
                            <span className="bg-slate-800 text-white px-3 py-1.5 rounded">{invoice.printBtnLabel || 'Print Invoice'}</span>
                            <span className="bg-slate-200 text-slate-800 px-3 py-1.5 rounded">{invoice.closeBtnLabel || 'Close'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
