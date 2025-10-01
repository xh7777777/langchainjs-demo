import Router from 'koa-router'

const chat = new Router()

chat.get('/chat', async (ctx) => {
  ctx.body = 'Hello World'
})

const router = new Router()
router.use(chat.routes()).use(chat.allowedMethods());

export default router