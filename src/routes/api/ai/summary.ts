import { prisma } from '@/db'
import { openrouter } from '@/lib/open-router'
import { createFileRoute } from '@tanstack/react-router'
import { streamText } from 'ai'

export const Route = createFileRoute('/api/ai/summary')({
  server: {
    handlers: {
      POST: async ({ request, context }) => {
        const { itemId, prompt } = await request.json()

        if (!itemId || !prompt) {
          return new Response('Either of prompt or itemId is missing', { status: 400 })
        }

        const item = await prisma.savedItem.findUnique({
          where: {
            id: itemId,
            userId: context?.session.user.id,
          },
        })

        if (!item) {
          return new Response('Item not found', { status: 404 })
        }

        const res = streamText({
          model: openrouter.chat('openai/gpt-oss-120b:free'),
          system: `You are a precise and factual summarisation assistant.
          You will be given web content scraped from a specific URL.
          Your task is to summarise the content accurately based only on the provided text, without adding external knowledge or speculation.

          Instructions:
          1. Produce a concise, structured summary of the content.
          2. Preserve key facts, definitions, statistics, and conclusions.
          3. Do not invent information or reference sources beyond the provided text.
          4. If the content is incomplete, unclear, or repetitive, state that explicitly.
          5. Ignore navigation elements, ads, cookie notices, or boilerplate text if present.
          6. Use neutral, professional language.

          Output Format:
          1. Overview (2–3 sentences)
          2. Key Points (bullet list)
          3. Notable Details or Data (if any)
          4. Limitations of the Source (if applicable)`,

          prompt: `Please summarise this content: \n\n${prompt}`,
  
        })

        return res.toTextStreamResponse()
      },
    },
  },
})
