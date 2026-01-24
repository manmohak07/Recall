import { createServerFn } from '@tanstack/react-start'
import { firecrawl } from '../lib/firecrawl'
import { bulkImportSchema, extractSchema, importSchema } from '@/schemas/import';
import { prisma } from '@/db';
import { z } from 'zod';
import { notFound } from '@tanstack/react-router';

import { authFnMiddleware, authMiddleware } from '@/middlewares/auth';

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
                    prompt: 'Extract the author and published date of the article',
                    // schema: extractSchema,
                }],
                location: {
                    country: 'US',
                    languages: ['en'],
                },
                onlyMainContent: true,
                proxy: 'auto',
            },
            )

            const jsonData = res.json as z.infer<typeof extractSchema>;
            let publishedAt = null;
            if (jsonData.publishedAt) {
                const parsed = new Date(jsonData.publishedAt);
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

export const mapUrlFn = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(bulkImportSchema)
    .handler(async ({ data }) => {
        const res = await firecrawl.map(data.url, {
            limit: 20,
            search: data.search,
            location: {
                country: 'US',
                languages: ['en'],
            },
        })
        // console.log(res);
        return res.links;
    })

export const bulkScrapeURLsFn = createServerFn({ method: 'POST' }).middleware([authFnMiddleware,])
    .inputValidator(z.object({
        urls: z.array(z.string().url()),
    }),
    ).handler(async ({ data, context }) => {
        for (let i = 0; i < data.urls.length; i++) {
            const url = data.urls[i];
            const item = await prisma.savedItem.create({
                data: {
                    url: url,
                    userId: context.session.user.id,
                    status: 'PENDING',
                },
            })
            try {
                const res = await firecrawl.scrape(url, {
                    formats: ['markdown', {
                        type: 'json',
                        prompt: 'Extract the author and published date of the article',
                        // schema: extractSchema,
                    }],
                    location: {
                        country: 'US',
                        languages: ['en'],
                    },
                    onlyMainContent: true,
                    proxy: 'auto',
                },
                )

                const jsonData = res.json as z.infer<typeof extractSchema>;
                let publishedAt = null;
                if (jsonData.publishedAt) {
                    const parsed = new Date(jsonData.publishedAt);
                    if (!isNaN(parsed.getTime())) {
                        publishedAt = parsed;
                    }
                }

                await prisma.savedItem.update({
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
                // return updatedItem;
            } catch {
                await prisma.savedItem.update({
                    where: {
                        id: item.id,
                    },
                    data: {
                        status: 'FAILED',
                    },
                })
                // return failedItem;
            }

        }
    })

export const getItemsFn = createServerFn({ method: 'GET' }).middleware([authFnMiddleware])
    .handler(async ({ context }) => {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        const items = await prisma.savedItem.findMany({
            where: {
                userId: context.session.user.id,
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return items
    })

export const getItemById = createServerFn({ method: 'GET' })
    .middleware([authFnMiddleware])
    .inputValidator(z.object({ id: z.string() }))
    .handler(
        async ({ context, data }) => {
            const item = await prisma.savedItem.findUnique({
                where: {
                    userId: context.session.user.id,
                    id: data.id,
                },
            })

            if (!item) {
                throw notFound()
            }

            return item
        }
    )