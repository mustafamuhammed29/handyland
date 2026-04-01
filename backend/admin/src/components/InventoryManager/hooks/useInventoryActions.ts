import { useState } from 'react';
import { api } from '../../../utils/api';

export function useInventoryActions(refreshData: () => void) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    const [isAddPartModalOpen, setIsAddPartModalOpen] = useState(false);

    const handleEditClick = (item: any) => {
        setEditingItem(item);
        setIsEditModalOpen(true);
    };

    const handleUpdateItem = async (editForm: any) => {
        try {
            const endpoint = `/api/inventory/${editingItem.itemType}/${editingItem._id}/stock`;
            await api.put(endpoint, {
                stock: editForm.stock,
                price: editForm.price,
                costPrice: editForm.costPrice,
                reason: editForm.reason,
                notes: editForm.notes
            });

            setIsEditModalOpen(false);
            setEditingItem(null);
            refreshData();
            return { success: true };
        } catch (error) {
            console.error("Failed to update item", error);
            return { success: false, error: "Failed to update item." };
        }
    };

    const handleInlineUpdate = async (item: any, field: string, value: any) => {
        try {
            const endpoint = `/api/inventory/${item.itemType}/${item._id}/stock`;
            const payload: any = { reason: 'Inline Edit', notes: '' };
            payload[field] = value;
            
            await api.put(endpoint, payload);
            refreshData(); // Refresh API to show new stock
            return { success: true };
        } catch (error) {
            console.error(`Failed to inline update ${field}`, error);
            return { success: false, error: 'Update failed' };
        }
    };

    const handleAddPartSave = async (addPartForm: any) => {
        try {
            await api.post('/api/repair-parts', addPartForm);
            setIsAddPartModalOpen(false);
            refreshData();
            return { success: true };
        } catch (error: any) {
            console.error("Error saving part:", error);
            return { success: false, error: error.response?.data?.message || "Error saving part. Check barcode uniqueness." };
        }
    };

    return {
        isEditModalOpen, setIsEditModalOpen,
        editingItem, handleEditClick, handleUpdateItem, handleInlineUpdate,
        isAddPartModalOpen, setIsAddPartModalOpen, handleAddPartSave
    };
}
