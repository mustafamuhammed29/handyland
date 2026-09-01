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

export interface CreatePartCatalogPayload {
    name: string;
    sku: string;
    minStock: number;
    category?: string | null;
    brand?: string | null;
    deviceFamily?: string | null;
    partType?: string | null;
    quality?: string | null;
    barcode?: string | null;
    compatibleDevices?: string[];
    deviceModelId?: string | null;
}

export interface UpdatePartMetadataPayload {
    name: string;
    minStock: number;
    barcode: string | null;
    category: string | null;
    brand: string | null;
    deviceFamily: string | null;
    partType: string | null;
    quality: string | null;
    compatibleDevices: string[];
}

export interface DeviceModel {
    id: string;
    brand: string;
    modelName: string;
    deviceFamily: string;
    normalizedKey: string;
    releaseYear?: number | null;
    sortWeight: number;
    isActive: boolean;
    partCount: number;
    totalAvailable: number;
    totalOnHand: number;
    lowStockCount: number;
    outOfStockCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateModelPayload {
    brand: string;
    modelName: string;
    deviceFamily: string;
    releaseYear?: number | null;
    sortWeight?: number;
}

export interface UpdateModelPayload {
    brand?: string;
    modelName?: string;
    deviceFamily?: string;
    releaseYear?: number | null;
    sortWeight?: number;
}

export interface ModelPartsPreview {
    modelId: string;
    modelName: string;
    brand: string;
    totalLinkedParts: number;
    eligiblePartsCount: number;
    sharedActivePartsCount: number;
    blockedByStockCount: number;
    alreadyDiscontinuedCount: number;
    isBlocked: boolean;
}

export type WarehouseTab = 'parts' | 'movements' | 'locations';
