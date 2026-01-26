import { createServerFn } from '@tanstack/react-start'
import { firecrawl } from '../lib/firecrawl'
import { bulkImportSchema, extractSchema, importSchema } from '@/schemas/import';
import { prisma } from '@/db';
import { z } from 'zod';
import { notFound } from '@tanstack/react-router';
import { authFnMiddleware, authMiddleware } from '@/middlewares/auth';
import { generateText } from 'ai';
import { openrouter } from '@/lib/open-router';
import { searchSchema } from "@/schemas/import"
import { SearchResultWeb } from '@mendable/firecrawl-js';
import { Progress } from '@/components/ui/progress'

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

export type BulkScrapeProgress = {
    completed: number,
    total: number,
    url: string,
    status: 'success' | 'failed'
}

export const bulkScrapeURLsFn = createServerFn({ method: 'POST' }).middleware([authFnMiddleware,])
    .inputValidator(z.object({
        urls: z.array(z.string().url()),
    }),
    ).handler(async function* ({ data, context }) {
        const total = data.urls.length;
        for (let i = 0; i < data.urls.length; i++) {
            const url = data.urls[i];
            const item = await prisma.savedItem.create({
                data: {
                    url: url,
                    userId: context.session.user.id,
                    status: 'PENDING',
                },
            })

            let status: BulkScrapeProgress['status'] = 'success'
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
                status = 'failed'
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
            const progress: BulkScrapeProgress = {
                completed: i + 1,
                total: total,
                url: url,
                status: status,
            }

            yield progress;
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


export const saveSummaryAndGenerateTextFn = createServerFn({ method: 'POST' })
    .middleware([authFnMiddleware])
    .inputValidator(z.object({
        id: z.string(),
        summary: z.string(),
    }),)
    .handler(async ({ context, data }) => {
        const existing = await prisma.savedItem.findUnique({
            where: {
                id: data.id,
                userId: context.session.user.id,
            },
        })

        if (!existing) {
            throw notFound()
        }

        const { text } = await generateText({
            model: openrouter.chat('openai/gpt-oss-120b:free'),
            system: `You are given a short content summary.
            Your task is to:

            1. Extract 3 to 5 highly relevant, concise tags that best describe the content.
            2. Ensure tags are lowercase, short (1 to 3 words max), and specific (avoid vague terms like “general” or “misc”).
            3. Include both topic tags (e.g., technology, finance) and domain-specific tags (e.g., java, machine learning, tax law).
            
            Output requirements (critical):
            1. Return only a single line
            2. Tags must be comma-separated
            3. No explanations, no labels, no extra text

            Example output:
            technology, java, app development, debugging`,

            prompt: ` Now extract tags from the following content summary: \n\n${data.summary}`,
        })

        const tags = text.split(',').map((tag) => tag.trim().toLowerCase()).filter((tag) => tag.length > 0).slice(0, 5)
        const item = await prisma.savedItem.update({
            where: {
                userId: context.session.user.id,
                id: data.id,
            },
            data: {
                summary: data.summary,
                tags: tags,
            }
        })

        return item
    })

export const searchWebFn = createServerFn({ method: 'POST' })
    .middleware([authFnMiddleware])
    .inputValidator(searchSchema)
    .handler(async ({ data }) => {
        const res = await firecrawl.search(data.searchQuery, {
            limit: 10,
            tbs: 'qdr:y',
            scrapeOptions: {
                formats: ['markdown']
            },
        })

        return res.web?.map((item) => ({
            url: (item as SearchResultWeb).url,
            title: (item as SearchResultWeb).title,
            description: (item as SearchResultWeb).description,
        })) as SearchResultWeb[]
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