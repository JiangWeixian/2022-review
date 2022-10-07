import React, { useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Vector3, Vector3Tuple } from 'three'
import { OrbitControls as OrbitControlsImpl } from 'three/examples/jsm/controls/OrbitControls'
import { Text, Html, OrbitControls, useBounds, Bounds } from '@react-three/drei'
import { useSpring } from '@react-spring/three'

type BoxProps = {
  position: Vector3Tuple
}

function Box(props: BoxProps) {
  // This reference gives us direct access to the THREE.Mesh object
  const ref = useRef<THREE.Mesh>(null)
  // Hold state for hovered and clicked events
  const [hovered, hover] = useState(false)
  const [clicked, click] = useState(false)
  // Subscribe this component to the render-loop, rotate the mesh every frame
  useFrame((_state, _delta) => (ref.current!.rotation.x += 0.01))
  // Return the view, these are regular Threejs elements expressed in JSX
  return (
    <mesh
      {...props}
      ref={ref}
      scale={clicked ? 1.5 : 1}
      onClick={(_event) => click(!clicked)}
      onPointerOver={(_event) => hover(true)}
      onPointerOut={(_event) => hover(false)}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
    </mesh>
  )
}

const ArticleBlock = () => {
  const { camera } = useThree()
  let animating = false
  const orbit = useRef<OrbitControlsImpl>(null)
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
  useFrame(({ camera }, delta) => {
    if (animating) {
      damp(source.current.focus, target.current.focus, 6, delta)
      damp(source.current.camera, target.current.camera, 6, delta)
      camera.lookAt(source.current.focus)
      camera.position.set(source.current.camera!.x, camera.position.y, camera.position.z)
      camera.updateProjectionMatrix()
      orbit.current?.target.copy(source.current.focus)
      orbit.current?.update()
      if (!equals(source.current.focus, target.current.focus)) {
        return
      }
      console.log('animated finish')
      animating = false
    }
  })
  const handleClick = () => {
    // camera.lookAt(1, 1, 5)
    // console.log(camera.position)
    // camera.position.x = 0
    // const { y, z } = camera.position
    // const x = 1
    // camera.position.set(x, y, z)
    // console.log(orbit.current?.target)
    // camera.lookAt(1, 1, 5)
    // orbit.current?.target.set(x, 0, 0)
    console.log(camera.position)
    source.current.camera?.copy(camera.position)
    source.current.focus?.copy(orbit.current!.target)
    animating = true
  }
  return (
    <>
      <OrbitControls ref={orbit as never} enableRotate={false} makeDefault={true} />
      <Html>
        <p onClick={handleClick} className="text-4xl cursor-pointer">
          hello world
        </p>
      </Html>
    </>
  )
}

const Home = () => {
  return (
    <Canvas>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <Box position={[-1.2, 0, 0]} />
      <Box position={[1.2, 0, 0]} />
      {/* <Text color="black" anchorX="center" anchorY="middle">
        hello world
      </Text> */}
      <ArticleBlock />
    </Canvas>
  )
}

export default Home
