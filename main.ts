import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import router from './server/router/index.ts'
import cors from '@koa/cors';

const app = new Koa()

app.use(cors())
app.use(bodyParser())
app.use(router.routes())
app.use(router.allowedMethods())

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000')
})
