import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '../context/ToastContext';
import { api } from '../utils/api';

export interface DeviceBlueprint {
    _id: string;
    brand: string;
    modelName: string;
    basePrice: number;
    validStorages: string[];
    imageUrl?: string;
}

export const useValuation = () => {
    const { addToast } = useToast();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [mode, setMode] = useState<'landing' | 'wizard'>('landing');
    const [step, setStep] = useState(1);
    const [apiDevices, setApiDevices] = useState<DeviceBlueprint[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<DeviceBlueprint | null>(null);
    const [loading, setLoading] = useState(false);
    const [brandFilter, setBrandFilter] = useState<string>('all');
    const [previewPrice, setPreviewPrice] = useState<number>(0);
    const [displayPrice, setDisplayPrice] = useState<number>(0);
    const [quoteData, setQuoteData] = useState<any | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [countdown, setCountdown] = useState<string>('');
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [formData, setFormData] = useState({
        model: '',
        storage: '',
        screenCondition: '',
        bodyCondition: '',
        isFunctional: true
    });

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const data: any = await api.get('/api/valuation/devices?limit=1000');
                let devices: DeviceBlueprint[] = [];
                if (Array.isArray(data)) devices = data;
                else if (data.data && Array.isArray(data.data)) devices = data.data;
                else if (data.blueprints && Array.isArray(data.blueprints)) devices = data.blueprints;

                const cleaned = devices.map(d => ({
                    ...d,
                    imageUrl: d.imageUrl && !d.imageUrl.includes('images.samsung.com') ? d.imageUrl : undefined
                }));
                setApiDevices(cleaned);
            } catch (error) {
                console.error("Failed to fetch devices", error);
                addToast("Failed to load devices", "error");
            }
        };
        fetchDevices();
    }, [addToast]);

    useEffect(() => {
        if (!quoteData) {
            setCountdown('');
            if (countdownRef.current) clearInterval(countdownRef.current);
            return;
        }
        const expiresAt = quoteData.expiresAt || (Date.now() + 48 * 60 * 60 * 1000);
        const updateCountdown = () => {
            const remaining = expiresAt - Date.now();
            if (remaining <= 0) {
                setCountdown('Abgelaufen');
                if (countdownRef.current) clearInterval(countdownRef.current);
                return;
            }
            const h = Math.floor(remaining / 3600000);
            const m = Math.floor((remaining % 3600000) / 60000);
            const s = Math.floor((remaining % 60000) / 1000);
            setCountdown(`${h}h ${m}m ${s}s`);
        };
        updateCountdown();
        countdownRef.current = setInterval(updateCountdown, 1000);
        return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
    }, [quoteData]);

    useEffect(() => {
        if (displayPrice === previewPrice) return;
        const valueStep = (previewPrice - displayPrice) * 0.1;
        const diff = Math.abs(previewPrice - displayPrice);
        if (diff < 1) {
            setDisplayPrice(previewPrice);
            return;
        }
        const timer = setTimeout(() => {
            setDisplayPrice(prev => prev + valueStep);
        }, 30);
        return () => clearTimeout(timer);
    }, [previewPrice, displayPrice]);

    useEffect(() => {
        if (selectedDevice && formData.model) {
            const calculate = async () => {
                try {
                    const payload = {
                        model: formData.model,
                        storage: formData.storage || selectedDevice.validStorages[0],
                        screenCondition: formData.screenCondition || 'hervorragend',
                        bodyCondition: formData.bodyCondition || 'hervorragend',
                        isFunctional: formData.isFunctional
                    };
                    const data: any = await api.post('/api/valuation/calculate', payload);
                    if (data.success) {
                        setPreviewPrice(data.estimatedValue);
                    }
                } catch (e) {
                    console.error("Calculation failed", e);
                }
            };
            const timer = setTimeout(calculate, 200);
            return () => clearTimeout(timer);
        }
    }, [formData, selectedDevice]);

    const startWizard = (device: DeviceBlueprint) => {
        setSelectedDevice(device);
        setFormData({ ...formData, model: device.modelName });
        setPreviewPrice(device.basePrice || 200);
        setDisplayPrice(device.basePrice || 200);
        setMode('wizard');
        setStep(1);
    };

    const handleNextStep = () => {
        setStep(step + 1);
    };

    const handlePrevStep = () => {
        if (step === 1) {
            setMode('landing');
            setSelectedDevice(null);
            setFormData({ model: '', storage: '', screenCondition: '', bodyCondition: '', isFunctional: true });
        } else {
            setStep(step - 1);
        }
    };

    const handleCalculateOffer = async (functional: boolean) => {
        setLoading(true);
        try {
            const payload = {
                model: formData.model,
                storage: formData.storage,
                screenCondition: formData.screenCondition,
                bodyCondition: formData.bodyCondition,
                isFunctional: functional
            };
            const data: any = await api.post('/api/valuation/calculate', payload);
            if (data.success || data.estimatedValue !== undefined) {
                setFormData(prev => ({ ...prev, isFunctional: functional }));
                setPreviewPrice(data.estimatedValue);
                setDisplayPrice(data.estimatedValue);
                setQuoteData({
                    estimatedValue: data.estimatedValue,
                    quoteReference: data.quoteReference,
                    expiresAt: Date.now() + 48 * 60 * 60 * 1000,
                    ...payload
                });
                setStep(5);
            } else {
                addToast(data.message || "Fehler bei der Preisberechnung", "error");
            }
        } catch (error) {
            addToast("Netzwerkfehler bei der Berechnung", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitQuote = async () => {
        sessionStorage.setItem('pendingValuationQuote', JSON.stringify({ quoteData, formData }));
        setLoading(true);
        try {
            const payload = {
                model: quoteData?.model || formData.model,
                storage: quoteData?.storage || formData.storage,
                screenCondition: quoteData?.screenCondition || formData.screenCondition,
                bodyCondition: quoteData?.bodyCondition || formData.bodyCondition,
                isFunctional: quoteData?.isFunctional ?? formData.isFunctional
            };
            const data: any = await api.post('/api/valuation/saved', payload);
            if (data.success || data.quoteReference) {
                sessionStorage.removeItem('pendingValuationQuote');
                addToast("Angebot erfolgreich gespeichert!", "success");
                navigate(`/sell/${data.quoteReference}`);
                return;
            }
            addToast(data.message || "Fehler beim Speichern", "error");
        } catch (error: any) {
            const msg = error?.response?.data?.message || error?.message || "Netzwerkfehler";
            addToast(msg, "error");
        } finally {
            setLoading(false);
        }
    };

    return {
        mode, setMode,
        step, setStep,
        apiDevices,
        selectedDevice,
        loading,
        brandFilter, setBrandFilter,
        previewPrice, displayPrice,
        quoteData, setQuoteData,
        searchTerm, setSearchTerm,
        countdown,
        formData, setFormData,
        startWizard,
        handleNextStep,
        handlePrevStep,
        handleCalculateOffer,
        handleSubmitQuote,
        t, navigate
    };
};
