import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
async function main() {
  // Warehouses banao
  const delhi = await prisma.warehouse.create({
    data: { name: 'Delhi Hub', location: 'New Delhi' }
  })
  const mumbai = await prisma.warehouse.create({
    data: { name: 'Mumbai Hub', location: 'Mumbai' }
  })

  const products = [
    { name: 'Wireless Headphones XZ-400', sku: 'WH-XZ400', price: 3499, description: 'Premium noise-cancelling headphones' },
    { name: 'Mechanical Keyboard K80',    sku: 'KB-K80',   price: 5999, description: 'TKL layout, RGB backlit' },
    { name: 'USB-C Hub 7-in-1',           sku: 'HUB-7C',   price: 1899, description: 'Multiport adapter' },
  ]

  for (const p of products) {
    const product = await prisma.product.create({ data: p })

    await prisma.stockLevel.createMany({
      data: [
        { productId: product.id, warehouseId: delhi.id,  totalUnits: 5, reservedUnits: 0 },
        { productId: product.id, warehouseId: mumbai.id, totalUnits: 3, reservedUnits: 0 },
      ]
    })
  }

  console.log('Database seeded successfully!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())