import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { orderService } from '../services/orderService';
import { productService } from '../services/productService';
import { z } from 'zod';

export const shippingSchema = z.object({
    fullName: z.string().min(2, "Full name is required").max(100, "Name is too long"),
    email: z.string().email("Invalid email address"),
    phone: z.string().regex(/^(\+|00)?[1-9][0-9\s\-().]{6,20}$/, "Invalid phone number format"),
    address: z.string().min(5, "Address is too short").max(200, "Address is too long"),
    city: z.string().min(2, "City is required").max(100, "City name too long"),
    state: z.string().min(2, "State/Region is required"),
    zipCode: z.string().regex(/^[0-9]{4,10}$/, "Invalid Zip/Postal Code (4-10 digits)"),
    country: z.string().min(2, "Country is required"),
});

export type ShippingFormData = z.infer<typeof shippingSchema>;

export interface ShippingMethod {
    _id: string;
    name: string;
    description: string;
    price: number;
    duration: string;
    isExpress: boolean;
}

export const useCheckoutLogic = () => {
    const { cart, cartTotal, coupon, applyCoupon, removeCoupon } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    // State
    const [step, setStep] = useState(1); // 1: Auth Choice, 2: Shipping, 3: Payment
    const [guestMode, setGuestMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [termsAccepted, setTermsAccepted] = useState(false);

    // Form State
    const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
    const [selectedMethodId, setSelectedMethodId] = useState<string>('');
    const [isLoadingMethods, setIsLoadingMethods] = useState(true);
    const [features, setFeatures] = useState<any>(null);

    // Points Redemption State
    const [appliedPoints, setAppliedPoints] = useState(0);

    // Payment Config State
    const [paymentConfig, setPaymentConfig] = useState<any | null>(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>(''); // 'stripe', 'cod', 'paypal'

    const [shippingDetails, setShippingDetails] = useState<ShippingFormData>({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Germany'
    });
    const [formErrors, setFormErrors] = useState<Partial<Record<keyof ShippingFormData, string>>>({});

    // Coupon State
    const [couponCode, setCouponCode] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponError, setCouponError] = useState<string | null>(null);

    // Settings State
    const [freeShippingThreshold, setFreeShippingThreshold] = useState(100);
    const [taxRate, setTaxRate] = useState(19);

    // Initial Check & Load Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoadingMethods(true);
                const [settingsRes, methodsRes] = await Promise.all([
                    api.get('/api/settings'),
                    orderService.fetchShippingMethods()
                ]);

                const settings = (settingsRes as any)?.data || settingsRes;
                if (settings) {
                    if (settings.freeShippingThreshold !== undefined) setFreeShippingThreshold(settings.freeShippingThreshold);
                    if (settings.payment) setPaymentConfig(settings.payment);
                    if (settings.taxRate !== undefined) setTaxRate(settings.taxRate);
                    if (settings.features) setFeatures(settings.features);
                }

                if (Array.isArray(methodsRes)) {
                    setShippingMethods(methodsRes);
                    if (methodsRes.length > 0) {
                        const defaultMethod = methodsRes.sort((a: any, b: any) => a.price - b.price)[0];
                        setSelectedMethodId(defaultMethod._id);
                    }
                }
            } catch (err) {
                console.error("Failed to load checkout settings", err);
            } finally {
                setIsLoadingMethods(false);
            }
        };
        fetchData();

        if (cart.length === 0) {
            navigate('/');
            return;
        }

        if (user) {
            setStep(2);
            const defaultAddr = user.addresses?.find((a: any) => a.isDefault) || user.addresses?.[0];
            
            setShippingDetails(prev => ({
                ...prev,
                fullName: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.name || prev.fullName,
                email: user.email || prev.email,
                phone: user.phone || prev.phone,
                address: defaultAddr?.street || user.address || prev.address,
                city: defaultAddr?.city || prev.city,
                zipCode: defaultAddr?.postalCode || defaultAddr?.zipCode || prev.zipCode,
                country: defaultAddr?.country || prev.country || 'Germany'
            }));
        }

        const saved = sessionStorage.getItem('checkout_shipping');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.address === '[object Object]') parsed.address = '';
                delete parsed.fullName;
                setShippingDetails(prev => ({ ...prev, ...parsed }));
            } catch (e) {
                console.error("Failed to parse saved shipping details");
            }
        }
    }, [cart, user, navigate]);

    useEffect(() => {
        if (step >= 2) {
            sessionStorage.setItem('checkout_shipping', JSON.stringify(shippingDetails));
        }
    }, [shippingDetails, step]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setShippingDetails(prev => ({ ...prev, [name]: value }));
        if (formErrors[name as keyof ShippingFormData]) {
            setFormErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleShippingSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const result = shippingSchema.safeParse(shippingDetails);
        if (!result.success) {
            const formattedErrors: any = {};
            result.error.issues.forEach(issue => {
                if (issue.path[0]) formattedErrors[issue.path[0]] = issue.message;
            });

            setFormErrors(formattedErrors);

            const firstErrorField = result.error.issues[0]?.path[0];
            if (firstErrorField) {
                const element = document.getElementsByName(firstErrorField as string)[0];
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.focus();
                } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }
            return;
        }

        if (!termsAccepted) {
            setError("You must accept the Terms & Conditions to proceed.");
            const termsElement = document.querySelector('input[type="checkbox"]');
            if (termsElement) termsElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        setFormErrors({});
        setError(null);
        setStep(3);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setCouponLoading(true);
        setCouponError(null);
        try {
            const response = await orderService.applyCoupon(couponCode, cartTotal);
            if (response.success) {
                applyCoupon(response.couponCode, response.discount);
                setCouponCode('');
            } else {
                setCouponError(response.message || 'Invalid coupon');
            }
        } catch (err: any) {
            setCouponError(err.response?.data?.message || 'Failed to apply coupon');
        } finally {
            setCouponLoading(false);
        }
    };

    const handleRemoveCoupon = () => {
        removeCoupon();
        setCouponCode('');
    };

    const getFinalTotal = () => {
        const selectedMethod = shippingMethods.find(m => m._id === selectedMethodId);
        let shippingCost = selectedMethod ? selectedMethod.price : 5.99;

        if (cartTotal >= freeShippingThreshold && selectedMethod && !selectedMethod.isExpress) {
            shippingCost = 0;
        }

        const discount = coupon ? coupon.discount : 0;
        const redeemRate = features?.loyalty?.redeemRate || 100;
        const pointsDiscount = appliedPoints / redeemRate;
        const discountedSubtotal = Math.max(0, cartTotal - pointsDiscount - discount);
        
        return Math.max(0, discountedSubtotal + shippingCost);
    };

    const handlePaymentSuccess = async () => {
        if (loading) return;

        if (!selectedPaymentMethod) {
            setError("Please select a payment method.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await productService.validateStock(
                cart.map(item => ({ id: item.id, quantity: item.quantity || 1, name: item.title, category: item.category }))
            );
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Some items are out of stock.");
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setLoading(false);
            return;
        }

        const selectedMethod = shippingMethods.find(m => m._id === selectedMethodId);
        let shippingCost = selectedMethod ? selectedMethod.price : 5.99;
        if (cartTotal >= freeShippingThreshold && selectedMethod && !selectedMethod.isExpress) {
            shippingCost = 0;
        }

        const commonOrderData = {
            items: cart.map(item => ({
                product: item.id,
                productType: (item as any).productType || (item.category?.toLowerCase() === 'accessory' ? 'Accessory' : 'Product'),
                name: item.title,
                price: item.price,
                image: item.image,
                quantity: item.quantity || 1
            })),
            shippingAddress: {
                ...shippingDetails,
                street: shippingDetails.address
            },
            shippingMethod: selectedMethod?.name || 'Standard',
            couponCode: coupon?.code,
            appliedPoints: appliedPoints,
            email: shippingDetails.email
        };

        try {
            if (['cod', 'bank_transfer', 'wallet'].includes(selectedPaymentMethod)) {
                const r = await orderService.createOrder({
                    ...commonOrderData,
                    paymentMethod: selectedPaymentMethod === 'cod' ? 'cash' : selectedPaymentMethod,
                    notes: `Checkout via Web. Method: ${selectedPaymentMethod.toUpperCase()}.`
                });

                if (r.success) {
                    sessionStorage.removeItem('checkout_shipping');
                    navigate(`/payment-success?order_id=${r.order._id}&method=${selectedPaymentMethod}`);
                }

            } else if (['stripe', 'paypal', 'klarna', 'giropay', 'sepa_debit', 'sofort'].includes(selectedPaymentMethod)) {
                const response = await orderService.createCheckoutSession({
                    ...commonOrderData,
                    paymentProvider: selectedPaymentMethod,
                    termsAccepted: true
                });

                if (response.url) {
                    sessionStorage.removeItem('checkout_shipping');
                    window.location.href = response.url;
                } else {
                    throw new Error("Failed to retrieve payment URL");
                }
            } else {
                setError("Selected payment method is not supported yet.");
                setLoading(false);
            }

        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Payment initiation failed. Please try again.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setLoading(false);
        }
    };

    return {
        step, setStep,
        guestMode, setGuestMode,
        loading, setLoading,
        error, setError,
        termsAccepted, setTermsAccepted,
        shippingMethods, setShippingMethods,
        selectedMethodId, setSelectedMethodId,
        isLoadingMethods,
        features,
        appliedPoints, setAppliedPoints,
        paymentConfig,
        selectedPaymentMethod, setSelectedPaymentMethod,
        shippingDetails, setShippingDetails,
        formErrors, setFormErrors,
        couponCode, setCouponCode,
        couponLoading,
        couponError,
        freeShippingThreshold,
        taxRate,
        user, cart, cartTotal, coupon,
        handleInputChange,
        handleShippingSubmit,
        handleApplyCoupon,
        handleRemoveCoupon,
        getFinalTotal,
        handlePaymentSuccess,
        navigate
    };
};
