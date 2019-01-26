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
  // let content = ''
  // let solrReq = http.request(opt, (res) => {
  //   console.log(`${opt.method} ${opt.host}:${opt.port}${opt.path}`)
  //   console.log(`Status: ${res.statusCode}`)
  //   res.setEncoding('utf8')
  //   res.on('data', (chunk) => {
  //     content += chunk
  //   });
  //   res.on('end', () => {
  //     console.log(`Size: ${content.length}`)
  //     content = JSON.parse(content)
  //   });
  // });
  // solrReq.on('error', (err) => {
  //   console.error(err)
  // });
  // solrReq.end()
  // return content

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
  const address = 'temp/data.xml';
  fs.exists(address, function (exist) {
    if (!exist) {
      try {
        fs.open(address, 'w+', function (err, fd) {
          console.log('File creation successful.');
        });
      } catch (err) {
        console.log(`File creation failed. ${err}`);
      }
    }
  });
  var conf = {};
  conf.stylesXmlFile = address;
  conf.name = "ATP";
  conf.cols = [
    {
      caption: 'id',
      type: 'string'
    },
    {
      caption: 'name',
      type: 'string'
    }
  ]
  // conf.rows = [
  //   ['2016-06-20', '16:22:31'],
  //   ['2016-06-20', '16:22:31']
  // ]
  conf.rows = data['response']['docs']
  var result = excel.execute(conf)
  return result
}

router.prefix('/api')

router.get('/', async (ctx, next) => {
  let solrData = await getSolrData()
  let result = writeExcel(solrData)
  let data = new Buffer(result, 'binary')
  ctx.type = 'application/vnd.openxmlformats'
  ctx.response.attachment('data.xlsx')
  ctx.body = data

  // ctx.type = 'application/json'
  // ctx.body = {
  //   title: 'Export Excel Service'
  // }
})

router.post('/', async (ctx, next) => {
  ctx.type = 'application/json'
  ctx.body = {
    title: 'Export Excel Service'
  }
})

module.exports = router
