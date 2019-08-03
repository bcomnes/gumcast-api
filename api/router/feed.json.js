const { hashRoute } = require('p-connect')
const parseurl = require('parseurl')
const qs = require('qs')
const { getJsonfeed } = require('../product-jsonfeed')
const { getProducts } = require('../gumroad-client')
const { validationFailed, apiErrorHandler } = require('./helpers')

module.exports = cfg => hashRoute(jsonfeed(cfg))
function jsonfeed (cfg) {
  function validate (query) {
    if (!query) return 'Missing querystring'
    if (!query.access_token) return 'Missing access_token'
    if (!query.refresh_token) return 'Missing refresh_token'
    if (!query.purchase_id) return 'Missing purchase_id'
    return null
  }

  return async (req, res) => {
    res.setHeader('content-type', 'application/json')
    const url = parseurl(req)
    const query = qs.parse(url.query)
    const invalidMsg = validate(query)
    if (invalidMsg) return validationFailed(res, invalidMsg)

    try {
      const purchasedItems = await getProducts({
        access_token: query.access_token,
        refresh_token: query.refresh_token,
        mobile_token: cfg.mobile_token,
        mobileApiUrl: cfg.mobileApiUrl
      })

      const params = qs.stringify({
        access_token: query.access_token,
        refresh_token: query.refresh_token,
        purchase_id: query.purchase_id
      })

      const jf = getJsonfeed(purchasedItems, {
        purchase_id: query.purchase_id,
        feed_url: `https://${cfg.hostname}/feed.json?${params}`
      })

      res.statusCode = 200
      const resBody = JSON.stringify(jf)
      res.setHeader('Content-Length', Buffer.byteLength(resBody, 'utf8'))
      return res.end(resBody)
    } catch (e) {
      return apiErrorHandler(req, res, e)
    }
  }
}
