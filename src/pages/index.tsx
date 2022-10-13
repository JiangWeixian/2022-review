import React, { useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Vector3 } from 'three'
import { OrbitControls as OrbitControlsImpl } from 'three/examples/jsm/controls/OrbitControls'
import { Html, OrbitControls } from '@react-three/drei'
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
    <>
      {/* follow orbit controls transform */}
      <Html as="div" transform={true} occlude={true} className="w-96 cursor-grab antialiased">
        <h3 onClick={handleClick} className="mb-2">
          Lorem, ipsum.
        </h3>
        <p className="text-gray-300 text-xs">
          Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sed dolorem natus quas corporis
          fuga nesciunt incidunt aut enim quis ratione sunt quo neque atque sapiente, eos nostrum!
          Facere, maxime deserunt.
        </p>
      </Html>
    </>
  )
}

const AttachDrag = (props: { children?: any }) => {
  const { size, viewport } = useThree()
  const [, drag] = useState(false)
  const aspect = size.width / viewport.width
  const [spring, api] = useSpring(() => ({ position: [0, 0, 0] }))
  // Set the drag hook and define component movement based on gesture data
  useDrag(
    ({ active, offset: [x, y] }) => {
      drag(active)
      api.start({ position: [x / aspect, -y / aspect, 0] })
    },
    { target: window },
  )

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
      <OrbitControls
        enableRotate={false}
        makeDefault={true}
        enableZoom={true}
        enableDamping={false}
      />
      <AttachDrag>
        <ArticleBlock />
      </AttachDrag>
    </Canvas>
  )
}

export default Home
