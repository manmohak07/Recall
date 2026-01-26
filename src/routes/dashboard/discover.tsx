import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { createFileRoute } from '@tanstack/react-router'
import { Loader2, Search, Sparkles } from 'lucide-react'
import { useForm } from "@tanstack/react-form"
import { searchSchema } from "@/schemas/import"
import { useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { BulkScrapeProgress, bulkScrapeURLsFn, searchWebFn } from '../../data/items'
import { SearchResultWeb } from '@mendable/firecrawl-js'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Progress } from '@/components/ui/progress'


export const Route = createFileRoute('/dashboard/discover')({
  component: RouteComponent,
})

function RouteComponent() {
  const [isPending, startTransition] = useTransition()
  const [searchResults, setSearchResults] = useState<Array<SearchResultWeb>>([])
  const [selectedURLs, setSelectedURLs] = useState<Set<string>>(new Set())
  const [progress, setProgress] = useState<BulkScrapeProgress | null>(null)
  const [bulkIsPending, startBulkTransition] = useTransition()

  function handleSelectAll() {
    if (selectedURLs.size === searchResults.length) {
      setSelectedURLs(new Set());
    } else {
      setSelectedURLs(new Set(searchResults.map((link) => link.url)))
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
      searchQuery: '',
    },
    validators: {
      onSubmit: searchSchema,
    },
    onSubmit: ({ value }) => {
      // console.log(value);
      startTransition(async () => {
        // console.log(value);
        const res = await searchWebFn({
          data: {
            searchQuery: value.searchQuery,
          },
        })

        setSearchResults(res)
      })
    },
  })
  return (
    <div className='flex flex-1 items-center justify-center py-8'>
      <div className='w-full max-w-2xl space-y-6 px-4'>
        <div className='text-center'>
          <h1 className='text-3xl font-bold'>Discover</h1>
          <p className='text-muted-foreground pt-2'>Search the web for articles</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-3'>
              <Sparkles className='size-5 text-primary' /> Topic Search
            </CardTitle>
            <CardDescription>
              Search the web for content and import articles, blogs, etc. of your choice
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            <form onSubmit={(e) => {
              e.preventDefault()
              form.handleSubmit()
            }}>
              <FieldGroup>
                <form.Field
                  name="searchQuery"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>Search Query</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder="e.g. Spring AI Tutorial"
                          autoComplete="on"
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    )
                  }}
                />


                <Button disabled={isPending} type="submit" className="cursor-pointer">
                  {isPending ? (
                    <>
                      <Loader2 className='size-4 animate-spin' /> Searching...
                    </>
                  ) : (
                    <>
                      <Search className='size-4' /> Search Web
                    </>
                  )}
                </Button>

              </FieldGroup>

            </form>
            {searchResults.length > 0 && (
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <p className='text-sm font-medium'>
                    Found {searchResults.length} URLs
                  </p>

                  <Button onClick={handleSelectAll} variant='outline' size='sm' className='cursor-pointer'>
                    {selectedURLs.size === searchResults.length ? 'Deselect All ' : 'Select All'}
                  </Button>

                </div>
                <div className='max-h-80 space-y-2 overflow-y-auto rounded-md border p-4'>
                  {searchResults.map((link) => (
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
      </div>
    </div>
  )
}
