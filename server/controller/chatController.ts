import { ChatService } from "../service/chatService.ts"
import type { Context } from "koa"
import { z } from "zod"

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
        message: response,
      }
    } catch (error) {
      console.error("ChatController.chat error", error)
      ctx.status = 500
      ctx.body = {
        error: "Failed to process chat request",
      }
    }
  }
}
