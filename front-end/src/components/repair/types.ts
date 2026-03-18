export type ServiceType = 'screen' | 'battery' | 'charging' | 'camera' | 'backglass' | 'faceid';

export interface RepairServiceItem {
    type: ServiceType;
    label: string;
    price: number;
    duration: string;
    warranty: string;
}

export interface RepairDevice {
    id: string;
    model: string;
    brand: string;
    image: string;
    services: RepairServiceItem[];
}
