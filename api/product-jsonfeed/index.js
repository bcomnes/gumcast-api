/* eslint-disable camelcase */
const url = require('url')
const jsonfeedToRSS = require('jsonfeed-to-rss')
const striptags = require('striptags')
const trimRight = require('trim-right')
const trimLeft = require('trim-left')

exports.getPurchace = getPurchace
function getPurchace (data, purchaseId) {
  return data.products.find(p => p['purchase_id'] === purchaseId)
}

exports.productsWithFileData = productsWithFileData
function productsWithFileData (data) {
  return data.products.filter(p => p['file_data'].length > 0)
}

exports.getProductPermalink = getProductPermalink
function getProductPermalink (product) {
  const downloadURL = product['file_data'][0].download_url
  const u = new url.URL(downloadURL)
  console.log(u.pathname.split('/'))
  const permalinkId = u.pathname.split('/')[5]
  return `https://gumroad.com/d/${permalinkId}`
}

const gumroadFaviconSvg = 'https://assets.gumroad.com/assets/logo-70cc6d4c5ab29be1bae97811585bc664524cd99897327ec47a67a76a6f69be91.svg'
// const gumroadFavicon = 'https://gumroad.com/favicon.ico'

exports.getJsonfeed = getJsonfeed
function getJsonfeed (data, opts = {}) {
  const {
    purchase_id: purchaseId,
    feed_url
  } = opts
  const product = getPurchace(data, purchaseId)
  if (!product) throw new Error('purchace_id not found')
  const home_page_url = getProductPermalink(product)

  const jsonfeed = {
    version: 'https://jsonfeed.org/version/1',
    title: product.name,
    home_page_url,
    feed_url,
    description: trimRight(trimLeft(striptags(product.description))),
    user_comment: `Feed generated and delivered by gumcast.com`,
    icon: product.preview_url || gumroadFaviconSvg,
    favicon: gumroadFaviconSvg,
    author: {
      name: product.creator_name,
      avatar: product.preview_url
    },
    _itunes: {
      expired: !product.file_data,
      block: true
      // new_feed_url, TODO: for refresh token?,
    },
    expired: !product.file_data,
    items: product.file_data
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map((item, i) => ({
        id: item.id,
        url: home_page_url,
        title: item.name_displayable,
        content_text: item.name_displayable,
        image: product.preview_url,
        banner_image: product.preview_url,
        date_published: item.created_at,
        attachments: [{
          url: item.download_url,
          mime_type: `${item.filegroup}/${item.filetype}`,
          title: item.name_displayable,
          size_in_bytes: item.size
        }],
        _itunes: {
          episode: i
        }
      }))
  }

  return jsonfeed
}

exports.getRssFeed = getRssFeed
function getRssFeed (data, opts = {}) {
  const jf = getJsonfeed(data, opts)
  return jsonfeedToRSS(jf)
}