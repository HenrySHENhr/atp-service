const router = require('koa-router')()
const http = require('http')
const fs = require('fs')
const excel = require('excel-export')

let getSolrData = (query) => {
  return new Promise((resolve, reject) => {
    let req = http.get(query, function (res) {
      console.log(`GET ${query}`)
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
      resolve()
    });
    req.end()
  })
}

let writeExcel = (data, columns) => {
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
  try {
    let body = ctx.request.body
    let query = JSON.parse(body)['query']
    let columns = JSON.parse(body)['columns']
    if (!query || query == '' || !columns || columns == '') {
      ctx.status = 404;
      ctx.body = {
        message: 'Please provide Solr query and excel columns.'
      };
    } else {
      let solrData = await getSolrData(query)
      if (!solrData || solrData == '') {
        console.log('Solr connection error.')
        ctx.status = 500;
        ctx.body = {
          message: 'Solr connection error.'
        };
      } else {
        let result = writeExcel(solrData, columns)
        let data = new Buffer(result, 'binary')
        ctx.type = 'application/vnd.openxmlformats'
        ctx.response.attachment('data.xlsx')
        ctx.body = data
      }
    }
  } catch (err) {
    console.error(err.stack)
    ctx.status = err.statusCode || err.status || 500;
    ctx.body = {
      message: err.message
    };
  }
})

module.exports = router
