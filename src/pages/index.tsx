import React, { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Vector3 } from 'three'
import { OrbitControls as OrbitControlsImpl } from 'three/examples/jsm/controls/OrbitControls'
import { Html, OrbitControls, OrthographicCamera } from '@react-three/drei'
import { useSpring, animated } from '@react-spring/three'
import { useDrag } from '@use-gesture/react'

const ArticleBlock = () => {
  const { camera, controls } = useThree()
  const orbit: OrbitControlsImpl = controls as OrbitControlsImpl
  let animating = false
  const source = useRef<{ focus: THREE.Vector3; camera: THREE.Vector3 }>({
    focus: new THREE.Vector3(),
    camera: new THREE.Vector3(),
  })
  const eps = 0.01
  const target = useRef<{ focus: THREE.Vector3; camera: THREE.Vector3 }>({
    focus: new Vector3(1, 0, 0),
    camera: new Vector3(1, 0, 5),
  })
  function damp(v, t, lambda, delta) {
    v.x = THREE.MathUtils.damp(v.x, t.x, lambda, delta)
    // v.y = THREE.MathUtils.damp(v.y, t.y, lambda, delta)
    // v.z = THREE.MathUtils.damp(v.z, t.z, lambda, delta)
  }

  function equals(a, b) {
    return Math.abs(a.x - b.x) < eps && Math.abs(a.y - b.y) < eps && Math.abs(a.z - b.z) < eps
  }
  // useFrame(({ camera }, delta) => {
  //   if (animating) {
  //     damp(source.current.focus, target.current.focus, 6, delta)
  //     damp(source.current.camera, target.current.camera, 6, delta)
  //     camera.lookAt(source.current.focus)
  //     camera.position.set(source.current.camera!.x, camera.position.y, camera.position.z)
  //     camera.updateProjectionMatrix()
  //     orbit?.target.copy(source.current.focus)
  //     orbit?.update()
  //     if (!equals(source.current.focus, target.current.focus)) {
  //       return
  //     }
  //     console.log('animated finish')
  //     animating = false
  //   }
  // })
  const handleClick = () => {
    console.log(camera.position)
    source.current.camera?.copy(camera.position)
    source.current.focus?.copy(orbit!.target)
    animating = true
  }

  return (
    <Html
      as="div"
      // follow orbit controls transform
      transform={true}
      occlude={true}
      className="w-96 cursor-grab antialiased border border-white"
    >
      <h3 onClick={handleClick} className="mb-2">
        Lorem, ipsum.
      </h3>
      <p className="text-gray-300 text-xs">
        Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sed dolorem natus quas corporis
        fuga nesciunt incidunt aut enim quis ratione sunt quo neque atque sapiente, eos nostrum!
        Facere, maxime deserunt.
      </p>
    </Html>
  )
}

// conflict with article block, should convert ArticleBlock to hooks
const Block = () => {
  return (
    <div className="w-48 cursor-grab antialiased border border-white p-4">
      <h3 className="mb-2">Lorem, ipsum.</h3>
      <p className="text-gray-300 text-xs">
        Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sed dolorem natus quas corporis
        fuga nesciunt incidunt aut enim quis ratione sunt quo neque atque sapiente, eos nostrum!
        Facere, maxime deserunt.
      </p>
    </div>
  )
}

const Articles = () => {
  const [lists] = useState(new Array(30).fill(0).map(() => 0))
  return (
    <Html
      as="div"
      transform={true}
      occlude={true}
      className="border-box flex flex-wrap w-screen gap-4 p-16 border border-white"
    >
      {lists.map((_, i) => {
        return <Block key={i} />
      })}
    </Html>
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
const DEFAULT_ZOOM = 0.2

const isClose = (pos: number, max: number, t: number) => {
  return Math.abs(pos) > max && Math.abs(pos) - max > t
}

const AttachDrag = (props: { children?: any }) => {
  const { size, viewport } = useThree()
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
  // in default z = 5, zoom = 1 / distance
  const zoom = useRef(DEFAULT_ZOOM)
  // Set the drag hook and define component movement based on gesture data
  // TODO: if drag on both x & y axis, currently is not working
  useDrag(
    ({ dragging, tap, offset: [x, y], movement: [mx], delta: [dlx, dly], direction: [dirx, diry] }) => {
      if (tap) {
        return
      }
      const rect = getBoundingClientRect()
      percent.y = rect.height / size.height
      percent.x = rect.width / size.width
      // distance = (percent - 1) * scale * (viewport.height / 2)
      const scale = DEFAULT_ZOOM / zoom.current
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

      // FIXME: drag x and drag y is confict, can't not work togther perfect!
      // x, if drag over border, bounding to right/left axis border
      // if (isClose(posx, v1.x, threshold) && !dragging) {
      //   api.start({
      //     position: [dir.x * v1.x, -y / aspect, 0],
      //   })
      //   v2.x = dir.x * v1.x * aspect
      //   console.table({ v2x: dir.x * v1.x, posx })
      // } else if (dragging) {
      //   console.table({
      //     posx,
      //     vx: v1.x,
      //     scale,
      //     percent: percent.x,
      //     viewport,
      //     aspect,
      //     size,
      //     dir: dir.x,
      //   })
      //   api.start({ position: [posx, -y / aspect, 0] })
      // }

      // y
      // if (isClose(posy, v1.y, threshold) && !dragging) {
      //   api.start({
      //     position: [x / aspect, -dir.y * v1.y, 0],
      //   })
      //   v2.y = dir.y * v1.y * aspect
      // } else if (dragging) {
      //   // console.table({ posy, vy: v1.y, scale, percent, viewport, aspect, size, dir: dir.y })
      //   api.start({ position: [x / aspect, posy, 0] })
      // }
    },
    { target: window },
  )

  useFrame(({ camera, controls, viewport }) => {
    const c = controls as unknown as OrbitControlsImpl
    zoom.current = 1 / c.target.distanceTo(c.object.position)
    const [widthHalf, heightHalf] = [size.width / 2, size.height / 2]
    const fov = camera.projectionMatrix.elements[5] * heightHalf
    // console.log(fov)
    // console.log(1 / controls.target.distanceTo( controls.object.position ))
    // const objectPos = v1.setFromMatrixPosition(el.matrixWorld)
    // const cameraPos = v2.setFromMatrixPosition(camera.matrixWorld)
    // const vFOV = (camera.fov * Math.PI) / 180
    // const dist = objectPos.distanceTo(cameraPos)
    // const scaleFOV = 2 * Math.tan(vFOV / 2) * dist
    // return 1 / scaleFOV
    // console.log(camera.zoom)
    // console.log(camera instanceof THREE.OrthographicCamera)
  })

  const [lists] = useState(new Array(30).fill(0).map(() => 0))

  return (
    // @ts-expect-error -- https://github.com/pmndrs/use-gesture/discussions/287
    <animated.group {...spring}>
      <Html
        as="div"
        transform={true}
        occlude={true}
        ref={g}
        className="border-box flex flex-wrap w-screen gap-4 p-16 border border-white select-none"
      >
        {lists.map((_, i) => {
          return <Block key={i} />
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
      {/* <OrthographicCamera makeDefault={true} /> */}
      <OrbitControls
        enableRotate={false}
        makeDefault={true}
        enableZoom={true}
        // maxZoom={1}
        // minZoom={0.5}
      />
      <AttachDrag>
        <Articles />
      </AttachDrag>
    </Canvas>
  )
}

export default Home
