import React from 'react';
import { Clock, Package, Truck, CheckCircle, XCircle } from 'lucide-react';

export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode; description: string }> = {
    pending: { label: 'Pending', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: <Clock className="w-4 h-4" />, description: 'Order received, awaiting processing.' },
    processing: { label: 'Processing', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: <Package className="w-4 h-4" />, description: 'Order is being prepared.' },
    shipped: { label: 'Shipped', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', icon: <Truck className="w-4 h-4" />, description: 'Order has been shipped.' },
    delivered: { label: 'Delivered', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', icon: <CheckCircle className="w-4 h-4" />, description: 'Order delivered successfully.' },
    cancelled: { label: 'Cancelled', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: <XCircle className="w-4 h-4" />, description: 'Order has been cancelled.' },
};

export interface Stats {
    totalOrders: number;
    pendingOrders: number;
    processingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
}

export interface OrderItem {
    product: string;
    productType: string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
}

export interface Order {
    _id: string;
    orderNumber: string;
    user: {
        _id: string;
        name: string;
        email: string;
        phone: string;
    };
    items: OrderItem[];
    totalAmount: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    paymentMethod: string;
    paymentStatus: string;
    paymentReceipt?: string;
    shippingAddress: {
        fullName: string;
        phone: string;
        street: string;
        city: string;
        zipCode: string;
        country: string;
    };
    shippingMethod?: string;
    trackingNumber?: string;
    notes?: string;
    hasInvoice?: boolean;
    createdAt: string;
    updatedAt: string;
}
