import React, { useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { api } from '../utils/api';

interface ImageUploadProps {
    value: string;
    onChange: (url: string) => void;
    label?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ value, onChange, label = "Product Image" }) => {
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUpload = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file');
            return;
        }

        setError(null);
        setUploading(true);

        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await api.post('/api/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const data = res.data;
            if (data.imageUrl) {
                onChange(data.imageUrl);
            } else {
                setError('Upload failed');
            }
        } catch (err) {
            console.error(err);
            setError('Upload error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-400">{label}</label>

            {value ? (
                <div className="relative rounded-xl border border-slate-700 group bg-slate-900 p-6 flex justify-center items-center overflow-hidden">
                    {/* Subtle dot pattern for transparent images */}
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
                    
                    <img src={value} alt="Uploaded" className="max-h-[200px] max-w-full object-contain relative z-10 drop-shadow-2xl rounded" />
                    
                    <button
                        type="button"
                        title="Remove image"
                        aria-label="Remove image"
                        onClick={() => onChange('')}
                        className="absolute top-3 right-3 z-20 bg-red-600 hover:bg-red-500 text-white p-2 rounded-full shadow-lg shadow-red-900/50 opacity-0 group-hover:opacity-100 transition-all scale-90 hover:scale-100"
                    >
                        <X size={16} strokeWidth={3} />
                    </button>
                </div>
            ) : (
                <div
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 hover:border-slate-600'
                        }`}
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setDragActive(false);
                        if (e.dataTransfer.files?.[0]) handleUpload(e.dataTransfer.files[0]);
                    }}
                >
                    {uploading ? (
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                            <Loader2 className="animate-spin" size={24} />
                            <span className="text-xs">Uploading...</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                            <Upload size={24} />
                            <span className="text-sm font-medium">Drag & Drop or Click to Upload</span>
                            <span className="text-xs text-slate-600">Supports JPG, PNG, WEBP</span>
                            <input
                                type="file"
                                accept="image/*"
                                title="Upload image file"
                                aria-label="Upload image file"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Fallback to URL input */}
            <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-slate-600 uppercase font-bold">OR</span>
                <input
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
                    placeholder="Enter Image URL directly..."
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>
    );
};

export default ImageUpload;
