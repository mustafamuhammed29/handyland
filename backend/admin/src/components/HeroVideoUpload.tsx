import React, { useState } from 'react';
import { Upload, X, Loader2, Video, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../utils/api';

interface HeroVideoUploadProps {
    value?: string;
    onChange: (url: string) => void;
    label?: string;
    posterUrl?: string;
}

export const HeroVideoUpload: React.FC<HeroVideoUploadProps> = ({
    value,
    onChange,
    label = 'Hero Video File (MP4 or WebM)',
    posterUrl
}) => {
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const handleUpload = async (file: File) => {
        const allowedTypes = ['video/mp4', 'video/webm'];
        const ext = file.name.split('.').pop()?.toLowerCase();

        if (!allowedTypes.includes(file.type) && ext !== 'mp4' && ext !== 'webm') {
            setError('Please upload an approved video file (MP4 or WebM only).');
            return;
        }

        const maxBytes = 25 * 1024 * 1024; // 25 MB limit
        if (file.size > maxBytes) {
            setError('Video file exceeds maximum allowed size (25 MB). Please compress the video before uploading.');
            return;
        }

        setError(null);
        setUploading(true);

        const formData = new FormData();
        formData.append('video', file);

        try {
            const res = await api.post('/api/admin/uploads/hero-video', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const data = res.data;
            if (data && data.videoUrl) {
                onChange(data.videoUrl);
                setConfirmDelete(false);
            } else {
                setError(data?.message || 'Video upload failed. Please try again.');
            }
        } catch (err: unknown) {
            const errorObj = err as { response?: { data?: { message?: string } } };
            setError(errorObj.response?.data?.message || 'Failed to upload video. Please check file format and try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = () => {
        if (!confirmDelete) {
            setConfirmDelete(true);
            return;
        }
        onChange('');
        setConfirmDelete(false);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-slate-300 flex items-center gap-2">
                    <Video size={16} className="text-cyan-400" />
                    {label}
                </label>
                <span className="text-xs text-slate-400 font-mono">Max 25 MB • MP4 / WebM</span>
            </div>

            {error && (
                <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-xl flex items-center gap-2 text-red-400 text-xs">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {value ? (
                <div className="relative rounded-xl border border-slate-700 bg-slate-950 p-4 space-y-3 overflow-hidden shadow-2xl">
                    <div className="relative rounded-lg overflow-hidden bg-black aspect-video flex items-center justify-center max-h-64">
                        <video
                            src={value}
                            poster={posterUrl}
                            controls
                            muted
                            playsInline
                            preload="metadata"
                            className="w-full h-full object-contain"
                        />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span className="text-xs text-slate-300 font-medium truncate max-w-xs">{value}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white cursor-pointer transition-all flex items-center gap-1.5 border border-slate-700">
                                <RefreshCw size={13} />
                                Replace Video
                                <input
                                    type="file"
                                    accept="video/mp4,video/webm"
                                    className="hidden"
                                    onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                                />
                            </label>

                            {confirmDelete ? (
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={handleRemove}
                                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-bold text-white transition-all shadow-md shadow-red-900/40"
                                    >
                                        Confirm Remove
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setConfirmDelete(false)}
                                        className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleRemove}
                                    className="px-3 py-1.5 rounded-lg bg-red-900/30 hover:bg-red-900/50 text-red-400 hover:text-red-300 text-xs font-semibold border border-red-800/50 transition-all flex items-center gap-1.5"
                                >
                                    <X size={13} />
                                    Remove Video
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                        dragActive ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-800 hover:border-slate-600 bg-slate-900/40'
                    }`}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragActive(true);
                    }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setDragActive(false);
                        if (e.dataTransfer.files?.[0]) handleUpload(e.dataTransfer.files[0]);
                    }}
                >
                    {uploading ? (
                        <div className="flex flex-col items-center gap-2 text-cyan-400 py-4">
                            <Loader2 className="animate-spin" size={32} />
                            <span className="text-sm font-semibold">Uploading Hero Video (Max 25 MB)...</span>
                            <span className="text-xs text-slate-500">Streaming to media storage</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-400 py-4">
                            <div className="p-3 rounded-full bg-cyan-500/10 text-cyan-400 mb-1">
                                <Upload size={28} />
                            </div>
                            <span className="text-sm font-bold text-slate-200">Drag & Drop Video or Click to Upload</span>
                            <span className="text-xs text-slate-500">Supported: MP4, WebM (Max 25 MB)</span>
                            <span className="text-[11px] text-slate-500 max-w-sm">
                                Recommended: 10–20 seconds duration, muted, compressed web video for best performance.
                            </span>
                            <input
                                type="file"
                                accept="video/mp4,video/webm"
                                title="Upload hero video file"
                                aria-label="Upload hero video file"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
