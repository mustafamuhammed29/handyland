import React, { useState } from 'react';
import {
    User, Mail, Phone, MapPin, Bell, Shield,
    CreditCard, Globe, Save, Eye, EyeOff
} from 'lucide-react';
import { User as UserType, Address } from '../../types';

interface DashboardSettingsProps {
    user: UserType;
    addresses: Address[];
    onUpdateProfile: (data: Partial<UserType>) => void;
    onUpdatePassword: (oldPass: string, newPass: string) => void;
    onAddAddress: (address: Omit<Address, '_id'>) => void;
    onUpdateAddress: (id: string, address: Partial<Address>) => void;
    onDeleteAddress: (id: string) => void;
}

export const DashboardSettings: React.FC<DashboardSettingsProps> = ({
    user,
    addresses,
    onUpdateProfile,
    onUpdatePassword,
    onAddAddress,
    onUpdateAddress,
    onDeleteAddress
}) => {
    const [activeSection, setActiveSection] = useState('profile');
    const [showPassword, setShowPassword] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [newAddress, setNewAddress] = useState({
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        isDefault: false
    });

    const [profileData, setProfileData] = useState({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
    });

    const handleSaveProfile = () => {
        onUpdateProfile(profileData);
        setIsEditing(false);
    };

    const handleSaveAddress = () => {
        onAddAddress(newAddress);
        setShowAddressModal(false);
        setNewAddress({
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: '',
            isDefault: false
        });
    };

    const handleEditAddress = (address: Address) => {
        setEditingAddress(address);
        setNewAddress({
            street: address.street || '',
            city: address.city || '',
            state: address.state || '',
            zipCode: address.zipCode || '',
            country: address.country || '',
            isDefault: address.isDefault || false
        });
        setShowAddressModal(true);
    };

    const handleUpdateAddress = () => {
        if (editingAddress && editingAddress._id) {
            onUpdateAddress(editingAddress._id, newAddress);
            setShowAddressModal(false);
            setEditingAddress(null);
            setNewAddress({
                street: '',
                city: '',
                state: '',
                zipCode: '',
                country: '',
                isDefault: false
            });
        }
    };

    const handleDeleteAddress = (id: string) => {
        if (confirm('Are you sure you want to delete this address?')) {
            onDeleteAddress(id);
        }
    };

    const handleCloseModal = () => {
        setShowAddressModal(false);
        setEditingAddress(null);
        setNewAddress({
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: '',
            isDefault: false
        });
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Settings</h2>

            {/* Settings Navigation */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
                    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
                    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
                    { id: 'addresses', label: 'Addresses', icon: <MapPin className="w-4 h-4" /> },
                ].map(section => (
                    <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${activeSection === section.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                    >
                        {section.icon}
                        {section.label}
                    </button>
                ))}
            </div>

            {/* Profile Section */}
            {activeSection === 'profile' && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white">Profile Information</h3>
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                            >
                                Edit
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveProfile}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    Save
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                <User className="w-4 h-4 inline mr-2" />
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={profileData.name}
                                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                disabled={!isEditing}
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white disabled:opacity-50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                <Mail className="w-4 h-4 inline mr-2" />
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={profileData.email}
                                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                disabled={!isEditing}
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white disabled:opacity-50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                <Phone className="w-4 h-4 inline mr-2" />
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                value={profileData.phone}
                                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                disabled={!isEditing}
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white disabled:opacity-50"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Security Section */}
            {activeSection === 'security' && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Security Settings</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Current Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white pr-12"
                                />
                                <button
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                New Password
                            </label>
                            <input
                                type="password"
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white"
                            />
                        </div>

                        <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold transition-colors mt-6">
                            Update Password
                        </button>
                    </div>
                </div>
            )}

            {/* Notifications Section */}
            {activeSection === 'notifications' && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Notification Preferences</h3>

                    <div className="space-y-4">
                        {[
                            { label: 'Order Updates', description: 'Get notified about your order status' },
                            { label: 'Repair Status', description: 'Updates on your repair tickets' },
                            { label: 'Promotions', description: 'Receive special offers and deals' },
                            { label: 'Newsletter', description: 'Weekly newsletter and product updates' },
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl">
                                <div>
                                    <p className="text-white font-medium">{item.label}</p>
                                    <p className="text-sm text-slate-400">{item.description}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" defaultChecked={idx < 2} />
                                    <div className="w-11 h-6 bg-slate-700 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Addresses Section */}
            {activeSection === 'addresses' && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white">Saved Addresses</h3>
                        <button
                            onClick={() => setShowAddressModal(true)}
                            className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                        >
                            + Add New
                        </button>
                    </div>

                    <div className="space-y-3">
                        {addresses.map((address, idx) => (
                            <div key={idx} className="p-4 bg-slate-800/30 rounded-xl">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <p className="text-white font-medium">{address.name}</p>
                                        <p className="text-sm text-slate-400 mt-1">
                                            {address.street}, {address.city}, {address.postalCode}
                                        </p>
                                        <p className="text-sm text-slate-400">{address.phone}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {address.isDefault && (
                                            <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded">
                                                Default
                                            </span>
                                        )}
                                        <button
                                            onClick={() => handleEditAddress(address)}
                                            className="px-3 py-1.5 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => address._id && handleDeleteAddress(address._id)}
                                            className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {addresses.length === 0 && (
                            <div className="text-center py-8 text-slate-500">
                                <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No saved addresses</p>
                            </div>
                        )}
                    </div>

                    {/* Address Modal */}
                    {showAddressModal && (
                        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full">
                                <h4 className="text-xl font-bold text-white mb-4">
                                    {editingAddress ? 'Edit Address' : 'Add New Address'}
                                </h4>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Street Address</label>
                                        <input
                                            type="text"
                                            value={newAddress.street}
                                            onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white"
                                            placeholder="123 Main St"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-2">City</label>
                                            <input
                                                type="text"
                                                value={newAddress.city}
                                                onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white"
                                                placeholder="Berlin"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-2">State</label>
                                            <input
                                                type="text"
                                                value={newAddress.state}
                                                onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white"
                                                placeholder="BE"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-2">Zip Code</label>
                                            <input
                                                type="text"
                                                value={newAddress.zipCode}
                                                onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white"
                                                placeholder="10115"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-2">Country</label>
                                            <input
                                                type="text"
                                                value={newAddress.country}
                                                onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white"
                                                placeholder="Germany"
                                            />
                                        </div>
                                    </div>

                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={newAddress.isDefault}
                                            onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                                            className="w-4 h-4 text-blue-600 rounded"
                                        />
                                        <span className="text-sm text-slate-300">Set as default address</span>
                                    </label>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={handleCloseModal}
                                        className="flex-1 px-4 py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={editingAddress ? handleUpdateAddress : handleSaveAddress}
                                        className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors"
                                    >
                                        {editingAddress ? 'Update Address' : 'Save Address'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
