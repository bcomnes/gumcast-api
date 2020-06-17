const http = require('http')
const { createRouter } = require('./router')

const finalhandler = require('finalhandler')
const morgan = require('morgan')
const corsMw = require('cors')
const { pMiddleware } = require('p-connect')

exports.createServer = function createServer (cfg) {
  const logger = pMiddleware(morgan('dev'))
  const cors = pMiddleware(corsMw({
    origin: ['https://gumcast.com', /http:\/\/localhost/, /\.local(:[0-9])?/]
  }))
  const router = pMiddleware(createRouter(cfg))

  const server = http.createServer(handler)

  async function handler (req, res) {
    console.log(req.headers)
    const done = finalhandler(req, res, {
      onerror: (err) => { if (err.statusCode !== 404) console.log(err) },
      env: cfg.nodeEnv
    })

    try {
      await logger(req, res)
      await cors(req, res)
      await router(req, res, {})
      done()
    } catch (e) {
      done(e)
    }
  }

  return server
}
