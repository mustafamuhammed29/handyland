import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardValuations } from '../components/dashboard/DashboardValuations';
import { api } from '../utils/api';
import { SavedValuation } from '../types';

export const MyValuations = () => {
    const [valuations, setValuations] = useState<SavedValuation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const fetchValuations = async () => {
        setIsLoading(true);
        try {
            const res: any = await api.get('/api/valuation/my-valuations');
            const list: any[] = Array.isArray(res) ? res : (res.data || []);
            const mapped = list.map((v: any) => ({
                id: v._id,
                device: v.device || v.deviceName || 'Unknown Device',
                specs: v.specs || v.storage || '-',
                condition: v.condition || '-',
                date: v.createdAt ? new Date(v.createdAt).toLocaleDateString('de-DE') : '-',
                estimatedValue: v.estimatedValue ?? 0,
                quoteReference: v.quoteReference
            }));
            setValuations(mapped);
        } catch (error) {
            console.error('Error fetching valuations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchValuations();
    }, []);

    // Navigate to the quote confirmation page
    const handleSell = (valId: string) => {
        const val = valuations.find(v => v.id === valId);
        if (val?.quoteReference) {
            navigate(`/valuation/confirm/${val.quoteReference}`);
        } else {
            navigate('/valuation');
        }
    };

    return (
        <div className="p-4 md:p-8">
            <DashboardValuations valuations={valuations} isLoading={isLoading} onSell={handleSell} />
        </div>
    );
};
