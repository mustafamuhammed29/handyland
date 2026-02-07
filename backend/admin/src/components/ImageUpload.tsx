import React, { useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';

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
            const res = await fetch('http://localhost:5000/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
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
                <div className="relative rounded-xl overflow-hidden border border-slate-700 group h-48 bg-black flex justify-center items-center">
                    <img src={value} alt="Uploaded" className="h-full object-contain" />
                    <button
                        type="button"
                        onClick={() => onChange('')}
                        className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X size={16} />
                    </button>
                </div>
            ) : (
                <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 hover:border-slate-600'
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
