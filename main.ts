import Koa from 'koa'
import koaCors from 'koa-cors'
import bodyParser from 'koa-bodyparser'
import router from './server/router/index.js'

const app = new Koa()

app.use(koaCors())
app.use(bodyParser())
app.use(router.routes())
app.use(router.allowedMethods())

app.use(ctx => {
  ctx.status = 404
  ctx.body = 'Hello Koa'
})

app.listen(3000)
