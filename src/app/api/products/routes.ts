import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const products = await prisma.product.findMany({
    include: {
      stockLevels: {
        include: {
          warehouse: true
        }
      }
    }
  })
  return NextResponse.json(products)
}