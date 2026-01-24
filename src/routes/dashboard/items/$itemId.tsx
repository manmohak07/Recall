import { MessageResponse } from '@/components/ai-elements/message'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { getItemById } from '@/data/items'
import { cn } from '@/lib/utils'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Calendar, ChevronDownIcon, Clock, ExternalLink, User } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/dashboard/items/$itemId')({
    component: RouteComponent,
    loader: ({ params }) => getItemById({
        data: {
            id: params.itemId
        }
    }),
    head: ({loaderData}) => ({
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
                        'https://images.unsplash.com/photo-1635776062043-223faf322554?q=80&w=1632&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
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

                <p>Summary here</p>

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
