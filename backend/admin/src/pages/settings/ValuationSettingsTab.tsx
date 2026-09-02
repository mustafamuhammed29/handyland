import { Trash2 } from 'lucide-react';
import { Input } from '../SettingsManager';

export const ValuationSettingsTab = ({ settings, handleChange }: any) => {
    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-white mb-4">Valuation Flow Control</h3>
            <div className="p-4 border border-slate-700 rounded-xl bg-slate-900/50">
                <h4 className="text-blue-400 font-bold mb-4">Step 1: Device Selection</h4>
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Main Title (Brand)" value={settings.valuation?.step1Title} onChange={(v: string) => handleChange('valuation', 'step1Title', v)} placeholder="Select Manufacturer" />
                    <Input label="Subtitle" value={settings.valuation?.step1Subtitle} onChange={(v: string) => handleChange('valuation', 'step1Subtitle', v)} placeholder="Choose a brand to start" />
                    <Input label="Model Selection Title" value={settings.valuation?.step1ModelTitle} onChange={(v: string) => handleChange('valuation', 'step1ModelTitle', v)} placeholder="Select Model Blueprint" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Input label="Step 2 Title (Storage)" value={settings.valuation?.step2Title} onChange={(v: string) => handleChange('valuation', 'step2Title', v)} placeholder="Memory Module" />
                <Input label="Step 3 Title (Condition)" value={settings.valuation?.step3Title} onChange={(v: string) => handleChange('valuation', 'step3Title', v)} placeholder="Physical Check" />
            </div>

            <div className="p-4 border border-slate-700 rounded-xl bg-slate-900/50 mt-4">
                <h4 className="text-blue-400 font-bold mb-4">Result Actions</h4>
                <div className="grid grid-cols-3 gap-4">
                    <Input label="Reset Button" value={settings.valuation?.resetBtn} onChange={(v: string) => handleChange('valuation', 'resetBtn', v)} placeholder="Reset Scanner" />
                    <Input label="Save Button" value={settings.valuation?.saveBtn} onChange={(v: string) => handleChange('valuation', 'saveBtn', v)} placeholder="Save Quote" />
                    <Input label="Sell Button" value={settings.valuation?.sellBtn} onChange={(v: string) => handleChange('valuation', 'sellBtn', v)} placeholder="Sell Device" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Brands Manager */}
                <div className="p-4 border border-slate-700 rounded-xl bg-slate-900/50">
                    <h4 className="text-white font-bold mb-4 flex justify-between items-center">
                        Brands
                        <button
                            onClick={() => {
                                const newBrand = { id: Date.now().toString(), name: 'New Brand', icon: '📱' };
                                handleChange('valuation', 'brands', [...(settings.valuation?.brands || []), newBrand]);
                            }}
                            className="text-xs bg-cyan-600 px-2 py-1 rounded text-white hover:bg-cyan-500"
                        >
                            + Add
                        </button>
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {(settings.valuation?.brands || []).map((brand: any, idx: number) => (
                            <div key={idx} className="flex gap-2 items-center bg-slate-800 p-2 rounded">
                                <input
                                    value={brand.name}
                                    onChange={(e) => {
                                        const newBrands = [...settings.valuation.brands];
                                        newBrands[idx] = { ...brand, name: e.target.value };
                                        handleChange('valuation', 'brands', newBrands);
                                    }}
                                    className="bg-transparent border border-slate-600 rounded px-2 py-1 text-sm text-white w-24"
                                    placeholder="Name"
                                />
                                <input
                                    value={brand.icon}
                                    onChange={(e) => {
                                        const newBrands = [...settings.valuation.brands];
                                        newBrands[idx] = { ...brand, icon: e.target.value };
                                        handleChange('valuation', 'brands', newBrands);
                                    }}
                                    className="bg-transparent border border-slate-600 rounded px-2 py-1 text-sm text-white w-12 text-center"
                                    placeholder="Icon"
                                />
                                <input
                                    value={brand.id}
                                    onChange={(e) => {
                                        const newBrands = [...settings.valuation.brands];
                                        newBrands[idx] = { ...brand, id: e.target.value };
                                        handleChange('valuation', 'brands', newBrands);
                                    }}
                                    className="bg-transparent border border-slate-600 rounded px-2 py-1 text-xs text-slate-400 w-16"
                                    placeholder="ID"
                                />
                                <button
                                    aria-label="Remove Brand"
                                    onClick={() => {
                                        const newBrands = settings.valuation.brands.filter((_: any, i: number) => i !== idx);
                                        handleChange('valuation', 'brands', newBrands);
                                    }}
                                    className="text-red-400 hover:text-red-300 ml-auto"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Models Manager */}
                <div className="p-4 border border-slate-700 rounded-xl bg-slate-900/50">
                    <h4 className="text-white font-bold mb-4 flex justify-between items-center">
                        Models
                        <button
                            onClick={() => {
                                const newModel = { id: Date.now().toString(), name: 'New Model', brandId: settings.valuation?.brands?.[0]?.id || '', basePrice: 500 };
                                handleChange('valuation', 'models', [...(settings.valuation?.models || []), newModel]);
                            }}
                            className="text-xs bg-cyan-600 px-2 py-1 rounded text-white hover:bg-cyan-500"
                        >
                            + Add
                        </button>
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {(settings.valuation?.models || []).map((model: any, idx: number) => (
                            <div key={idx} className="flex gap-2 items-center bg-slate-800 p-2 rounded">
                                <input
                                    value={model.name}
                                    onChange={(e) => {
                                        const newModels = [...settings.valuation.models];
                                        newModels[idx] = { ...model, name: e.target.value };
                                        handleChange('valuation', 'models', newModels);
                                    }}
                                    className="bg-transparent border border-slate-600 rounded px-2 py-1 text-sm text-white flex-1"
                                    placeholder="Model Name"
                                />
                                <input
                                    value={model.basePrice}
                                    onChange={(e) => {
                                        const newModels = [...settings.valuation.models];
                                        newModels[idx] = { ...model, basePrice: Number(e.target.value) };
                                        handleChange('valuation', 'models', newModels);
                                    }}
                                    className="bg-transparent border border-slate-600 rounded px-2 py-1 text-sm text-white w-20"
                                    placeholder="Price €"
                                    type="number"
                                />
                                <select
                                    aria-label="Select Brand"
                                    value={model.brandId}
                                    onChange={(e) => {
                                        const newModels = [...settings.valuation.models];
                                        newModels[idx] = { ...model, brandId: e.target.value };
                                        handleChange('valuation', 'models', newModels);
                                    }}
                                    className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white w-20"
                                >
                                    <option value="">Brand</option>
                                    {settings.valuation?.brands?.map((b: any) => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                                <button
                                    aria-label="Remove Model"
                                    onClick={() => {
                                        const newModels = settings.valuation.models.filter((_: any, i: number) => i !== idx);
                                        handleChange('valuation', 'models', newModels);
                                    }}
                                    className="text-red-400 hover:text-red-300"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
