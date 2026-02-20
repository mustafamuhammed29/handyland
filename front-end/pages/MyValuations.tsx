import React, { useEffect, useState } from 'react';
import { DashboardValuations } from '../components/dashboard/DashboardValuations';
import { api } from '../utils/api';
import { SavedValuation } from '../types';

export const MyValuations = () => {
    const [valuations, setValuations] = useState<SavedValuation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchValuations = async () => {
            try {
                const res = await api.get('/api/valuations');
                if (res.success && res.data) {
                    const mapped = res.data.map((v: any) => ({
                        id: v._id,
                        device: v.deviceName,
                        specs: v.storage,
                        condition: v.condition,
                        date: new Date(v.createdAt).toLocaleDateString(),
                        estimatedValue: v.estimatedValue
                    }));
                    setValuations(mapped);
                }
            } catch (error) {
                console.error('Error fetching valuations:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchValuations();
    }, []);

    const handleSell = (valId: string) => {
        console.log('sell', valId);
    };

    return (
        <div className="p-4 md:p-8">
            <DashboardValuations valuations={valuations} isLoading={isLoading} onSell={handleSell} />
        </div>
    );
};
