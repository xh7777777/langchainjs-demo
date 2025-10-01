import { ChatService } from "../service/chatService"
import { Context } from "koa"

export class chatController {
    constructor(chatService: ChatService) {}

    async chat(ctx: Context) {
        // const { message } = ctx.request.body
        // const response = await this.chatService.chat(message)
        // ctx.body = response
    }
}