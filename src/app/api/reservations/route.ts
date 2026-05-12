import { prisma } from '@/lib/prisma'
import { ReserveSchema } from '@/lib/zod-schema'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()
  
  const parsed = ReserveSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { productId, warehouseId, quantity } = parsed.data

  try {
    const reservation = await prisma.$transaction(async (tx) => {
      const stock = await tx.$queryRaw<any[]>`
        SELECT * FROM "StockLevel"
        WHERE "productId" = ${productId}
        AND "warehouseId" = ${warehouseId}
        FOR UPDATE
      `

      if (!stock[0]) {
        throw new Error('STOCK_NOT_FOUND')
      }

      const available = stock[0].totalUnits - stock[0].reservedUnits
      if (available < quantity) {
        throw new Error('INSUFFICIENT_STOCK')
      }

      await tx.stockLevel.update({
        where: { productId_warehouseId: { productId, warehouseId } },
        data: { reservedUnits: { increment: quantity } }
      })

      return tx.reservation.create({
        data: {
          productId,
          warehouseId,
          quantity,
          status: 'pending',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
        include: { 
          product: true, 
          warehouse: true 
        }
      })
    })

    return NextResponse.json(reservation, { status: 201 })

  } catch (e: any) {
    if (e.message === 'INSUFFICIENT_STOCK') {
      return NextResponse.json({
        error: 'not_enough_stock',
        message: 'This item was just reserved by someone else. It may free up in ~10 minutes if they cancel.',
      }, { status: 409 })
    }
    if (e.message === 'STOCK_NOT_FOUND') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}