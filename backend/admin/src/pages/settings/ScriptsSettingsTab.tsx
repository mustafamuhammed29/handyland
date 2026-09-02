import { Trash2 } from 'lucide-react';

export const ScriptsSettingsTab = ({ settings, handleChange }: any) => {
    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-white mb-4">Support Scripts & Quick Replies</h3>
            <p className="text-slate-400 text-sm mb-4">Manage predefined responses to answer customer queries quickly.</p>

            <div className="p-4 border border-slate-700 rounded-xl bg-slate-900/50">
                <h4 className="text-white font-bold mb-4 flex justify-between items-center">
                    Quick Replies
                    <button
                        onClick={() => {
                            const newReplies = [...(settings.quickReplies || []), "New Quick Reply"];
                            handleChange(null, 'quickReplies', newReplies);
                        }}
                        className="text-xs bg-cyan-600 px-3 py-1.5 rounded text-white hover:bg-cyan-500 flex items-center gap-1 font-bold"
                    >
                        + Add Reply
                    </button>
                </h4>
                <div className="space-y-3">
                    {(settings.quickReplies || []).map((reply: string, idx: number) => (
                        <div key={idx} className="flex gap-3 items-start bg-slate-800 p-3 rounded-lg border border-slate-700">
                            <textarea
                                value={reply}
                                onChange={(e) => {
                                    const newReplies = [...(settings.quickReplies || [])];
                                    newReplies[idx] = e.target.value;
                                    handleChange(null, 'quickReplies', newReplies);
                                }}
                                className="bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white flex-1 resize-y outline-none focus:border-blue-500"
                                placeholder="Enter predefined response..."
                                rows={2}
                            />
                            <button
                                onClick={() => {
                                    const newReplies = (settings.quickReplies || []).filter((_: any, i: number) => i !== idx);
                                    handleChange(null, 'quickReplies', newReplies);
                                }}
                                className="text-red-400 hover:text-white hover:bg-red-500/20 p-2 rounded transition-colors mt-2"
                                title="Delete Reply"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                    {(!settings.quickReplies || settings.quickReplies.length === 0) && (
                        <p className="text-slate-500 text-sm text-center py-4">No quick replies defined.</p>
                    )}
                </div>
            </div>
        </div>
    );
};
