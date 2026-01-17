import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createFileRoute } from '@tanstack/react-router'
import { GlobeIcon, LinkIcon, Loader2 } from 'lucide-react'
import { useForm } from '@tanstack/react-form'
import { importSchema, bulkImportSchema } from '@/schemas/import'
import { useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { scrapeURLFn } from '../../data/items'

export const Route = createFileRoute('/dashboard/import')({
  component: RouteComponent,
})

function RouteComponent() {
  // return <div>Hello "/dashboard/import"!</div>
  const [isPending, startTransition] = useTransition()
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
        await scrapeURLFn({data: value});
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
              <CardContent>
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
