import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Html, OrbitControls, OrthographicCamera } from '@react-three/drei'
import { useSpring, animated } from '@react-spring/three'
import { useDrag } from '@use-gesture/react'
import clsx from 'clsx'
import Markdownit from 'markdown-it'
import { annotate } from 'rough-notation'

import rss from '@/assets/unfurl_rss.json'
import { ReactComponent as Link } from '@/assets/icons/link.svg'
import avatar from '@/assets/imgs/avatar_circle.png'

const md = new Markdownit()

type BlockProps = {
  type: string
  tag: string
  summary: string
  url: string
  pos?: [number[], number[]]
  props?: Record<string, any>
  meta: {
    title: string
    description: string
    favicon: string
    cover: string
    creator: string
  }
  className?: string
}

const Block = ({
  pos,
  ...props
}: React.PropsWithChildren<Pick<BlockProps, 'className' | 'pos'>>) => {
  const style: React.CSSProperties = useMemo(() => {
    if (!pos) {
      return {}
    }
    const [rows, cols] = pos
    return {
      gridRowStart: rows[0],
      gridRowEnd: rows[1],
      gridColumnStart: cols[0],
      gridColumnEnd: cols[1],
    }
  }, [pos])
  return (
    <div
      className={clsx(
        'article relative cursor-grab antialiased rounded shadow p-8 pb-4',
        props.className,
      )}
      style={style}
    >
      {props.children}
    </div>
  )
}

// TODO: should merge with ref block
const CommentsBlock = (item: BlockProps) => {
  return (
    <Block className="flex flex-col justify-between" pos={item.pos}>
      <div className="w-full">
        <h1 title={item.meta.title} className="flex gap-3 mb-2">
          {item.meta.favicon && (
            <img src={item.meta.favicon} className="w-6 h-6 mix-blend-lighten pt-1" />
          )}
          <p className="font-bold text-white line-clamp-2">{item.meta.title}</p>
        </h1>
        <p className="text-gray-400 text-xs">{item.meta.description}</p>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex gap-2 text-gray-500">
          <span className="w-6 h-6 inline-block flex-0">
            <img src={avatar} className="w-full h-full" />
          </span>
          <p className="text-xs inline-block flex-1">{item.summary}</p>
        </div>
        <div className="w-full flex justify-between items-center opacity-70 hover:opacity-90">
          <span className="type rounded-full py-1/2 px-2 text-xs text-gray-300">{item.tag}</span>
          <a href={item.url} title={item.meta.title} className="w-4 h-4 text-gray-300 text-xs">
            <Link className="w-full h-full" />
          </a>
        </div>
      </div>
    </Block>
  )
}

const TwitterShareBlock = (item: BlockProps) => {
  const { comment, gradient, horizontal } = item.props ?? {}
  const useComment = comment ?? true
  const useGradient = gradient ?? !item.meta.cover
  const useImage = !useGradient
  return (
    <Block
      className={clsx('p-0 pb-0 flex overflow-hidden', {
        'flex-row': !!horizontal,
        'flex-col': !horizontal,
      })}
      pos={item.pos}
    >
      <div
        className={clsx('w-auto p-8 bg-cover relative', {
          'bg-gradient-to-r from-violet-500 to-fuchsia-500': useGradient,
          'h-full aspect-square': !!horizontal,
        })}
        style={{ backgroundImage: useImage ? `url(${item.meta.cover})` : undefined }}
      >
        {useImage && (
          <div className="absolute top-0 left-0 bottom-0 right-0 bg-gradient-to-r from-black via-black/75 to-transparent z-0" />
        )}
        <h1 className="mb-2 font-bold text-3xl text-white font-carter drop-shadow">
          {item.meta.title}
        </h1>
        <p className="text-gray-400 text-xs italic z-1 relative">{item.meta.description}</p>
      </div>
      <div className="flex flex-1 flex-col justify-between py-4">
        <div className="flex flex-col gap-2 text-white px-8">
          <div className="flex flex-col gap-2">
            <span className="w-6 h-6 inline-block flex-0 font-carter underline">
              {useComment ? '@summary' : item.meta.creator}
            </span>
            <div
              // FIXME: how to display more content
              className="prose prose-invert prose-sm line-clamp-[8]"
              dangerouslySetInnerHTML={{ __html: md.render(item.summary) }}
            />
          </div>
        </div>
        <div className="w-full px-8 flex flex-0 h-4 justify-between items-center justify-self-end opacity-70 hover:opacity-90">
          <span className="type rounded-full py-1/2 px-2 text-xs text-gray-300">{item.tag}</span>
          <a href={item.url} title={item.meta.title} className="w-4 h-4 text-gray-300 text-xs">
            <Link className="w-full h-full" />
          </a>
        </div>
      </div>
    </Block>
  )
}

