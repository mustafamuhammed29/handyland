import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Truck, CheckCircle, Clock, MapPin, CreditCard, Repeat, AlertTriangle } from 'lucide-react';
import { api } from '../utils/api';
import { orderService } from '../services/orderService';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { Order } from '../types';
import { ENV } from '../src/config/env';

export const OrderDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { addToCart } = useCart();

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await orderService.getOrder(id || '');
                if (res.success) {
                    setOrder(res.order);
                } else {
                    setError('Order not found');
                }
            } catch (err: any) {
                console.error(err);
                setError(err.message || 'Failed to load order');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchOrder();
    }, [id]);

    const handleBuyAgain = () => {
        if (!order) return;
        order.items.forEach((item: any) => {
            // Map order item to cart item structure
            // Assuming item has product details mapped or populated
            const cartItem = {
                id: item.product._id || item.product, // specific to how backend returns it
                title: item.name,
                subtitle: item.productType,
                price: item.price,
                image: item.image || item.product.image || '',
                category: item.productType === 'Accessory' ? 'accessory' : 'device' as any,
                quantity: 1
            };
            addToCart(cartItem);
        });
        addToast("All items added to cart", "success");
        // Open cart drawer? (optional, requires context update or ref)
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-32 pb-12 flex justify-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen pt-32 pb-12 px-4 max-w-3xl mx-auto text-center">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Order Not Found</h2>
                <p className="text-slate-400 mb-8">{error || "We couldn't find the order you're looking for."}</p>
                <button onClick={() => navigate('/dashboard')} className="bg-slate-800 text-white px-6 py-2 rounded-xl hover:bg-slate-700">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const steps = ['pending', 'processing', 'shipped', 'delivered'];
    const currentStep = steps.indexOf(order.status) === -1 ? (order.status === 'cancelled' ? -1 : 0) : steps.indexOf(order.status);
    const isCancelled = order.status === 'cancelled';

    return (
        <div className="min-h-screen pt-28 pb-12 px-4 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate('/dashboard')} aria-label="Back to dashboard" className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        Order #{order.orderNumber || (order._id ? order._id.slice(-6).toUpperCase() : '')}
                        <span className={`text-xs px-3 py-1 rounded-full uppercase tracking-wider font-bold border ${isCancelled ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                            order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                                'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            }`}>
                            {order.status}
                        </span>
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}</p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">

                    {/* Items */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 overflow-hidden">
                        <h2 className="font-bold text-white mb-4 flex items-center gap-2">
                            <Package className="w-5 h-5 text-blue-400" /> Items
                        </h2>
                        <div className="space-y-4">
                            {order.items.map((item: any, idx: number) => (
                                <div key={idx} className="flex gap-4 p-3 bg-black/30 rounded-xl border border-slate-800/50">
                                    <div className="w-16 h-16 bg-slate-800 rounded-lg shrink-0 overflow-hidden">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                                                <Package className="w-6 h-6" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-white font-medium line-clamp-1">{item.name}</div>
                                        <div className="text-xs text-slate-500 mt-1">Qty: {item.quantity} × €{item.price.toFixed(2)}</div>
                                    </div>
                                    <div className="text-white font-bold">
                                        €{(item.quantity * item.price).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="pt-4 mt-4 border-t border-slate-800 flex justify-end">
                            <button onClick={handleBuyAgain} className="text-sm font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-2 transition-colors">
                                <Repeat className="w-4 h-4" /> Buy Again
                            </button>
                        </div>
                    </div>

                    {/* Timeline */}
                    {!isCancelled && (
                        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
                            <h2 className="font-bold text-white mb-6 flex items-center gap-2">
                                <Truck className="w-5 h-5 text-purple-400" /> Tracking
                            </h2>
                            <div className="relative px-2">
                                {/* Connector Line */}
                                <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-800 -z-10"></div>
                                <div
                                    className="absolute top-4 left-4 h-0.5 bg-green-500 transition-all duration-1000 -z-10"
                                    style={{
                                        width: `${(currentStep / (steps.length - 1)) * 100}%`,
                                        right: `${100 - ((currentStep / (steps.length - 1)) * 100)}%`
                                    }}
                                ></div>
                                {/* Better Connector implementation */}
                                <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-800 -z-10"></div>
                                <div
                                    className="absolute top-4 left-6 h-0.5 bg-blue-500 -z-10 transition-all duration-500"
                                    style={{ width: `${(currentStep / (steps.length - 1)) * 95}%` }}
                                ></div>


                                <div className="flex justify-between">
                                    {steps.map((step, idx) => {
                                        const isCompleted = idx <= currentStep;
                                        const isCurrent = idx === currentStep;

                                        return (
                                            <div key={step} className="flex flex-col items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${isCompleted ? 'bg-blue-500 border-blue-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-600'
                                                    } ${isCurrent ? 'ring-4 ring-blue-500/20' : ''}`}>
                                                    {isCompleted ? <CheckCircle className="w-4 h-4" /> : <div className="w-2 h-2 bg-current rounded-full" />}
                                                </div>
                                                <div className="text-center">
                                                    <div className={`text-xs font-bold uppercase tracking-wider ${isCompleted ? 'text-blue-400' : 'text-slate-600'}`}>{step}</div>
                                                    {isCurrent && <div className="text-[10px] text-slate-400 mt-1 animate-pulse">In Progress</div>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Summary */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
                        <h2 className="font-bold text-white mb-4">Order Summary</h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between text-slate-400">
                                <span>Subtotal</span>
                                <span>€{(order.totalAmount - (order.tax || 0) - (order.shippingFee || 0)).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                                <span>Shipping</span>
                                <span>€{(order.shippingFee || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                                <span>Tax</span>
                                <span>€{(order.tax || 0).toFixed(2)}</span>
                            </div>
                            <div className="h-px bg-slate-800 my-2"></div>
                            <div className="flex justify-between text-white font-bold text-lg">
                                <span>Total</span>
                                <span>€{order.totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
                        <h2 className="font-bold text-white mb-4 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-emerald-400" /> Delivery Details
                        </h2>
                        {order.shippingAddress ? (
                            <div className="text-sm text-slate-400 space-y-1">
                                <div className="text-white font-medium">{order.shippingAddress.fullName}</div>
                                <div>{order.shippingAddress.street}</div>
                                <div>{order.shippingAddress.zipCode} {order.shippingAddress.city}</div>
                                <div>{order.shippingAddress.country}</div>
                                <div className="pt-2 text-xs">{order.shippingAddress.phone}</div>
                            </div>
                        ) : (
                            <div className="text-slate-500 italic">No address details</div>
                        )}
                    </div>

                    {/* Payment Info */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
                        <h2 className="font-bold text-white mb-4 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-yellow-400" /> Payment
                        </h2>
                        <div className="text-sm text-slate-400">
                            <div className="flex justify-between mb-1">
                                <span>Method</span>
                                <span className="text-white font-medium">
                                    {(() => {
                                        switch (order.paymentMethod) {
                                            case 'stripe': return 'Credit Card (Stripe)';
                                            case 'paypal': return 'PayPal';
                                            case 'klarna': return 'Klarna';
                                            case 'giropay': return 'Giropay';
                                            case 'sepa_debit': return 'SEPA Direct Debit';
                                            case 'sofort': return 'Sofort';
                                            case 'cod': return 'Cash on Delivery';
                                            default: return order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1);
                                        }
                                    })()}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Status</span>
                                <span className={`capitalize font-bold ${order.paymentStatus === 'paid' ? 'text-emerald-400' : 'text-yellow-400'}`}>
                                    {order.paymentStatus}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors font-bold text-sm">
                        Download Invoice
                    </button>
                    <button className="w-full py-3 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/30 rounded-xl transition-colors font-bold text-sm">
                        Request Return / Refund
                    </button>
                </div>
            </div>
        </div>
    );
};
