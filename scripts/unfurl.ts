import { unfurl } from 'unfurl.js'
import fse from 'fs-extra'
import path from 'path'
import colors from 'picocolors'

import rss from './rss.json'

type Item = Record<string, unknown> & {
  meta?: Record<string, unknown>
}

const type2size = {
  twitter_share: [1, 2],
  iframe: [2, 2],
}

const main = async () => {
  const unfurlRSS: Item[] = []
  for (const item of rss) {
    const result = await unfurl(item.url)
    const unfurlItem: Item = Object.assign({}, item)
    console.log(`${colors.bgGreen(colors.black(` unfurling: `))} ${item.url}`)
    unfurlItem.meta = result ?? {}
    unfurlItem.meta.title = result.title ?? (result.twitter_card?.title || result.open_graph?.title)
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
