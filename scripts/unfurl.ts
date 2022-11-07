import { unfurl } from 'unfurl.js'
import fse from 'fs-extra'
import path from 'path'

import rss from './rss.json'

const main = async () => {
  const unfurlRSS: Record<string, unknown>[] = []
  for (const item of rss) {
    const result = await unfurl(item.url)
    const unfurlItem: Record<string, unknown> = Object.assign({}, item)
    unfurlItem.meta = result
    unfurlRSS.push(unfurlItem)
  }
  fse.writeJSONSync(path.resolve(__dirname, '../src/assets/unfurl_rss.json'), unfurlRSS, { spaces: 2 })
}

main()
