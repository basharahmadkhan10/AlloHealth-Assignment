import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const expired = await prisma.reservation.findMany({
    where: {
      status: 'pending',
      expiresAt: { lt: new Date() }
    }
  })

  for (const r of expired) {
    await prisma.$transaction([
      prisma.stockLevel.update({
        where: {
          productId_warehouseId: {
            productId: r.productId,
            warehouseId: r.warehouseId
          }
        },
        data: { reservedUnits: { decrement: r.quantity } }
      }),
      prisma.reservation.update({
        where: { id: r.id },
        data: { status: 'released' }
      })
    ])
  }

  return NextResponse.json({ cleaned: expired.length })
}