import Koa from 'koa'
import koaCors from 'koa-cors'
import router from './server/router/index.js'

const app = new Koa()

app.use(router.routes())

// response
app.use(ctx => {
    
    ctx.body = 'Hello Koa';
  });
  
app.listen(3000);
