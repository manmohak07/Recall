import { createMiddleware, createStart } from "@tanstack/react-start";
import { authMiddleware } from "./middlewares/auth";

const globalMiddleware = createMiddleware({ type: 'request' })
    .server(({ next, request }) => {
        const url = new URL(request.url)
        console.log(`[${request.method}] ${url.pathname}`)
        return next()
    },
)

export const startInstance = createStart(() => {
    return {
        requestMiddleware: [globalMiddleware, authMiddleware],
    }
})