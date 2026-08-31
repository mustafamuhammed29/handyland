/**
 * backend/admin/src/components/WarehouseManager/types.ts
 * TypeScript interfaces matching the backend API response whitelists for Phase 1C and 1B.
 */

export interface WarehouseStats {
    activePartCount: number;
    totalOnHandQuantity: number;
    totalAvailableQuantity: number;
    totalReservedQuantity: number;
    totalDefectiveQuantity: number;
    totalInspectionQuantity: number;
    lowStockPartCount: number;
    activeLocationCount: number;
}

export interface WarehousePart {
    id: string;
    name: string;
    sku: string;
    barcode: string | null;
    category: string | null;
    compatibleDevices: string[];
    brand: string | null;
    deviceFamily: string | null;
    partType: string | null;
    quality: string | null;
    status: 'active' | 'discontinued';
    isActive: boolean;
    minStock: number;
    imageUrl: string | null;
    onHandQuantity: number;
    reservedQuantity: number;
    defectiveQuantity: number;
    inspectionQuantity: number;
    availableQuantity: number;
}

export interface WarehouseLocation {
    id: string;
    locationCode: string;
    zone: string;
    rack: string | null;
    shelf: string | null;
    bin: string | null;
    description: string | null;
    isActive: boolean;
}

export type MovementType =
    | 'RECEIVE'
    | 'ADJUSTMENT_IN'
    | 'ADJUSTMENT_OUT'
    | 'TRANSFER'
    | 'DAMAGE'
    | 'SUPPLIER_RETURN';

export interface WarehouseMovement {
    id: string;
    movementType: MovementType | string;
    quantity: number;
    createdAt: string;
    repairPart: {
        id: string | null;
        name: string;
        sku: string;
        barcode: string | null;
    };
    sourceLocation: {
        id: string;
        locationCode: string;
    } | null;
    destinationLocation: {
        id: string;
        locationCode: string;
    } | null;
    performedBy: {
        id: string;
        displayName: string | null;
    } | null;
    reason: string | null;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface CreateMovementPayload {
    repairPartId: string;
    movementType: MovementType;
    quantity: number;
    sourceLocationId?: string;
    destinationLocationId?: string;
    reason?: string;
}

export type WarehouseTab = 'parts' | 'movements' | 'locations';
