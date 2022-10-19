import React, { useRef, useState } from 'react'
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
  const [lists] = useState(new Array(10).fill(0).map(() => 0))
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

const v1 = new THREE.Vector2(0, 0)
const v2 = new THREE.Vector2(0, 0)
const dir = new THREE.Vector2(0, 0)
let friction = 1
let threshold = 1
const DEFAULT_ZOOM = 0.2

const AttachDrag = (props: { children?: any }) => {
  const { size, viewport } = useThree()
  const [, drag] = useState(false)
  const aspect = size.width / viewport.width
  const maxX = viewport.width
  const [spring, api] = useSpring(() => ({
    position: [0, 0, 0],
  }))
  // in default z = 5, zoom = 1 / distance
  const zoom = useRef(DEFAULT_ZOOM)
  // Set the drag hook and define component movement based on gesture data
  // FIXME: currently bounding only working on outside border is align to browser viewpoint, maybe related to zoom value
  // TODO: bounding effect should also working on axis y
  // TODO: if drag on both x & y axis, currently is not working
  useDrag(
    ({ dragging, offset: [x, y], movement: [mx], delta: [dlx], direction: [dirx] }) => {
      const scale = DEFAULT_ZOOM / zoom.current
      v1.x = maxX / scale
      threshold = 1 * scale
      drag(!!dragging)
      const lastPosx = v2.x / aspect
      if (Math.abs(lastPosx) > v1.x && Math.abs(lastPosx) - v1.x > threshold && dragging) {
        friction = Math.abs(lastPosx) - v1.x
      }
      if (!dragging) {
        friction = 1
      }
      if (dragging) {
        // far from border, hard to move
        v2.x += dlx * (1 / friction)
        // looks like bugs: dirx something reset to zero
        dir.x = dirx || dir.x
      }
      const posx = v2.x / aspect
      // if drag over border, bounding to right/left axis border
      if (Math.abs(posx) > v1.x && Math.abs(posx) - v1.x > threshold && !dragging) {
        api.start({
          position: [dir.x * v1.x, -y / aspect, 0],
        })
        v2.x = dir.x * v1.x * aspect
      } else if (dragging) {
        console.log(viewport, size, posx, zoom.current)
        api.start({ position: [posx, -y / aspect, 0] })
      }
    },
    { target: window },
  )

  useFrame(({ camera, controls, viewport }) => {
    const c = controls as unknown as OrbitControlsImpl
    zoom.current = 1 / c.target.distanceTo(c.object.position)
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

  return (
    // @ts-expect-error -- https://github.com/pmndrs/use-gesture/discussions/287
    <animated.group {...spring}>{props.children}</animated.group>
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
