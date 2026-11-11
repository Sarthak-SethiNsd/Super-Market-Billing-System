export type MovementType = 'ADDITION' | 'REDUCTION' | 'SALE' | 'ADJUSTMENT';

export interface InventoryMovement {
  id: number;
  productId: number;
  movementType: MovementType;
  quantityChange: number;
  previousStock: number;
  newStock: number;
  reason: string;
  relatedBillId: number | null;
  createdAt: string;
}

export interface StockAdjustmentRequest {
  productId: number;
  quantityChange: number;
  reason: string;
  movementType?: MovementType;
}

export interface StockAdjustmentResponse {
  movementId: number;
  productId: number;
  previousStock: number;
  quantityChange: number;
  newStock: number;
  reason: string;
}
