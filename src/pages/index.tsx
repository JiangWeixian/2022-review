import React, { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Vector3Tuple } from 'three'

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

const Home = () => {
  return (
    <Canvas>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <Box position={[-1.2, 0, 0]} />
      <Box position={[1.2, 0, 0]} />
    </Canvas>
  )
}

export default Home
