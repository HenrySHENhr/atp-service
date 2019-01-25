const router = require('koa-router')()

router.prefix('/export')

router.get('/', async (ctx, next) => {
  await ctx.render('index', {
    title: 'Export Excel Service'
  })
})

router.post('/', async (ctx, next) => {
  ctx.type = 'application/json';
  ctx.body = {
    title: 'Export Excel Service'
  }
})

module.exports = router
