import React from 'react';
import { Monitor, Battery, Cable, Camera, ScanLine, ShieldCheck, Wrench } from 'lucide-react';
import { ServiceType } from './types';

export const getServiceIcon = (type: ServiceType) => {
    switch (type) {
        case 'screen': return <Monitor className="w-5 h-5" />;
        case 'battery': return <Battery className="w-5 h-5" />;
        case 'charging': return <Cable className="w-5 h-5" />;
        case 'camera': return <Camera className="w-5 h-5" />;
        case 'backglass': return <ScanLine className="w-5 h-5" />;
        case 'faceid': return <ShieldCheck className="w-5 h-5" />;
        default: return <Wrench className="w-5 h-5" />;
    }
};
