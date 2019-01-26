const router = require('koa-router')()
const http = require('http')
const fs = require('fs')
const excel = require('excel-export')

let getSolrData = () => {
  const opt = {
    method: 'GET',
    host: 'localhost',
    port: 8983,
    path: '/solr/shen_sample/select?q=*:*&rows=1&wt=json'
  };
  return new Promise((resolve, reject) => {
    let req = http.request(opt, function (res) {
      console.log(`${opt.method} ${opt.host}:${opt.port}${opt.path}`)
      console.log(`Status: ${res.statusCode}`)
      res.setEncoding('utf8')
      let content = ''
      res.on('data', function (chunk) {
        content += chunk
      });
      res.on('end', function () {
        resolve(JSON.parse(content))
      });
    });
    req.on('error', (err) => {
      console.error(err)
    });
    req.end()
  })
}

let writeExcel = (data) => {
  const columns = ['id', 'name']
  const address = 'temp/data.xml'
  fs.exists(address, function (exist) {
    if (!exist) {
      try {
        fs.open(address, 'w+', function (err, fd) {
          console.log('File creation successful.')
        });
      } catch (err) {
        console.log(`File creation failed. ${err}`)
      }
    }
  });
  let conf = {}
  conf.stylesXmlFile = address
  conf.name = "ATP"
  let cols = []
  for (let column in columns) {
    cols.push({
      caption: columns[column],
      type: 'string'
    })
  }
  conf.cols = cols
  let rows = []
  let docRow = []
  for (let doc in data['response']['docs']) {
    docRow = []
    for (let column in columns) {
      docRow.push(columns[column] in data['response']['docs'][doc] ? data['response']['docs'][doc][columns[column]].toString() : '')
    }
    rows.push(docRow)
  }
  conf.rows = rows
  let result = excel.execute(conf)
  return result
}

router.prefix('/api')

router.get('/', async (ctx, next) => {
  ctx.type = 'application/json'
  ctx.body = {
    title: 'Export Excel Service'
  }
})

router.post('/', async (ctx, next) => {
  let solrData = await getSolrData()
  let result = writeExcel(solrData)
  let data = new Buffer(result, 'binary')
  ctx.type = 'application/vnd.openxmlformats'
  ctx.response.attachment('data.xlsx')
  ctx.body = data
})

module.exports = router
