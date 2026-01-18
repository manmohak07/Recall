import { createServerFn } from '@tanstack/react-start'
import { firecrawl } from '../lib/firecrawl'
import { extractSchema, importSchema } from '@/schemas/import';
import { prisma } from '@/db';
import { z } from 'zod';

import { authFnMiddleware } from '@/middlewares/auth';

export const scrapeURLFn = createServerFn({ method: 'POST' })
    .middleware([authFnMiddleware])
    .inputValidator(importSchema)
    .handler(async ({ data, context }) => {
        // const user = await getSessionFn()
        const item = await prisma.savedItem.create({
            data: {
                url: data.url,
                userId: context.session.user.id,
                status: 'PROCESSING',
            },
        })

        try {
            const res = await firecrawl.scrape(data.url, {
                formats: ['markdown', {
                    type: 'json',
                    prompt: 'Extract the author and published date of the article'
                }],
                onlyMainContent: true,
            },
            )

            const jsonData = res.json as z.infer<typeof extractSchema>;
            let publishedAt = null;
            if (jsonData.publishedAt) {
                const parsed = jsonData.publishedAt;
                if (!isNaN(parsed.getTime())) {
                    publishedAt = parsed;
                }
            }

            const updatedItem = await prisma.savedItem.update({
                where: {
                    id: item.id,
                },
                data: {
                    title: res.metadata?.title || null,
                    content: res.markdown || null,
                    originalImage: res.metadata?.ogImage || null,
                    author: jsonData.author || null,
                    publishedAt: publishedAt,
                    status: 'COMPLETED',
                },
            })
            // console.log(res);
            return updatedItem;
        } catch {
            const failedItem = await prisma.savedItem.update({
                where: {
                    id: item.id,
                },
                data: {
                    status: 'FAILED',
                },
            })
            return failedItem;
        }
    })