const BgBlock = (item: BlockProps) => {
  return (
    <Block className="flex flex-col justify-end overflow-hidden" pos={item.pos}>
      <div
        className="w-full h-full absolute top-0 left-0 z-0 flex justify-center items-center bg-cover"
        style={{ backgroundImage: `url(${item.meta.cover})` }}
      />
      <div className="w-full flex justify-between items-center opacity-70 hover:opacity-90 mix-blend-exclusion">
        <span className="type rounded-full py-1/2 px-2 text-xs text-gray-300">{item.tag}</span>
        <a href={item.url} title={item.meta.title} className="w-4 h-4 text-gray-300 text-xs">
          <Link className="w-full h-full" />
        </a>
      </div>
    </Block>
  )
}

const RefBlock = (item: BlockProps) => {
  const { category, image } = item.props ?? {}
  return (
    <Block className="flex flex-row overflow-hidden p-0 pb-0" pos={item.pos}>
      {image && (
        <div
          className={clsx('bg-cover aspect-video')}
          style={{ backgroundImage: `url(${item.meta.cover})` }}
        />
      )}
      <div className="w-full flex flex-col justify-center px-8 py-4">
        <div className="w-full flex-1 flex flex-col justify-center items-start">
          <span className="text-xs uppercase bg-opacity-10 text-center max-w-fit px-2 py-1 font-bold tracking-wide bg-pink-500 text-pink-500 flex gap-2 mb-2">
            {category}
          </span>
          <h1
            title={item.meta.title}
            className="font-bold text-xl text-white overflow-hidden line-clamp-2 mb-2"
          >
            {item.meta.title || item.url}
          </h1>
          {item.summary ? (
            <div className="flex gap-2 text-gray-500">
              <span className="w-6 h-6 inline-block flex-0">
                <img src={avatar} className="w-full h-full" />
              </span>
              <p className="text-xs inline-block flex-1">{item.summary}</p>
            </div>
          ) : (
            <p className="text-gray-400 text-xs">{item.meta.description}</p>
          )}
        </div>
        <div className="w-full flex flex-0 justify-between items-center opacity-70 hover:opacity-90 mix-blend-exclusion">
          <span className="type rounded-full py-1/2 px-2 text-xs text-gray-300">{item.tag}</span>
          <a href={item.url} title={item.meta.title} className="w-4 h-4 text-gray-300 text-xs">
            <Link className="w-full h-full" />
          </a>
        </div>
      </div>
    </Block>
  )
}

const IframeBlock = (item: BlockProps) => {
  return (
    <Block className="flex flex-col overflow-hidden" pos={item.pos}>
      <iframe className="w-full h-full" src={item.url} />
      <div className="w-full flex flex-col justify-end absolute left-0 bottom-0 h-32 p-8 pb-4 bg-gradient-to-t from-gray-900 via-gray-800 to-transparent">
        <p className="w-full flex justify-between items-center mix-blend-exclusion">
          <span className="type rounded-full py-1/2 px-2 text-xs text-gray-300">{item.tag}</span>
          <a href={item.url} title={item.meta.title} className="w-4 h-4 text-gray-300 text-xs">
            <Link className="w-full h-full" />
          </a>
        </p>
      </div>
    </Block>
  )
}

const AnnouncementBlock = (item: BlockProps) => {
  const ref = useRef<HTMLHeadingElement>(null)
  const { shape = 'highlight' } = item.props ?? {}
  useEffect(() => {
    if (!ref.current) {
      return
    }
    const annotation = annotate(ref.current!, {
      type: shape,
      brackets: ['right', 'left'],
      color: 'rgb(192 132 252)',
    })
    annotation.show()
  }, [ref, shape])
  return (
    <Block className="flex flex-col justify-between" pos={item.pos}>
      <div className="flex flex-1 justify-center items-center">
        <h1 ref={ref} className="mb-2 capitalize font-bold text-7xl text-white">
          {item.meta.title}
        </h1>
      </div>
      <div className="flex flex-col gap-4">
        <div className="w-full flex justify-between items-center opacity-70 hover:opacity-90">
          <span className="type rounded-full py-1/2 px-2 text-xs text-gray-300">{item.tag}</span>
          <a href={item.url} title={item.meta.title} className="w-4 h-4 text-gray-300 text-xs">
            <Link className="w-full h-full" />
          </a>
        </div>
      </div>
    </Block>
  )
}

const components = {
  comment: CommentsBlock,
  bg: BgBlock,
  twitter_share: TwitterShareBlock,
  iframe: IframeBlock,
  reference: RefBlock,
  announcement: AnnouncementBlock,
}

