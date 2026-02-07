import React, { useEffect, useState } from 'react';
import { Save, ChevronRight, ArrowLeft, Plus, Trash2, Edit2, X } from 'lucide-react';
import ImageUpload from '../components/ImageUpload';

export default function RepairManager() {
    const [devices, setDevices] = useState<any[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [editedServices, setEditedServices] = useState<any[]>([]);

    // Config for adding/editing devices
    const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
    const [deviceForm, setDeviceForm] = useState({
        id: '',
        model: '',
        brand: 'Apple',
        image: '',
        isVisible: true,
        services: [] // Initial services will be empty for new devices
    });

    useEffect(() => {
        fetchDevices();
    }, []);

    const fetchDevices = () => {
        fetch('http://localhost:5000/api/repair-devices')
            .then(res => res.json())
            .then(data => {
                setDevices(data);
                setLoading(false);
            })
            .catch(err => console.error("Failed to load repairs", err));
    };

    const handleSelectDevice = (device: any) => {
        setSelectedDevice(device);
        setEditedServices(JSON.parse(JSON.stringify(device.services))); // Deep copy
    };

    const handleDeleteDevice = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this device and all its services?')) return;
        try {
            await fetch(`http://localhost:5000/api/repair-devices/${id}`, { method: 'DELETE' });
            fetchDevices();
            if (selectedDevice?.id === id) setSelectedDevice(null);
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    const handleEditDevice = (e: React.MouseEvent, device: any) => {
        e.stopPropagation();
        setDeviceForm({
            id: device.id,
            model: device.model,
            brand: device.brand,
            image: device.image,
            isVisible: device.isVisible !== undefined ? device.isVisible : true,
            services: device.services
        });
        setIsDeviceModalOpen(true);
    };

    const handleDeviceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const method = deviceForm.id ? 'PUT' : 'POST';
            // Correct endpoint for creating/updating device
            // Note: The backend route /api/repair-devices post/put handles device data
            // We might need to ensure backend supports simple PUT for device info
            // If backend only has /:id/services, we might need to rely on that or update backend
            // For now assuming standard REST:
            // POST /api/repair-devices (New)
            // PUT /api/repair-devices/:id (Update info)

            const url = deviceForm.id
                ? `http://localhost:5000/api/repair-devices/${deviceForm.id}`
                : 'http://localhost:5000/api/repair-devices';

            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(deviceForm)
            });
            setIsDeviceModalOpen(false);
            setIsDeviceModalOpen(false);
            setDeviceForm({ id: '', model: '', brand: 'Apple', image: '', isVisible: true, services: [] });
            fetchDevices();
        } catch (error) {
            console.error("Failed to save device", error);
        }
    };

    // Service Editing Logic
    const handleServiceChange = (index: number, field: string, value: any) => {
        const updated = [...editedServices];
        updated[index] = { ...updated[index], [field]: value };
        setEditedServices(updated);
    };

    const handleAddService = () => {
        setEditedServices([...editedServices, { type: 'screen', label: 'Screen Repair', price: 99, duration: '1h', warranty: '1 Year' }]);
    };

    const handleDeleteService = (index: number) => {
        const updated = [...editedServices];
        updated.splice(index, 1);
        setEditedServices(updated);
    };

    const handleSaveServices = async () => {
        if (!selectedDevice) return;
        try {
            const res = await fetch(`http://localhost:5000/api/repair-devices/${selectedDevice.id}/services`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ services: editedServices })
            });
            const updatedDevice = await res.json();

            setDevices(devices.map(d => d.id === updatedDevice.id ? updatedDevice : d));
            setSelectedDevice(updatedDevice);
            alert('Services updated successfully!');
        } catch (error) {
            console.error("Failed to save services", error);
        }
    };

    if (loading) return <div className="text-white p-8">Loading catalog...</div>;

    return (
        <div>
            {/* Header */}
            {!selectedDevice ? (
                <div>
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-3xl font-black text-white">Repair Catalog</h2>
                            <p className="text-slate-400 mt-1">Manage devices and their repair pricing</p>
                        </div>
                        <button
                            onClick={() => { setDeviceForm({ id: '', model: '', brand: 'Apple', image: '', isVisible: true, services: [] }); setIsDeviceModalOpen(true); }}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20"
                        >
                            <Plus size={20} /> Add Device
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {devices.map((device: any) => (
                            <div
                                key={device.id}
                                onClick={() => handleSelectDevice(device)}
                                className="bg-slate-900 border border-slate-800 p-4 rounded-xl cursor-pointer hover:border-blue-500 hover:shadow-lg hover:shadow-blue-900/20 transition-all flex items-center gap-4 group relative"
                            >
                                <img src={device.image} alt={device.model} className="w-16 h-16 rounded-lg object-cover bg-black" />
                                <div className="flex-1">
                                    <h3 className="text-white font-bold group-hover:text-blue-400 transition-colors">{device.model}</h3>
                                    <p className="text-xs text-slate-500">{device.brand} • {device.services.length} Services</p>
                                    {!device.isVisible && (
                                        <span className="inline-block mt-1 bg-red-500/10 text-red-500 text-[10px] px-2 py-0.5 rounded border border-red-500/20">Hidden</span>
                                    )}
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => handleEditDevice(e, device)}
                                        className="p-1 text-slate-400 hover:text-white"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => handleDeleteDevice(e, device.id)}
                                        className="p-1 text-slate-400 hover:text-red-500"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <ChevronRight className="text-slate-600 group-hover:text-blue-400" />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="animate-in slide-in-from-right duration-300">
                    <button
                        onClick={() => setSelectedDevice(null)}
                        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft size={20} /> Back to Catalog
                    </button>

                    <div className="flex justify-between items-end mb-6">
                        <div className="flex items-center gap-4">
                            <img src={selectedDevice.image} className="w-20 h-20 rounded-xl object-cover border border-slate-700" />
                            <div>
                                <h2 className="text-3xl font-black text-white">{selectedDevice.model}</h2>
                                <p className="text-slate-400">Manage Services</p>
                            </div>
                        </div>
                        <button
                            onClick={handleSaveServices}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20"
                        >
                            <Save size={20} /> Save Changes
                        </button>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                        <table className="w-full text-left text-slate-400">
                            <thead className="bg-slate-950 text-slate-500 uppercase text-xs font-bold">
                                <tr>
                                    <th className="p-4">Service Type</th>
                                    <th className="p-4">Label (Public)</th>
                                    <th className="p-4">Price (€)</th>
                                    <th className="p-4">Duration</th>
                                    <th className="p-4">Warranty</th>
                                    <th className="p-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {editedServices.map((service, index) => (
                                    <tr key={index} className="hover:bg-slate-800/30">
                                        <td className="p-4">
                                            <select
                                                className="bg-slate-950 text-white w-full outline-none border-b border-transparent focus:border-blue-500 text-xs font-mono uppercase p-1"
                                                value={service.type}
                                                onChange={(e) => handleServiceChange(index, 'type', e.target.value)}
                                            >
                                                <option value="screen">Screen Repair</option>
                                                <option value="battery">Battery</option>
                                                <option value="charging">Charging Port</option>
                                                <option value="camera">Camera</option>
                                                <option value="backglass">Back Glass</option>
                                                <option value="faceid">Face ID</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </td>
                                        <td className="p-4">
                                            <input
                                                className="bg-transparent text-white w-full outline-none border-b border-transparent focus:border-blue-500 transition-colors"
                                                value={service.label}
                                                onChange={(e) => handleServiceChange(index, 'label', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-4">
                                            <input
                                                type="number"
                                                className="bg-slate-950 text-emerald-400 font-bold w-24 p-2 rounded border border-slate-800 focus:border-emerald-500 outline-none"
                                                value={service.price}
                                                onChange={(e) => handleServiceChange(index, 'price', Number(e.target.value))}
                                            />
                                        </td>
                                        <td className="p-4">
                                            <input
                                                className="bg-transparent text-white w-full outline-none border-b border-transparent focus:border-blue-500 transition-colors"
                                                value={service.duration}
                                                onChange={(e) => handleServiceChange(index, 'duration', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-4">
                                            <input
                                                className="bg-transparent text-white w-full outline-none border-b border-transparent focus:border-blue-500 transition-colors"
                                                value={service.warranty}
                                                onChange={(e) => handleServiceChange(index, 'warranty', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => handleDeleteService(index)} className="text-red-500 hover:text-red-400 p-2">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                <tr>
                                    <td colSpan={6} className="p-4">
                                        <button onClick={handleAddService} className="w-full py-2 border-2 border-dashed border-slate-800 text-slate-500 rounded-lg hover:border-blue-500 hover:text-blue-500 transition-all font-bold flex items-center justify-center gap-2">
                                            <Plus size={16} /> Add New Service Row
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Device Add/Edit Modal */}
            {isDeviceModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl w-full max-w-md shadow-2xl relative">
                        <button onClick={() => setIsDeviceModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={24} /></button>
                        <h3 className="text-2xl font-bold text-white mb-6">{deviceForm.id ? 'Edit Device' : 'Add New Device'}</h3>

                        <form onSubmit={handleDeviceSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-1">Model Name</label>
                                <input
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                    value={deviceForm.model}
                                    onChange={e => setDeviceForm({ ...deviceForm, model: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-1">Brand</label>
                                <select
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                    value={deviceForm.brand}
                                    onChange={e => setDeviceForm({ ...deviceForm, brand: e.target.value })}
                                >
                                    <option value="Apple">Apple</option>
                                    <option value="Samsung">Samsung</option>
                                    <option value="Google">Google</option>
                                    <option value="Xiaomi">Xiaomi</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <ImageUpload
                                value={deviceForm.image}
                                onChange={(url) => setDeviceForm({ ...deviceForm, image: url })}
                                label="Device Image"
                            />

                            <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                                <input
                                    type="checkbox"
                                    id="isVisible"
                                    className="w-5 h-5 accent-blue-600 cursor-pointer"
                                    checked={deviceForm.isVisible}
                                    onChange={e => setDeviceForm({ ...deviceForm, isVisible: e.target.checked })}
                                />
                                <label htmlFor="isVisible" className="text-slate-300 font-bold cursor-pointer select-none">
                                    Visible on Website
                                </label>
                            </div>

                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                                <Save size={18} /> {deviceForm.id ? 'Save Changes' : 'Create Device'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
