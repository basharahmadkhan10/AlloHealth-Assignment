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
    return NextResponse.json({ error: 'Already processed' }, { status: 400 })
  }

  if (new Date() > reservation.expiresAt) {
    // Expired — stock wapas karo aur 410 do
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

    return NextResponse.json({
      error: 'reservation_expired',
      message: 'Your reservation timed out. Please try again.',
    }, { status: 410 })
  }


  await prisma.$transaction([
    prisma.stockLevel.update({
      where: {
        productId_warehouseId: {
          productId: reservation.productId,
          warehouseId: reservation.warehouseId
        }
      },
      data: {
        reservedUnits: { decrement: reservation.quantity },
        totalUnits:    { decrement: reservation.quantity },
      }
    }),
    prisma.reservation.update({
      where: { id: params.id },
      data: { status: 'confirmed' }
    })
  ])

  return NextResponse.json({ status: 'confirmed' })
}
