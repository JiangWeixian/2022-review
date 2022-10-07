import React, { useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { Vector3Tuple } from 'three'
import { OrbitControls, useBounds, Bounds } from '@react-three/drei'

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
  // useFrame((_state, _delta) => (ref.current!.rotation.x += 0.01))
  // Return the view, these are regular Threejs elements expressed in JSX
  return (
    <mesh
      {...props}
      ref={ref}
      // scale={clicked ? 1.5 : 1}
      // onClick={(_event) => click(!clicked)}
      // onPointerOver={(_event) => hover(true)}
      // onPointerOut={(_event) => hover(false)}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
    </mesh>
  )
}

function SelectToZoom({ children }) {
  const api = useBounds()
  return (
    <group
      onClick={(e) => (e.stopPropagation(), e.delta <= 2 && api.refresh(e.object).fit())}
      onPointerMissed={(e) => e.button === 0 && api.refresh().fit()}
    >
      {children}
    </group>
  )
}

const Home = () => {
  return (
    <Canvas camera={{ position: [0, -10, 80], fov: 50 }} dpr={[1, 2]}>
      <spotLight position={[-100, -100, -100]} intensity={0.2} angle={0.3} penumbra={1} />
      <hemisphereLight color="white" groundColor="#ff0f00" position={[-7, 25, 13]} intensity={1} />
      <Bounds fit clip observe margin={1.2}>
        <SelectToZoom>
          <Box position={[-1.2, 0, 0]} />
          <Box position={[1.2, 0, 0]} />
        </SelectToZoom>
      </Bounds>
      <OrbitControls
        enableRotate={false}
        makeDefault
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 1.75}
      />
    </Canvas>
  )
}

export default Home
