import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createFileRoute } from '@tanstack/react-router'
import { GlobeIcon, LinkIcon, Loader2 } from 'lucide-react'
import { useForm } from '@tanstack/react-form'
import { importSchema, bulkImportSchema } from '@/schemas/import'
import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { mapUrlFn, scrapeURLFn } from '../../data/items'
import { toast } from 'sonner'
import { type SearchResultWeb } from '@mendable/firecrawl-js'
import { Checkbox } from '@/components/ui/checkbox'
import { BulkScrapeProgress, bulkScrapeURLsFn, searchWebFn } from '../../data/items'
import { Progress } from '@/components/ui/progress'

export const Route = createFileRoute('/dashboard/import')({
  component: RouteComponent,
})

function RouteComponent() {
  // return <div>Hello "/dashboard/import"!</div>
  const [isPending, startTransition] = useTransition()
  const [bulkIsPending, startBulkTransition] = useTransition()
  const [discoveredLinks, setDiscoveredLinks] = useState<Array<SearchResultWeb>>([])
  const [selectedURLs, setSelectedURLs] = useState<Set<string>>(new Set())
  const [progress, setProgress] = useState<BulkScrapeProgress | null>(null)

  function handleSelectAll() {
    if (selectedURLs.size === discoveredLinks.length) {
      setSelectedURLs(new Set());
    } else {
      setSelectedURLs(new Set(discoveredLinks.map((link) => link.url)))
    }
  }

  function handleToggleURL(url: string) {
    const freshSelect = new Set(selectedURLs);

    if (freshSelect.has(url)) {
      freshSelect.delete(url);
    } else {
      freshSelect.add(url);
    }

    setSelectedURLs(freshSelect);
  }

  function handleBulkImport() {
    startBulkTransition(async () => {
      if (selectedURLs.size === 0) {
        toast.error('Select at least one URL to proceed');
        return;
      }

      setProgress({
        completed: 0,
        total: selectedURLs.size,
        url: '',
        status: 'success',
      })

      let successCount = 0;
      let failedCount = 0;

      for await (const update of await bulkScrapeURLsFn({
        data: {
          urls: Array.from(selectedURLs)
        }
      })) {
        setProgress(update)

        if (update.status === 'success') {
          successCount++;
        } else {
          failedCount++;
        }
      }

      setProgress(null);

      if (failedCount > 0) {
        toast.success(`Imported ${successCount} URLs and ${failedCount} imports failed`)
      }
      else {
        toast.success(`Imported ${successCount} URLs`)
      }
    })
  }

  const form = useForm({
    defaultValues: {
      url: '',
    },
    validators: {
      onSubmit: importSchema,
    },
    onSubmit: ({ value }) => {
      // console.log(value);
      startTransition(async () => {
        console.log(value);
        await scrapeURLFn({ data: value });
        toast.success('URL scraped successfully!')
      })
    },
  })

  const bulkForm = useForm({
    defaultValues: {
      url: '',
      search: '',
    },
    validators: {
      onSubmit: bulkImportSchema,
    },
    onSubmit: ({ value }) => {
      // console.log(value);
      startTransition(async () => {
        console.log(value);
        const data = await mapUrlFn({ data: value });
        setDiscoveredLinks(data);
      })
    },
  })

  return (
    <div className='flex flex-1 items-center justify-center py-8'>
      <div className='w-full max-w-2xl space-y-6 px-4'>
        <div className='text-center'>
          <h1 className='text-3xl font-bold'>Import Content</h1>
          <p className='text-muted-foreground pt-1'>Save web pages to your library</p>
        </div>

        <Tabs defaultValue='single' className='w-full'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='single' className='gap-2'>
              <LinkIcon className='size-4' /> Single URL
            </TabsTrigger>
            <TabsTrigger value='bulk' className='gap-2'>
              <GlobeIcon className='size-4' /> Bulk Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value='single'>
            <Card>
              <CardHeader>
                <CardTitle>Import a Single URL</CardTitle>
                <CardDescription>Scrape and save a single web page to your library</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => {
                  e.preventDefault()
                  form.handleSubmit()
                }}>
                  <FieldGroup>
                    <form.Field
                      name="url"
                      children={(field) => {
                        const isInvalid =
                          field.state.meta.isTouched && !field.state.meta.isValid
                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel htmlFor={field.name}>URL</FieldLabel>
                            <Input
                              id={field.name}
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              aria-invalid={isInvalid}
                              placeholder="https://example.com"
                              type='url'
                              autoComplete="on"
                            />
                            {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                            )}
                          </Field>
                        )
                      }}
                    />
                    <Button type='submit' disabled={isPending} className='cursor-pointer'>
                      {isPending ? (
                        <>
                          <Loader2 className='size-4 animate-spin' />
                          Processing...
                        </>
                      ) : (
                        'Import URL'
                      )}</Button>
                  </FieldGroup>
                </form>
              </CardContent>

            </Card>
          </TabsContent>

          <TabsContent value='bulk'>
            <Card>
              <CardHeader>
                <CardTitle>Bulk Import</CardTitle>
                <CardDescription>Scrape and save multiple web pages to your library</CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <form onSubmit={(e) => {
                  e.preventDefault()
                  bulkForm.handleSubmit()
                }}>
                  <FieldGroup>
                    <bulkForm.Field
                      name="url"
                      children={(field) => {
                        const isInvalid =
                          field.state.meta.isTouched && !field.state.meta.isValid
                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel htmlFor={field.name}>URL</FieldLabel>
                            <Input
                              id={field.name}
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              aria-invalid={isInvalid}
                              placeholder="https://example.com"
                              type='url'
                              autoComplete="on"
                            />
                            {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                            )}
                          </Field>
                        )
                      }}
                    />
                    <bulkForm.Field
                      name="search"
                      children={(field) => {
                        const isInvalid =
                          field.state.meta.isTouched && !field.state.meta.isValid
                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel htmlFor={field.name}>Filter (optional)</FieldLabel>
                            <Input
                              id={field.name}
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              aria-invalid={isInvalid}
                              placeholder="e.g., blog, articles"
                              type='text'
                              autoComplete="on"
                            />
                            {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                            )}
                          </Field>
                        )
                      }}
                    />
                    <Button type='submit' disabled={isPending} className='cursor-pointer'>
                      {isPending ? (
                        <>
                          <Loader2 className='size-4 animate-spin' />
                          Processing...
                        </>
                      ) : (
                        'Import URLs'
                      )}</Button>
                  </FieldGroup>
                </form>
                {discoveredLinks.length > 0 && (
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <p className='text-sm font-medium'>
                        Found {discoveredLinks.length} URLs
                      </p>

                      <Button onClick={handleSelectAll} variant='outline' size='sm' className='cursor-pointer'>
                        {selectedURLs.size === discoveredLinks.length ? 'Deselect All ' : 'Select All'}
                      </Button>

                    </div>
                    <div className='max-h-80 space-y-2 overflow-y-auto rounded-md border p-4'>
                      {discoveredLinks.map((link) => (
                        <label key={link.url} className='hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-md p-2'>
                          <Checkbox checked={selectedURLs.has(link.url)} onCheckedChange={() => handleToggleURL(link.url)} className='mt-0.5' />
                          <div className='min-w-0 flex-1'>
                            <p className='truncate text-sm font-medium'>{link.title ?? 'Title not found'}</p>
                            <p className='text-muted-foreground truncate text-xs'>{link.description ?? 'Description not found'}</p>
                            <p className='text-muted-foreground truncate text-xs'>{link.url}</p>
                          </div>
                        </label>
                      ))}
                    </div>

                    {progress && (
                      <div className='space-y-2'>
                        <div className='flex items-center justify-between text-sm'>
                          <span className='text-muted-foreground'>
                            Importing: {progress.completed} / {progress.total}
                          </span>
                          <span className='font-medium'>
                            {Math.round(progress.completed / progress.total) * 100}
                          </span>
                        </div>
                        <Progress value={progress.completed / progress.total * 100} />
                      </div>
                    )}

                    <Button disabled={bulkIsPending} onClick={handleBulkImport} className='w-full' type='button'>{bulkIsPending ? (
                      <>
                        <Loader2 className='size-4 animate-spin' />
                        {progress ? `Importing ${progress.completed}/${progress.total}...` : 'Starting...'}
                      </>
                    ) : (
                      `Import ${selectedURLs.size} URLs`
                    )}</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
