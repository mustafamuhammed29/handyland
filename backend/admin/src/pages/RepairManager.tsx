import React, { useEffect, useState, useCallback } from 'react';
import { Save, ChevronRight, ArrowLeft, Plus, Trash2, Edit2, X, Search, FileSpreadsheet, Smartphone, Wrench, CircleDollarSign, EyeOff, CheckCircle } from 'lucide-react';
import ImageUpload from '../components/ImageUpload';
import { api } from '../utils/api';
import toast from 'react-hot-toast';
import useDebounce from '../hooks/useDebounce';

interface RepairStats {
    totalDevices: number;
    totalServices: number;
    averageRepairPrice: number;
    hiddenDevices: number;
}

export default function RepairManager() {
    const [devices, setDevices] = useState<any[]>([]);
    const [stats, setStats] = useState<RepairStats | null>(null);
    const [selectedDevice, setSelectedDevice] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [editedServices, setEditedServices] = useState<any[]>([]);

    // Pagination & Search
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 500);

    // Config for adding/editing devices
    const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
    const [deviceForm, setDeviceForm] = useState({
        id: '',
        model: '',
        brand: 'Apple',
        image: '',
        isVisible: true,
        services: [] as any[]
    });

    const fetchDevices = useCallback(async () => {
        try {
            setLoading(true);
            let url = `/api/repairs?page=${page}&limit=${limit}`;
            if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;
            
            const response = await api.get(url);
            if (response.data && Array.isArray(response.data.devices)) {
                setDevices(response.data.devices);
                setTotalPages(response.data.totalPages || 1);
            } else if (Array.isArray(response.data)) {
                setDevices(response.data);
                setTotalPages(1);
            }
        } catch (error) {
            console.error("Failed to load repairs", error);
            toast.error('Failed to load repair catalog');
        } finally {
            setLoading(false);
        }
    }, [page, limit, debouncedSearch]);

    const fetchStats = async () => {
        try {
            const res = await api.get('/api/repairs/admin/stats');
            if (res.data.success) {
                setStats(res.data.stats);
            }
        } catch (error) {
            console.error('Error fetching stats', error);
        }
    };

    useEffect(() => {
        fetchDevices();
        if (!selectedDevice) fetchStats();
    }, [fetchDevices, selectedDevice]);

    const handleSelectDevice = (device: any) => {
        setSelectedDevice(device);
        setEditedServices(JSON.parse(JSON.stringify(device.services))); // Deep copy
    };

    const handleDeleteDevice = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this device and all its services?')) return;
        try {
            await api.delete(`/api/repairs/devices/${id}`);
            toast.success('Device deleted successfully');
            fetchDevices();
            fetchStats();
            if (selectedDevice?.id === id) setSelectedDevice(null);
        } catch (error) {
            console.error("Failed to delete", error);
            toast.error('Failed to delete device');
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
            const url = deviceForm.id
                ? `/api/repairs/devices/${deviceForm.id}`
                : '/api/repairs/devices';

            if (deviceForm.id) {
                await api.put(url, deviceForm);
                toast.success('Device updated successfully');
            } else {
                await api.post(url, deviceForm);
                toast.success('Device created successfully');
            }

            setIsDeviceModalOpen(false);
            setDeviceForm({ id: '', model: '', brand: 'Apple', image: '', isVisible: true, services: [] });
            fetchDevices();
            fetchStats();
        } catch (error) {
            console.error("Failed to save device", error);
            toast.error('Failed to save device');
        }
    };

    const handleExportCSV = () => {
        toast.success('Preparing CSV export...');
        const headers = "ID,Brand,Model,Visible,TotalServices,ImageLink\n";
        const rows = devices.map(d => `"${d.id}","${d.brand}","${d.model}",${d.isVisible},${d.services?.length || 0},"${d.image || ''}"`).join('\n');
        const csv = headers + rows;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Repair_Catalog_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
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
            const response = await api.put(`/api/repairs/devices/${selectedDevice.id}/services`, { services: editedServices });
            const updatedDevice = response.data;

            setDevices(devices.map(d => d.id === updatedDevice.id ? updatedDevice : d));
            setSelectedDevice(updatedDevice);
            toast.success('Services updated successfully!');
            fetchStats();
        } catch (error) {
            console.error("Failed to save services", error);
            toast.error('Failed to save services');
        }
    };

    if (loading && devices.length === 0) return (
        <div className="flex flex-col items-center justify-center py-32 text-slate-500">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            Loading repair catalog...
        </div>
    );

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            {/* Header */}
            {!selectedDevice ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-3 text-white">
                                <div className="p-2 bg-blue-500/20 rounded-xl">
                                    <Wrench className="w-7 h-7 text-blue-400" />
                                </div>
                                Repair Catalog
                            </h1>
                            <p className="text-slate-400 mt-2">Manage supported devices and repair pricing</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleExportCSV}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl transition-all shadow-sm font-medium text-sm"
                            >
                                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                                Export Catalog
                            </button>
                            <button
                                onClick={() => { setDeviceForm({ id: '', model: '', brand: 'Apple', image: '', isVisible: true, services: [] }); setIsDeviceModalOpen(true); }}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 text-sm"
                            >
                                <Plus size={18} /> Add Device
                            </button>
                        </div>
                    </div>

                    {/* Stats */}
                    {stats && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-sm">
                                <div className="text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
                                    <Smartphone className="w-4 h-4" /> Supported Devices
                                </div>
                                <div className="text-3xl font-bold text-white">{stats.totalDevices}</div>
                            </div>
                            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-sm">
                                <div className="text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
                                    <Wrench className="w-4 h-4" /> Total Services
                                </div>
                                <div className="text-3xl font-bold text-blue-400">{stats.totalServices}</div>
                            </div>
                            <div className="bg-emerald-500/5 backdrop-blur-md border border-emerald-500/20 p-5 rounded-2xl shadow-sm relative overflow-hidden">
                                <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500/20 rounded-full blur-xl"></div>
                                <div className="text-sm font-medium text-emerald-500/80 mb-1 flex items-center gap-2 relative z-10">
                                    <CircleDollarSign className="w-4 h-4" /> Avg. Repair Price
                                </div>
                                <div className="text-3xl font-bold text-emerald-400 relative z-10">€{stats.averageRepairPrice.toFixed(0)}</div>
                            </div>
                            <div className="bg-orange-500/5 backdrop-blur-md border border-orange-500/20 p-5 rounded-2xl shadow-sm">
                                <div className="text-sm font-medium text-orange-500/80 mb-1 flex items-center gap-2">
                                    <EyeOff className="w-4 h-4" /> Hidden Devices
                                </div>
                                <div className="text-3xl font-bold text-orange-400">{stats.hiddenDevices}</div>
                            </div>
                        </div>
                    )}

                    {/* Filters */}
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 p-5 rounded-2xl mb-6 shadow-sm">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search models or brands..."
                                className="w-full pl-11 pr-4 py-2.5 bg-slate-950/50 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                            />
                        </div>
                    </div>

                    {/* Device Grid */}
                    {devices.length === 0 ? (
                        <div className="text-center py-20 text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
                            <Smartphone className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                            <p className="text-lg font-medium">No devices found in the catalog.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {devices.map((device: any) => (
                                <div
                                    key={device.id}
                                    onClick={() => handleSelectDevice(device)}
                                    className="bg-slate-900/80 border border-slate-800/80 p-5 rounded-2xl cursor-pointer hover:border-blue-500/50 hover:bg-slate-800/80 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all flex flex-col gap-4 group relative"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="bg-slate-950 rounded-xl p-2 border border-slate-800">
                                            {device.image ? (
                                                <img src={device.image} alt={device.model} className="w-16 h-16 rounded-lg object-contain" />
                                            ) : (
                                                <div className="w-16 h-16 flex items-center justify-center text-slate-700">
                                                    <Smartphone size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => handleEditDevice(e, device)}
                                                className="p-2 bg-slate-800 hover:bg-blue-600 text-white rounded-lg transition-colors shadow-sm"
                                                title="Edit Device"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteDevice(e, device.id)}
                                                className="p-2 bg-slate-800 hover:bg-red-600 text-white rounded-lg transition-colors shadow-sm"
                                                title="Delete Device"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1">
                                        <div className="text-xs text-blue-400 font-bold uppercase tracking-wider mb-1">{device.brand}</div>
                                        <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">{device.model}</h3>
                                        
                                        <div className="flex items-center gap-3 mt-3">
                                            <span className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950 px-2 py-1 rounded-md border border-slate-800/50">
                                                <Wrench size={12} className="text-slate-500" /> {device.services?.length || 0} Services
                                            </span>
                                            {!device.isVisible ? (
                                                <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-orange-400 bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20">
                                                    <EyeOff size={10} /> Hidden
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                                                    <CheckCircle size={10} /> Active
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="absolute right-4 bottom-4 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all">
                                        <ChevronRight size={20} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-8 p-4 bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-sm">
                            <div className="text-sm text-slate-400 font-medium">
                                Showing page <span className="text-white">{page}</span> of <span className="text-white">{totalPages}</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 bg-slate-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors text-sm font-medium"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-4 py-2 bg-slate-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors text-sm font-medium"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="animate-in slide-in-from-right-8 duration-300">
                    <button
                        onClick={() => setSelectedDevice(null)}
                        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors font-medium bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-800 w-fit"
                    >
                        <ArrowLeft size={18} /> Back to Catalog
                    </button>

                    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 mb-8 flex justify-between items-center shadow-lg">
                        <div className="flex items-center gap-5">
                            <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 shadow-inner">
                                {selectedDevice.image ? (
                                    <img src={selectedDevice.image} alt={selectedDevice.model} className="w-16 h-16 rounded-lg object-contain" />
                                ) : (
                                    <div className="w-16 h-16 flex items-center justify-center text-slate-700 bg-slate-900 rounded-lg"><Smartphone /></div>
                                )}
                            </div>
                            <div>
                                <div className="text-sm text-blue-400 font-bold uppercase tracking-wider mb-1">{selectedDevice.brand}</div>
                                <h2 className="text-3xl font-black text-white">{selectedDevice.model}</h2>
                            </div>
                        </div>
                        <button
                            onClick={handleSaveServices}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20"
                        >
                            <Save size={20} /> Save Pricing
                        </button>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-slate-300">
                                <thead className="bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-md text-slate-400 text-xs font-bold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Service Type</th>
                                        <th className="px-6 py-4">Label (Public Name)</th>
                                        <th className="px-6 py-4">Price (€)</th>
                                        <th className="px-6 py-4">Duration</th>
                                        <th className="px-6 py-4">Warranty</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {editedServices.map((service, index) => (
                                        <tr key={index} className="hover:bg-slate-800/40 transition-colors group">
                                            <td className="px-6 py-4">
                                                <select
                                                    title="Service Type"
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 outline-none transition-colors appearance-none"
                                                    value={service.type}
                                                    onChange={(e) => handleServiceChange(index, 'type', e.target.value)}
                                                >
                                                    <option value="screen">Screen Repair</option>
                                                    <option value="battery">Battery Replacement</option>
                                                    <option value="charging">Charging Port</option>
                                                    <option value="camera">Camera Repair</option>
                                                    <option value="backglass">Back Glass</option>
                                                    <option value="faceid">Face ID Repair</option>
                                                    <option value="other">Other Service</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    title="Service Label"
                                                    placeholder="e.g. Premium Screen"
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 outline-none transition-colors"
                                                    value={service.label}
                                                    onChange={(e) => handleServiceChange(index, 'label', e.target.value)}
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">€</span>
                                                    <input
                                                        type="number"
                                                        title="Service Price"
                                                        placeholder="0.00"
                                                        className="w-28 bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2.5 text-sm text-emerald-400 font-bold focus:border-emerald-500 outline-none transition-colors"
                                                        value={service.price}
                                                        onChange={(e) => handleServiceChange(index, 'price', Number(e.target.value))}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    title="Service Duration"
                                                    placeholder="e.g. 1-2 Hours"
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 outline-none transition-colors"
                                                    value={service.duration}
                                                    onChange={(e) => handleServiceChange(index, 'duration', e.target.value)}
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    title="Warranty Period"
                                                    placeholder="e.g. 12 Months"
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 outline-none transition-colors"
                                                    value={service.warranty}
                                                    onChange={(e) => handleServiceChange(index, 'warranty', e.target.value)}
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => handleDeleteService(index)} 
                                                    className="p-2.5 bg-slate-800/50 hover:bg-red-500/20 text-slate-500 hover:text-red-400 border border-slate-800 hover:border-red-500/30 rounded-lg transition-colors" 
                                                    title="Remove Service"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <td colSpan={6} className="p-6 bg-slate-950/30">
                                            <button 
                                                onClick={handleAddService} 
                                                className="w-full py-4 border-2 border-dashed border-slate-700/80 text-slate-400 rounded-xl hover:border-blue-500 hover:text-blue-400 hover:bg-blue-500/5 transition-all font-bold flex items-center justify-center gap-2"
                                            >
                                                <Plus size={18} /> Add New Service
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Device Add/Edit Modal */}
            {isDeviceModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-md shadow-2xl relative animate-in zoom-in-95">
                        <button 
                            onClick={() => setIsDeviceModalOpen(false)} 
                            title="Close Modal"
                            aria-label="Close Modal"
                            className="absolute top-6 right-6 text-slate-500 hover:text-white bg-slate-800 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                        >
                            <X size={18} />
                        </button>
                        
                        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3 border-b border-slate-800 pb-4">
                            <div className="p-2 bg-blue-500/20 rounded-xl"><Smartphone className="w-5 h-5 text-blue-400" /></div>
                            {deviceForm.id ? 'Edit Device' : 'New Device'}
                        </h3>

                        <form onSubmit={handleDeviceSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Device Model</label>
                                <input
                                    title="Model Name"
                                    placeholder="e.g. iPhone 15 Pro Max"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white focus:border-blue-500 outline-none transition-colors"
                                    value={deviceForm.model}
                                    onChange={e => setDeviceForm({ ...deviceForm, model: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Brand</label>
                                <input
                                    title="Brand"
                                    list="brand-options"
                                    placeholder="e.g. Apple, Samsung..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white focus:border-blue-500 outline-none transition-colors"
                                    value={deviceForm.brand}
                                    onChange={e => setDeviceForm({ ...deviceForm, brand: e.target.value })}
                                    required
                                />
                                <datalist id="brand-options">
                                    <option value="Apple" />
                                    <option value="Samsung" />
                                    <option value="Google" />
                                    <option value="Xiaomi" />
                                    <option value="OnePlus" />
                                </datalist>
                            </div>

                            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl">
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Device Image</label>
                                <ImageUpload
                                    value={deviceForm.image}
                                    onChange={(url) => setDeviceForm({ ...deviceForm, image: url })}
                                    label="Upload Photo"
                                />
                            </div>

                            <div className="flex items-center gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                                <input
                                    type="checkbox"
                                    id="isVisible"
                                    className="w-5 h-5 accent-blue-600 cursor-pointer rounded bg-slate-800 border-slate-700"
                                    checked={deviceForm.isVisible}
                                    onChange={e => setDeviceForm({ ...deviceForm, isVisible: e.target.checked })}
                                />
                                <label htmlFor="isVisible" className="text-slate-300 font-bold cursor-pointer select-none">
                                    Visible to Customers on Website
                                </label>
                            </div>

                            <div className="pt-4 border-t border-slate-800">
                                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-all">
                                    <Save size={20} /> {deviceForm.id ? 'Save Changes' : 'Create Device'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
