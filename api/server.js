const http = require('http')
const { createRouter } = require('./router')

const finalhandler = require('finalhandler')
const morgan = require('morgan')
const corsMw = require('cors')
const { pMiddleware } = require('p-connect')

exports.createServer = function createServer (cfg) {
  const logger = pMiddleware(morgan('dev'))
  const whitelist = cfg.corsWhitelist
  const cors = pMiddleware(corsMw({
    origin: whitelist,
    methods: ['GET', 'POST', 'HEAD']
  }))
  const router = createRouter(cfg)
  const server = http.createServer(handler)

  async function handler (req, res) {
    const done = finalhandler(req, res, {
      onerror: errorHandler,
      env: cfg.nodeEnv
    })

    try {
      await logger(req, res)
      await cors(req, res)
      router(req, res, {}, done)
    } catch (e) {
      done(e)
    }
  }

  return server
}

function errorHandler (err) {
  if (err.statusCode !== 404) console.log(err)
}

// CORS
// https://gist.github.com/balupton/3696140
