import { z } from 'zod'

export const ReserveSchema = z.object({
  productId:   z.string().min(1),
  warehouseId: z.string().min(1),
  quantity:    z.number().int().positive(),
})