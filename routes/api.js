const router = require('koa-router')()
const http = require('http')

let getSolrData = () => {
  let opt = {
    method: 'GET',
    host: 'localhost',
    port: 8983,
    path: '/solr/shen_sample/select?q=*:*&rows=1&wt=json'
  };
  let solrReq = http.request(opt, (res) => {
    console.log(`${opt.method} ${opt.host}:${opt.port}${opt.path}`)
    console.log(`Status: ${res.statusCode}`)
    res.setEncoding('utf8')
    let content = ''
    res.on('data', (chunk) => {
      content += chunk
    });
    res.on('end', () => {
      console.log(`Size: ${content.length}`)
      return JSON.parse(content)
    });
  });
  solrReq.on('error', (err) => {
    console.error(err)
  });
  solrReq.end()
}

let writeExcel = (data) => {

}

router.prefix('/api')

router.get('/', async (ctx, next) => {
  let data = getSolrData()
  await ctx.render('index', {
    title: 'Export Excel Service'
  })
})

router.post('/', async (ctx, next) => {
  ctx.type = 'application/json'
  ctx.body = {
    title: 'Export Excel Service'
  }
})

module.exports = router
