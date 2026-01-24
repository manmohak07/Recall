import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { getItemsFn } from '@/data/items'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Copy, Inbox } from 'lucide-react'
import { copyToClipboard } from '../../../lib/clipboard'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { itemStatus } from '@/generated/prisma/enums'
import { zodValidator } from '@tanstack/zod-adapter'
import z from 'zod'
import { Suspense, use, useEffect, useState } from 'react'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'

const itemSearchSchema = z.object({
  q: z.string().default(''),
  status: z.union([z.literal('all'), z.nativeEnum(itemStatus)]).default('all'),
})

type ItemsSearch = z.infer<typeof itemSearchSchema>

export const Route = createFileRoute('/dashboard/items/')({
  component: RouteComponent,
  loader: () => ({ itemsPromise: getItemsFn() }),
  validateSearch: zodValidator(itemSearchSchema),
  head: () => ({
    meta: [
      {
        title: 'Saved Items',
      },
      {
        property: 'og:title',
        content: 'Saved Items'
      }
    ],
  }),
})

function ItemsGridSkeleton() {
  return (
    <div className='grid gap-6 md:grid-cols-2'>
      {[1, 2, 3, 4].map((i) => {
        return (
          <Card key={i} className='overflow-hidden pt-0'>
            <Skeleton className='aspect-video w-full' />
            <CardHeader className='space-y-3'>
              <div className='flex items-center justify-between'>
                <Skeleton className='h-5 w-20 rounded-full' />
                <Skeleton className='size-8 rounded-md' />
              </div>

              <Skeleton className='h-6 w-full' />
              <Skeleton className='h-4 w-40' />
            </CardHeader>
          </Card>
        )
      })}
    </div>
  )
}

function ItemsList({ q, status, data }: {
  q: ItemsSearch['q'], status: ItemsSearch['status'], data: ReturnType<typeof getItemsFn>
}) {
  const items = use(data)
  const filteredItems = items.filter((item) => {
    const matchesQuery = q === '' ||
      item.title?.toLowerCase().includes(q.toLowerCase()) ||
      item.tags.some((tag) => tag.toLowerCase().includes(q.toLowerCase()))

    const matchesStatus = status === 'all' || item.status === status

    return matchesQuery && matchesStatus
  })

  if (filteredItems.length === 0) {
    return (
      <Empty className='border rounded-lg h-full'>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <Inbox className='size-12' />
          </EmptyMedia>
          <EmptyTitle>
            {items.length === 0 ? 'No items saved yet' : 'No saved items found'}
          </EmptyTitle>
          <EmptyDescription>{items.length === 0 ? 'Import a url and save content' : 'No items match your filters'}</EmptyDescription>
        </EmptyHeader>
        {items.length === 0 && (
          <EmptyContent>
            <Link className={buttonVariants()} to='/dashboard/import'>Import URL</Link>
          </EmptyContent>
        )}
      </Empty>
    )
  }

  return (
    <div className='grid gap-6 md:grid-cols-2'>
      {filteredItems.map((item) => (
        <Card key={item.id} className='group overflow-hidden transition-all hover:shadow-lg pt-0'>
          <Link to='/dashboard/items/$itemId' params={{ itemId: item.id, }} className='block'>
            {item.originalImage && (
              <div className='aspect-video w-full overflow-hidden bg-muted'>
                <img
                  src={item.originalImage}
                  alt={item.title ?? 'Thumbnail?'}
                  className='h-full w-full object-cover transition-transform group-hover:scale-105' />
              </div>
            )}
            <CardHeader className='space-y-3 pt-4'>
              <div className='flex items-center justify-between gap-2'>
                <Badge variant={item.status === 'COMPLETED' ? 'default' : 'secondary'}>
                  {item.status.toLowerCase()}
                </Badge>
                <Button onClick={async (e) => {
                  e.preventDefault()
                  await copyToClipboard(item.url)
                }} variant='outline' size='icon' className='size-8 cursor-pointer'>
                  <Copy className='size-4' />
                </Button>
              </div>
              <CardTitle className='line-clamp-1 text-xl leading-snug group-hover:text-primary transition-colors'>
                {item.title}
              </CardTitle>

              {item.author && <p className='text-xs text-muted-foreground'>{item.author}</p>}
            </CardHeader>
          </Link>
        </Card>
      ))}
    </div>
  )
}

function RouteComponent() {
  const { itemsPromise } = Route.useLoaderData()
  const { status, q } = Route.useSearch()
  const [searchInput, setSearchInput] = useState(q)
  const navigate = useNavigate({ from: Route.fullPath })

  useEffect(() => {
    if (searchInput === q) {
      return;
    }

    const timeOut = setTimeout(() => {
      navigate({ search: (prev) => ({ ...prev, q: searchInput }) })
    }, 300)

    return () => clearTimeout(timeOut)
  }, [searchInput, navigate, q])

  return (
    <div className='flex flex-1 flex-col gap-6'>
      <div>
        <h1 className='text-2xl font-bold'>Saved Items</h1>
        <p className='text-muted-foreground'>Includes all the articles and blogs saved by you</p>
      </div>

      <div className='flex gap-4'>
        <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder='Title or Tag' />
        <Select value={status} onValueChange={(value) => navigate({
          search: (prev) => ({
            ...prev,
            status: value as typeof status
          })
        })}>
          <SelectTrigger className='w-40'>
            <SelectValue placeholder='Status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Status</SelectItem>
            {Object.values(itemStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Suspense fallback={<ItemsGridSkeleton />}>
        <ItemsList q={q} status={status} data={itemsPromise} />
      </Suspense>
    </div>
  )
}
