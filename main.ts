import Koa from 'koa'
import koaCors from 'koa-cors'
import bodyParser from 'koa-bodyparser'
import router from './server/router/index.ts'

const app = new Koa()

// app.use(koaCors())
app.use(bodyParser())
app.use(router.routes())
app.use(router.allowedMethods())

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000')
})
