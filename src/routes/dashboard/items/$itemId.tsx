import { MessageResponse } from '@/components/ai-elements/message'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { getItemById, saveSummaryAndGenerateTextFn } from '@/data/items'
import { cn } from '@/lib/utils'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Calendar, ChevronDownIcon, Clock, ExternalLink, Loader2, Sparkles, User } from 'lucide-react'
import { useState } from 'react'
import { useCompletion } from '@ai-sdk/react'
import { toast } from 'sonner'

export const Route = createFileRoute('/dashboard/items/$itemId')({
    component: RouteComponent,
    loader: ({ params }) => getItemById({
        data: {
            id: params.itemId
        }
    }),
    head: ({ loaderData }) => ({
        meta: [
            {
                title: loaderData?.title ?? 'Item Details',
            },
            {
                property: 'og:image',
                content: loaderData?.originalImage ?? 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR8olvygEFZnZlu0iCvNbOQ33HNbs2CjYz2nQ&s'
            },

        ],
    }),
})

function RouteComponent() {
    const data = Route.useLoaderData()
    const [contentOpen, setContentOpen] = useState(false)
    const router = useRouter()

    const { completion, complete, isLoading } = useCompletion({
        api: '/api/ai/summary',
        initialCompletion: data.summary ? data.summary : undefined ,
        streamProtocol: 'text',
        body: {
            itemId: data.id,
        },
        onFinish: async(_prompt, completionText) => {
            await saveSummaryAndGenerateTextFn({
                data: {
                    id: data.id,
                    summary: completionText,
                },
            })

            toast.success('Summary Generated')

            router.invalidate()
        },
        onError: (e) => {
            toast.error(e.message)
        }
    })

    function generateSummary() {
        if(!data.content) {
            toast.error('No content available to summarise')
            return
        }

        complete(data.content)
    }

    return (
        <div className="mx-auto max-w-3xl space-y-6 w-full">
            <div className="flex justify-start">
                <Link
                    to="/dashboard/items"
                    className={buttonVariants({
                        variant: 'outline',
                    })}
                >
                    <ArrowLeft />
                    Go Back
                </Link>
            </div>
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
                <img
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    src={
                        data.originalImage ??
                        'https://i.pinimg.com/736x/03/df/d4/03dfd481c5c8af72b5991a6eea833448.jpg'
                    }
                    alt={data.title ?? 'Item Image'}
                />
            </div>

            <div className='space-y-3'>
                <h1 className='text-3xl font-bold tracking-tight'>
                    {data.title ?? 'Untitled'}
                </h1>

                <div className='flex flex-wrap items-center gap-4 text-sm to-muted-foreground'>
                    {data.author && (
                        <span className='inline-flex items-center gap-1'>
                            <User className='size-3.5' />
                            {data.author}
                        </span>
                    )}

                    {data.createdAt && (
                        <span className='inline-flex items-center gap-1'>
                            <Calendar className='size-3.5' />
                            {data.publishedAt ? `Saved ${(new Date(data.publishedAt).toLocaleDateString("en-US"))}` : 'Published date could not be found'}
                        </span>
                    )}

                    {data.createdAt && (
                        <span className='inline-flex items-center gap-1'>
                            <Clock className='size-3.5' />
                            Saved {new Date(data.createdAt).toLocaleDateString("en-US")}
                        </span>
                    )}
                </div>

                <a href={data.url} className='text-primary hover:underline inline-flex items-center gap-1 text-sm' target='_blank'>
                    View Original
                    <ExternalLink className='size-3.5' />
                </a>

                {data.tags.length > 0 && (
                    <div className='flex flex-wrap gap-2'>
                        {data.tags.map((tag) => (
                            <Badge>{tag}</Badge>
                        ))}
                    </div>
                )}

                <Card className='border-primary/20 bg-primary/5'>
                    <CardContent>
                        <div className='flex items-start justify-between gap-4'>
                            <div className='flex-1'>
                                <h2 className='text-sm font-semibold uppercase tracking-wide text-primary mb-3'>Summary</h2>

                                {completion || data.summary ? (
                                    <MessageResponse>{completion}</MessageResponse>
                                ) : (
                                    <p className='text-muted-foreground italic'>
                                        {data.content ? 'No summary yet. Generate with AI' : 'No content available to summarise'}
                                    </p>
                                )}
                            </div>

                            {data.content && !data.summary && (
                                <Button onClick={generateSummary} disabled={isLoading} size='sm'>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className='size-4 animate-spin' />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className='mr-2 h-4 w-4' /> 
                                            Generate
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {data.content && (
                    <Collapsible open={contentOpen} onOpenChange={setContentOpen}>
                        <CollapsibleTrigger asChild>
                            <Button variant='outline' className='w-full justify-between'>
                                <span className='font-medium' >View Full Content</span>
                                <ChevronDownIcon className={cn(
                                    contentOpen ? 'rotate-180' : '',
                                    'size-4 transition-transform duration-200'
                                )} />
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <Card className='mt-2'>
                                <CardContent>
                                    <MessageResponse>
                                        {data.content}
                                    </MessageResponse>
                                </CardContent>
                            </Card>
                        </CollapsibleContent>
                    </Collapsible>
                )}

            </div>
        </div>
    )
}
