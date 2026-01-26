import { Button } from '@/components/ui/button'
import { useForm } from '@tanstack/react-form'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CadTitle,
} from '@/components/ui/card'
import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Link, useNavigate } from "@tanstack/react-router"
import { signupSchema } from "@/schemas/auth"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"
import { useTransition } from "react"

export function SignupForm() {
    const navigate = useNavigate()
    const [isPending, startTransition] = useTransition()
    const form = useForm({
        defaultValues: {
            fullName: '',
            email: '',
            password: '',
        },
        validators: {
            onSubmit: signupSchema,
        },
        onSubmit: ({ value }) => {
            // console.log(value);
            startTransition(async () => {
                await authClient.signUp.email(
                    {
                        name: value.fullName,
                        email: value.email,
                        password: value.password,
                        // callbackURL: '/dashboard',
                        fetchOptions: {
                            onSuccess: () => {
                                toast.success('Account created successfully!')
                                navigate({ to: '/dashboard' })
                            },
                            onError: ({ error }) => {
                                toast.error(`Error: ${error.message}`)
                            }
                        }
                    }
                )
            })
        },
    })
    return (
        <Card className="max-w-md w-full">
            <CardHeader>
                <CardTitle>Create an account</CardTitle>
                <CardDescription>
                    Enter your information below to create your account
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={(e) => {
                    e.preventDefault()
                    form.handleSubmit()
                }}>
                    <FieldGroup>
                        <form.Field
                            name="fullName"
                            children={(field) => {
                                const isInvalid =
                                    field.state.meta.isTouched && !field.state.meta.isValid
                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>Full Name</FieldLabel>
                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            aria-invalid={isInvalid}
                                            placeholder="abc xyz"
                                            autoComplete="on"
                                        />
                                        {isInvalid && (
                                            <FieldError errors={field.state.meta.errors} />
                                        )}
                                    </Field>
                                )
                            }}
                        />
                        <form.Field
                            name="email"
                            children={(field) => {
                                const isInvalid =
                                    field.state.meta.isTouched && !field.state.meta.isValid
                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            aria-invalid={isInvalid}
                                            placeholder="abc@xyz.com"
                                            type="email"
                                            autoComplete="on"
                                        />
                                        {isInvalid && (
                                            <FieldError errors={field.state.meta.errors} />
                                        )}
                                    </Field>
                                )
                            }}
                        />
                        <form.Field
                            name="password"
                            children={(field) => {
                                const isInvalid =
                                    field.state.meta.isTouched && !field.state.meta.isValid
                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            aria-invalid={isInvalid}
                                            placeholder="********"
                                            type="password"
                                            autoComplete="on"
                                        />
                                        {isInvalid && (
                                            <FieldError errors={field.state.meta.errors} />
                                        )}
                                    </Field>
                                )
                            }}
                        />
                        {/* <Field>
                            <FieldLabel htmlFor="email">Email</FieldLabel>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                            />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="password">Password</FieldLabel>
                            <Input id="password" type="password" required />
                            <FieldDescription>
                                Must be at least 8 characters long.
                            </FieldDescription>
                        </Field> */}
                        {/* <Field>
                            <FieldLabel htmlFor="confirm-password">
                                Confirm Password
                            </FieldLabel>
                            <Input id="confirm-password" type="password" required />
                            <FieldDescription>Please confirm your password.</FieldDescription>
                        </Field> */}
                        <FieldGroup>
                            <Field>
                                <Button disabled={isPending} type="submit" className="cursor-pointer">{isPending ? "Creating account..." : "Create Account"}</Button>
                                {/* <Button variant="outline" type="button">
                  Sign up with Google
                </Button> */}
                                <FieldDescription className="px-6 text-center">
                                    Already have an account? <Link to="/login">Log in</Link>
                                </FieldDescription>
                            </Field>
                        </FieldGroup>
                    </FieldGroup>
                </form>
            </CardContent>
        </Card>
    )
}
