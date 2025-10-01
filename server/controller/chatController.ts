import { PassThrough } from "node:stream"
import type { Context } from "koa"
import { z } from "zod"
import { ChatService } from "../service/chatService.ts"

const chatRequestSchema = z.object({
  message: z.string().min(1, "message must not be empty"),
})

export class ChatController {
  private readonly chatService: ChatService
  constructor(chatService: ChatService) {
    this.chatService = chatService
  }

  async chat(ctx: Context) {
    const parsedBody = chatRequestSchema.safeParse(ctx.request.body)

    if (!parsedBody.success) {
      ctx.status = 400
      ctx.body = {
        error: "Invalid request payload",
        details: parsedBody.error.flatten(),
      }
      return
    }

    try {
      const response = await this.chatService.chat(parsedBody.data.message)
      ctx.status = 200
      ctx.body = {
        reply: response,
      }
    } catch (error) {
      console.error("ChatController.chat error", error)
      ctx.status = 500
      ctx.body = {
        error: "Failed to process chat request",
      }
    }
  }

  async stream(ctx: Context) {
    const parsedBody = chatRequestSchema.safeParse(ctx.request.body)

    if (!parsedBody.success) {
      ctx.status = 400
      ctx.body = {
        error: "Invalid request payload",
        details: parsedBody.error.flatten(),
      }
      return
    }

    ctx.set("Content-Type", "text/event-stream")
    ctx.set("Cache-Control", "no-cache")
    ctx.set("Connection", "keep-alive")

    const stream = new PassThrough()
    ctx.status = 200
    ctx.body = stream

    if (typeof ctx.res.flushHeaders === "function") {
      ctx.res.flushHeaders()
    }

    stream.write(`:ok\n\n`)

    let closed = false
    const closeHandler = () => {
      closed = true
      stream.end()
    }

    ctx.req.on("close", closeHandler)

    const writeChunk = (data: string, event?: string) => {
      if (closed) return
      const lines = data.split(/\r?\n/)
      const payload = lines.map((line) => `data: ${line}`).join("\n")
      const prefix = event ? `event: ${event}\n` : ""
      stream.write(`${prefix}${payload}\n\n`)
    }

    let generator: AsyncGenerator<string, void, unknown> | null = null
    try {
      generator = await this.chatService.stream(parsedBody.data.message)
      for await (const chunk of generator) {
        if (closed) break
        writeChunk(chunk)
      }
      if (!closed) {
        writeChunk("[DONE]")
      }
    } catch (error) {
      console.error("ChatController.stream error", error)
      if (!closed) {
        writeChunk("Failed to process chat stream", "error")
      }
    } finally {
      if (generator && typeof generator.return === "function") {
        try {
          await generator.return(undefined)
        } catch (returnError) {
          console.error("ChatController.stream cleanup error", returnError)
        }
      }
      if (!closed) {
        closeHandler()
      }
      ctx.req.removeListener("close", closeHandler)
    }
  }
}
