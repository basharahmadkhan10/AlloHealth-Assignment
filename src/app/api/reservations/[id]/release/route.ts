import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(
  _: Request,
  { params }: { params: { id: string } }
) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: params.id }
  })

  if (!reservation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (reservation.status !== 'pending') {
    return NextResponse.json({ error: 'Cannot release' }, { status: 400 })
  }

  await prisma.$transaction([
    prisma.stockLevel.update({
      where: {
        productId_warehouseId: {
          productId: reservation.productId,
          warehouseId: reservation.warehouseId
        }
      },
      data: { reservedUnits: { decrement: reservation.quantity } }
    }),
    prisma.reservation.update({
      where: { id: params.id },
      data: { status: 'released' }
    })
  ])

  return NextResponse.json({ status: 'released' })
}