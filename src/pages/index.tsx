import React, { useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Html, OrbitControls, OrthographicCamera } from '@react-three/drei'
import { useSpring, animated } from '@react-spring/three'
import { useDrag } from '@use-gesture/react'

import rss from '@/assets/unfurl_rss.json'
import { ReactComponent as Link } from '@/assets/icons/link.svg'
import avatar from '@/assets/imgs/avatar_circle.png'

// TODO: will fixed or remove later
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const BlockPlaceholder = () => {
  return (
    <div className="article w-48 cursor-grab antialiased rounded shadow p-4">
      <div>
        <h3 className="mb-2">Lorem, ipsum.</h3>
        <p className="text-gray-300 text-xs">
          Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sed dolorem natus quas corporis
          fuga nesciunt incidunt aut enim quis ratione sunt quo neque atque sapiente, eos nostrum!
          Facere, maxime deserunt.
        </p>
      </div>
    </div>
  )
}

type BlockProps = {
  type: string
  summary: string
  url: string
  meta: {
    title: string
    description: string
    favicon: string
  }
}

const Block = (item: BlockProps) => {
  return (
    <div className="article cursor-grab antialiased rounded shadow p-8 aspect-video flex flex-col justify-between">
      <div className="w-full">
        <div className="flex items-center gap-2">
          <img src={item.meta.favicon} className="w-6 h-6" />
          <h1 className="mb-2 font-bold text-3xl text-white">{item.meta.title}</h1>
        </div>
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
          <span className="type rounded-full py-1/2 px-2 text-xs text-gray-300">{item.type}</span>
          <a href={item.url} title={item.meta.title} className="w-4 h-4 text-gray-300 text-xs">
            <Link className="w-full h-full" />
          </a>
        </div>
      </div>
    </div>
  )
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
      console.log('resolved')
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

  const [lists] = useState(new Array(30).fill(rss[0]).map((item) => item))
  console.log(lists)

  return (
    // @ts-expect-error -- https://github.com/pmndrs/use-gesture/discussions/287
    <animated.group {...spring}>
      <Html
        as="div"
        transform={true}
        occlude={true}
        ref={g}
        className="border-box grid grid-cols-3 w-screen gap-4 p-8 border border-white select-none"
      >
        {lists.map((item, i) => {
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
