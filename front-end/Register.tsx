import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Phone, MapPin, AlertCircle, Loader, Shield, CheckCircle, XCircle } from 'lucide-react';
import { validateEmail, validatePassword, validatePhone, validateRequired } from './validation';

import { authService } from './services/authService';

const Register: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        location: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        // Validation
        if (!validateRequired(formData.name)) {
            setError('Name is required');
            return;
        }
        if (!validateEmail(formData.email)) {
            setError('Please enter a valid email address');
            return;
        }
        if (!validatePhone(formData.phone)) {
            setError('Please enter a valid phone number');
            return;
        }

        const passwordValidation = validatePassword(formData.password);
        if (!passwordValidation.isValid) {
            setError(passwordValidation.message || 'Invalid password');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const data = await authService.register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
                // Location is not in the original body but was in form state. If backend needs it:
                // location: formData.location 
                // Using original body structure:
            });

            if (data.success) {
                // Redirect to verification notice
                navigate('/verify-email-notice', { state: { email: formData.email } });
            } else {
                // Again, service throws on error usually.
            }
        } catch (err: any) {
            const errorMessage = err.message || 'Registration failed';
            setError(errorMessage);
            console.error('Register error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <div className="inline-block p-4 bg-gradient-to-br from-green-600 to-cyan-500 rounded-2xl shadow-2xl shadow-green-900/50 mb-4">
                        <Shield className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-4xl font-black text-white mb-2">Create Account</h1>
                    <p className="text-slate-400 uppercase tracking-wider text-sm">Join HandyLand Today</p>
                </div>

                {/* Register Card */}
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-2xl font-bold text-white mb-6">Register Your Account</h2>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-5">
                        {/* Grid for 2 columns */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="e.g. Mark Tech"
                                        required
                                        className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>

                            {/* Phone Number */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+49..."
                                        className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Location
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="Berlin, Germany"
                                    className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="secure@handyland.com"
                                    required
                                    className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* Password Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        required
                                        minLength={12}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                {/* Password Strength Indicator */}
                                {formData.password.length > 0 && (() => {
                                    const checks = {
                                        length: formData.password.length >= 12,
                                        upper: /[A-Z]/.test(formData.password),
                                        number: /[0-9]/.test(formData.password),
                                        special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
                                    };
                                    const passed = Object.values(checks).filter(Boolean).length;
                                    const strengthLabel = passed <= 1 ? 'Weak' : passed === 2 ? 'Fair' : passed === 3 ? 'Good' : 'Strong';
                                    const strengthColor = passed <= 1 ? 'bg-red-500' : passed === 2 ? 'bg-yellow-500' : passed === 3 ? 'bg-blue-500' : 'bg-emerald-500';
                                    const textColor = passed <= 1 ? 'text-red-400' : passed === 2 ? 'text-yellow-400' : passed === 3 ? 'text-blue-400' : 'text-emerald-400';

                                    return (
                                        <div className="mt-3 space-y-2">
                                            {/* Strength Bar */}
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden flex gap-1">
                                                    {[1, 2, 3, 4].map(i => (
                                                        <div
                                                            key={i}
                                                            className={`h-full flex-1 rounded-full transition-all duration-300 ${i <= passed ? strengthColor : 'bg-slate-700'}`}
                                                        />
                                                    ))}
                                                </div>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${textColor}`}>{strengthLabel}</span>
                                            </div>
                                            {/* Requirements Checklist */}
                                            <div className="grid grid-cols-2 gap-1">
                                                {[
                                                    { ok: checks.length, label: '8+ characters' },
                                                    { ok: checks.upper, label: 'Uppercase' },
                                                    { ok: checks.number, label: 'Number' },
                                                    { ok: checks.special, label: 'Special char' },
                                                ].map(req => (
                                                    <div key={req.label} className={`flex items-center gap-1.5 text-[10px] transition-colors ${req.ok ? 'text-emerald-400' : 'text-slate-500'}`}>
                                                        {req.ok ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                        {req.label}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        required
                                        className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                    />
                                </div>
                                {/* Password Match Indicator */}
                                {formData.confirmPassword.length > 0 && (
                                    <div className={`flex items-center gap-1.5 mt-2 text-[10px] transition-colors ${formData.password === formData.confirmPassword ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {formData.password === formData.confirmPassword ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                        {formData.password === formData.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Register Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-green-600 to-cyan-500 text-white font-bold rounded-lg shadow-lg shadow-green-900/30 hover:shadow-green-900/50 hover:from-green-500 hover:to-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader className="w-5 h-5 animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                'Create Account →'
                            )}
                        </button>
                    </form>

                    {/* Login Link */}
                    <div className="mt-6 pt-6 border-t border-slate-800">
                        <p className="text-center text-slate-400 text-sm">
                            Already have an account?{' '}
                            <Link to="/login" className="text-green-400 font-semibold hover:text-green-300 transition-colors">
                                Login Here
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-slate-500 text-sm mt-6">
                    Protected User Area • HandyLand © 2024
                </p>
            </div>
        </div>
    );
};

export default Register;
