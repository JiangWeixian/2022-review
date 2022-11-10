import { unfurl } from 'unfurl.js'
import fse from 'fs-extra'
import path from 'path'
import colors from 'picocolors'

import rss from './rss.json'
import cached from '../src/assets/unfurl_rss.json'
import type { Metadata } from 'unfurl.js/dist/types'

type Item = Record<string, unknown> & {
  type: string
  meta?: Record<string, unknown>
}

const type2size = {
  twitter_share: [1, 2],
  iframe: [2, 2],
}

const isInvalid = (prev: Item, current: Item) => {
  if (!prev?.meta) {
    return true
  }
  if (prev?.type === current?.type) {
    return true
  }
  return false
}

const main = async () => {
  const unfurlRSS: Item[] = []
  for (const item of rss) {
    const cachedItem = cached.find((i) => i.url === item.url) as unknown as Item
    let result = cachedItem?.meta as unknown as Metadata
    if (isInvalid(cachedItem, item)) {
      console.log(`${colors.bgBlue(colors.black(` unfurling: `))} ${item.url}`)
      result = await unfurl(item.url)
    } else {
      console.log(`${colors.bgGreen(colors.black(` unfurling: `))} ${item.url}`)
    }
    const unfurlItem: Item = Object.assign({}, item)
    unfurlItem.meta = result ?? {}
    unfurlItem.meta.title =
      item.title ?? result.title ?? (result.twitter_card?.title || result.open_graph?.title)
    unfurlItem.meta.cover =
      result.twitter_card?.images?.[0]?.url || result.open_graph?.images?.[0].url
    // TODO: calucate pos based on item.size
    if (type2size[item.type]) {
      unfurlItem.size = type2size[item.type]
    }
    unfurlRSS.push(unfurlItem)
  }
  fse.writeJSONSync(path.resolve(__dirname, '../src/assets/unfurl_rss.json'), unfurlRSS, {
    spaces: 2,
  })
}

main()
