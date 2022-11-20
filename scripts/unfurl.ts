import { unfurl } from 'unfurl.js'
import fse from 'fs-extra'
import path from 'path'
import colors from 'picocolors'
import { fetch } from 'ofetch'

import rss from './rss.json'
import cached from '../src/assets/unfurl_rss.json'
import type { Metadata } from 'unfurl.js/dist/types'

type Item = Record<string, unknown> & {
  url: string
  id: number
  type: string
  meta?: Partial<Metadata> & { cover?: string; creator?: string }
  pos: number[][]
  props: {
    horizontal: true
    image: true
  }
}

/**
 * @description if item card type changed, re-unfurl meta info
 */
const isInvalid = (prev: Item, current: Item) => {
  // force update
  // return true
  if (!prev?.meta) {
    return true
  }
  if (prev?.type !== current?.type) {
    return true
  }
  return false
}

const defaultType2SizeMap = {
  twitter_share: [2, 1],
  iframe: [2, 2],
  comment: [1, 1],
  reference: [1, 1],
  bg: [1, 1],
  announcement: [1, 1],
}

const type2size = (item: Item) => {
  const type = item.type as unknown as keyof typeof defaultType2SizeMap
  if (type === 'twitter_share') {
    return item.props?.horizontal ? [1, 2] : defaultType2SizeMap[type]
  }
  if (type === 'reference') {
    return item.props?.image ? [1, 2] : defaultType2SizeMap[type]
  }
  return defaultType2SizeMap[type]
}

const calc = (rows = 2, cols = 6, items: Item[] = []) => {
  const createRow = (): number[] => new Array(cols).fill(0)
  const grids: number[][] = []
  const fill = (rs: number, cs: number, r = 1, c = 1, index = 0) => {
    for (let i = 0; i < r; i++) {
      for (let j = 0; j < c; j++) {
        grids[rs + i][cs + j] = index + 1
      }
    }
  }
  const validate = (rs: number, cs: number, r = 1, c = 1) => {
    const subgrids: number[] = []
    for (let i = 0; i < r; i++) {
      for (let j = 0; j < c; j++) {
        subgrids.push(grids[rs + i][cs + j])
      }
    }
    return subgrids.every((v) => v === 0)
  }
  const isFullFill = (row: number[] = []) => {
    return row.every((v) => v !== 0)
  }
  // init grid
  for (let i = 0; i < rows; i++) {
    grids.push(createRow())
  }
  // search valid grid from pos [r, c]
  const pos = {
    r: 0,
    c: 0,
  }
  for (const [index, item] of items.entries()) {
    const [rs, cs] = type2size(item)
    let i = pos.r
    let j = pos.c
    let found = false
    console.log(`${colors.bgBlue(colors.black(`[${item.week}-${item.id}] calcing: `))} ${item.url}`)
    while (!found && i < grids.length && j < grids[0].length) {
      // start from grid[i][j] = 0
      while (grids[i][j] !== 0 && j < grids[0].length) {
        // console.log(item.id, i, j)
        j += 1
      }
      if (rs * cs === 1) {
        if (j < grids[0].length && validate(i, j, 1, 1)) {
          fill(i, j, 1, 1, index)
          // console.log(item.id, grids)
          // pos.c += 2
          found = true
        } else {
          j += 1
        }
      } else if (rs * cs === 4) {
        if (i < grids.length - 1 && j < grids[0].length - 1 && validate(i, j, 2, 2)) {
          fill(i, j, 2, 2, index)
          // console.log(item.id, grids)
          // pos.c += 2
          found = true
        } else {
          j += 1
        }
      } else if (rs === 2) {
        if (i < grids.length - 1 && validate(i, j, 2)) {
          fill(i, j, 2, 1, index)
          // console.log(item.id, grids)
          // pos.c += 1
          found = true
        } else {
          j += 1
        }
      } else if (cs === 2) {
        if (j < grids[0].length - 1 && validate(i, j, 1, 2)) {
          fill(i, j, 1, 2, index)
          // console.log(item.id, grids)
          // pos.c += 2
          found = true
        } else {
          j += 1
        }
      }
      if (found) {
        console.log(
          `${colors.bgGreen(colors.black(`[${item.week}-${item.id}] calc: `))} ${item.url}`,
        )
        item.pos = [
          [i + 1, i + 1 + rs],
          [j + 1, j + 1 + cs],
        ]
      }
      if (isFullFill(grids[i])) {
        grids.push(createRow())
        pos.r += 1
        pos.c = 0
        i = pos.r
        j = pos.c
      } else if (i >= grids.length || j >= grids[0].length) {
        grids.push(createRow())
        i += 1
        j = 0
      }
    }
  }
}

const main = async () => {
  const unfurlRSS: Item[] = []
  const _rss = rss.slice() as unknown as Item[]
  for (const [id, item] of _rss.entries()) {
    item.id = id + 1
    const cachedItem = cached.find((i) => i.url === item.url) as unknown as Item
    let result = cachedItem?.meta as unknown as Item['meta']
    // validte cache
    if (isInvalid(cachedItem, item)) {
      console.log(`${colors.bgBlue(colors.black(`[${item.week}] unfurling: `))} ${item.url}`)
      try {
        result = await unfurl(item.url)
        if (result.favicon) {
          const isDeadLink = await fetch(result.favicon)
            .then((res) => res.status !== 200)
            .catch(() => true)
          if (isDeadLink) {
            result.favicon = undefined
          }
        }
      } catch (e) {
        console.log(
          `${colors.bgRed(colors.black(`[${item.week}] unfurling failed: `))} ${item.url}`,
        )
      }
    } else {
      console.log(`${colors.bgGreen(colors.black(`[${item.week}] unfurling: `))} ${item.url}`)
    }
    const unfurlItem = Object.assign({}, item)
    result = result ?? {}
    unfurlItem.meta = result
    unfurlItem.meta.title = (item.title ??
      result.title ??
      (result.twitter_card?.title || result.open_graph?.title)) as string
    unfurlItem.meta.cover =
      result.cover ?? (result.twitter_card?.images?.[0]?.url || result.open_graph?.images?.[0].url)
    unfurlItem.meta.creator = result.twitter_card?.creator
    delete unfurlItem.meta.twitter_card
    delete unfurlItem.meta.open_graph
    delete unfurlItem.meta.keywords
    delete unfurlItem.meta.oEmbed
    unfurlRSS.push(unfurlItem)
  }
  calc(2, 6, unfurlRSS)
  fse.writeJSONSync(path.resolve(__dirname, '../src/assets/unfurl_rss.json'), unfurlRSS, {
    spaces: 2,
  })
}

main()
