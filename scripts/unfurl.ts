import { unfurl } from 'unfurl.js'
import fse from 'fs-extra'
import path from 'path'

import rss from './rss.json'

type Item = Record<string, unknown> & {
  meta?: Record<string, unknown>
}

const main = async () => {
  const unfurlRSS: Item[] = []
  for (const item of rss) {
    const result = await unfurl(item.url)
    const unfurlItem: Item = Object.assign({}, item)
    unfurlItem.meta = result ?? {}
    unfurlItem.meta.cover =
      result.twitter_card.images?.[0]?.url || result.open_graph?.images?.[0].url
    unfurlRSS.push(unfurlItem)
  }
  fse.writeJSONSync(path.resolve(__dirname, '../src/assets/unfurl_rss.json'), unfurlRSS, {
    spaces: 2,
  })
}

main()
