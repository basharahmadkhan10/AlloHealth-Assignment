import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('productId')

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: object) => {
        controller.enqueue(`data: ${JSON.stringify(data)}\n\n`)
      }

      // Turant initial stock bhejo
      prisma.stockLevel.findMany({
        where: productId ? { productId } : undefined
      }).then(stocks => send({ type: 'stock', stocks }))

      // Har 3 second mein update
      const interval = setInterval(async () => {
        const stocks = await prisma.stockLevel.findMany({
          where: productId ? { productId } : undefined
        })
        send({ type: 'stock', stocks })
      }, 3000)

      // Client disconnect hone pe cleanup
      req.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
}