/**
 * max drag distance [width, height] of box
 */
const v1 = new THREE.Vector2(0, 0)
/**
 * current drag distance of [width, height] of box
 */
const v2 = new THREE.Vector2(0, 0)
const dir = new THREE.Vector2(0, 0)
const percent = new THREE.Vector2(0, 0)
let friction = 1
const threshold = 0.1
const DEFAULT_ZOOM = 40

const isClose = (pos: number, max: number, t: number) => {
  return Math.abs(pos) > max && Math.abs(pos) - max > t
}

const AttachDrag = () => {
  const { size, viewport, camera } = useThree()
  const [, drag] = useState(false)
  const aspect = size.width / viewport.width
  const bounding = useRef<boolean | null>(false)
  const [spring, api] = useSpring(() => ({
    position: [0, 0, 0],
    onRest: () => {
      // console.log('resolved')
      bounding.current = null
    },
  }))
  const g = useRef<HTMLDivElement>(null)
  const getBoundingClientRect = () => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
    return g.current?.getBoundingClientRect()!
  }
  // Set the drag hook and define component movement based on gesture data
  useDrag(
    ({ dragging, tap, delta: [dlx, dly] }) => {
      if (tap) {
        return
      }
      const rect = getBoundingClientRect()
      percent.y = rect.height / size.height
      percent.x = rect.width / size.width
      // distance = (percent - 1) * scale * (viewport.height / 2)
      const scale = DEFAULT_ZOOM / camera.zoom
      v1.x = Math.abs(percent.x - 1) * scale * (viewport.width / 2)
      v1.y = Math.abs(percent.y - 1) * scale * (viewport.height / 2)
      // threshold = 1 * scale
      drag(!!dragging)
      const lastPosx = v2.x / aspect
      if (isClose(lastPosx, v1.x, 2) && dragging) {
        friction = Math.abs(lastPosx) - v1.x
      }
      if (!dragging) {
        friction = 1
      }
      if (dragging) {
        // far from border, hard to move
        v2.x += dlx * (1 / friction)
        v2.y += dly * (1 / friction)
      }
      // looks like bugs: dirx sometimes reset to zero
      dir.x = v2.x < 0 ? -1 : 1
      dir.y = v2.y < 0 ? -1 : 1
      const posx = v2.x / aspect
      const posy = -v2.y / aspect
      const isoverx = isClose(posx, v1.x, threshold)
      const isovery = isClose(posy, v1.y, threshold)

      if ((isoverx || isovery) && !dragging) {
        bounding.current = true
        if (isoverx && !isovery) {
          api.start({
            position: [dir.x * v1.x, posy, 0],
          })
          v2.x = dir.x * v1.x * aspect
        }
        if (!isoverx && isovery) {
          api.start({
            position: [posx, -dir.y * v1.y, 0],
          })
          v2.y = dir.y * v1.y * aspect
        }
        if (isoverx && isovery) {
          api.start({
            position: [dir.x * v1.x, -dir.y * v1.y, 0],
          })
          v2.x = dir.x * v1.x * aspect
          v2.y = dir.y * v1.y * aspect
        }
        // console.table({ v2x: dir.x * v1.x, posx })
      } else if (dragging) {
        bounding.current = bounding.current === null ? false : bounding.current
        // console.table({
        //   posx,
        //   vx: v1.x,
        //   scale,
        //   percent: percent.x,
        //   viewport,
        //   aspect,
        //   size,
        //   dir,
        // })
        api.start({ position: [posx, posy, 0] })
      }
    },
    { target: window },
  )

  const [lists] = useState(rss)

  return (
    // @ts-expect-error -- https://github.com/pmndrs/use-gesture/discussions/287
    <animated.group {...spring}>
      <Html
        as="div"
        transform={true}
        occlude={true}
        ref={g}
        className="articles-layout border-box grid grid-cols-6 gap-4 p-8 select-none"
      >
        {lists.map((item, i) => {
          const Block: any = components[item.type as keyof typeof components]
          return <Block key={i} {...item} />
        })}
      </Html>
    </animated.group>
  )
}

const Home = () => {
  return (
    <Canvas>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      {/* set enableRotate: true for detail debug */}
      <OrthographicCamera makeDefault={true} position={[0, 0, 5]} zoom={DEFAULT_ZOOM} />
      <OrbitControls
        enableRotate={false}
        makeDefault={true}
        enableZoom={true}
        maxZoom={60}
        minZoom={DEFAULT_ZOOM}
      />
      <AttachDrag />
    </Canvas>
  )
}

export default Home
