import Router from 'koa-router'
import { ChatController } from '../controller/chatController.ts'
import { ChatService } from '../service/chatService.ts'

const chatService = new ChatService()
const chatController = new ChatController(chatService)

const chatRouter = new Router({ prefix: '/chat' })

chatRouter.post('/', chatController.chat.bind(chatController))

const router = new Router()
router.use(chatRouter.routes()).use(chatRouter.allowedMethods())

export default router
