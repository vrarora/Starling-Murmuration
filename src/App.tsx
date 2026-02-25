import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Sky } from '@react-three/drei';
import { Boids } from './components/Boids';
import { useHandTracking } from './hooks/useHandTracking';
import { useRef } from 'react';
import * as THREE from 'three';
import { Leva, useControls } from 'leva';

function HandIndicator({ targetRef, isFistRef }: { targetRef: React.RefObject<THREE.Vector3 | null>, isFistRef: React.RefObject<boolean> }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(() => {
    if (meshRef.current && materialRef.current) {
      if (targetRef.current) {
        meshRef.current.position.copy(targetRef.current);
        meshRef.current.visible = true;
        
        if (isFistRef.current) {
          meshRef.current.scale.setScalar(0.5);
          materialRef.current.color.setHex(0xffaa00);
        } else {
          meshRef.current.scale.setScalar(1.0);
          materialRef.current.color.setHex(0xff4444);
        }
      } else {
        meshRef.current.visible = false;
      }
    }
  });

  return (
    <mesh ref={meshRef} visible={false}>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshBasicMaterial ref={materialRef} color="#ff4444" wireframe />
    </mesh>
  );
}

export default function App() {
  const { targetRef, videoRef, isReady, error, isFistRef } = useHandTracking();

  const boidParams = useControls({
    separation: { value: 3.0, min: 0, max: 5, step: 0.1 },
    alignment: { value: 0.8, min: 0, max: 5, step: 0.1 },
    cohesion: { value: 0.4, min: 0, max: 5, step: 0.1 },
    swirlStrength: { value: 2.0, min: 0, max: 10, step: 0.1 },
    maxSpeed: { value: 0.15, min: 0.05, max: 0.5, step: 0.01 },
    maxForce: { value: 0.005, min: 0.001, max: 0.05, step: 0.001 },
    neighborDist: { value: 2.0, min: 0.5, max: 5.0, step: 0.1 },
    desiredSeparation: { value: 1.5, min: 0.1, max: 3.0, step: 0.1 },
    targetPull: { value: 0.6, min: 0, max: 5, step: 0.1 },
  });

  return (
    <div 
      className="w-full h-screen relative overflow-hidden"
      style={{
        background: 'linear-gradient(to bottom, #add0e2 0%, #fdeabe 45%, #eababa 60%, #503c3c 100%)'
      }}
    >
      <Leva 
        collapsed={false} 
        theme={{
          colors: {
            elevation1: 'rgba(0, 0, 0, 0.2)',
            elevation2: 'rgba(0, 0, 0, 0.3)',
            elevation3: 'rgba(0, 0, 0, 0.4)',
            accent1: '#ffffff',
            accent2: '#f0f0f0',
            accent3: '#e0e0e0',
            highlight1: '#ffffff',
            highlight2: '#f0f0f0',
            highlight3: '#e0e0e0',
            vivid1: '#ffffff',
            folderWidgetColor: '#ffffff',
            folderTextColor: '#ffffff',
            toolTipBackground: 'rgba(0,0,0,0.8)',
            toolTipText: '#ffffff',
          },
          radii: {
            xs: '4px',
            sm: '8px',
            lg: '16px',
          },
        }}
      />
      {/* Video element for MediaPipe and preview */}
      <video
        ref={videoRef}
        className="absolute bottom-6 right-6 w-64 h-48 object-cover rounded-xl border border-white/10 shadow-lg scale-x-[-1] z-10"
        playsInline
        muted
      />

      <div className="absolute top-8 left-8 z-10 text-white font-sans pointer-events-none">
        <h1 className="text-4xl font-light tracking-tight text-white/90">Starling Murmuration</h1>
        <p className="text-[10px] font-bold tracking-[0.25em] text-white/60 mt-2 uppercase">
          Interactive Boid Simulation
        </p>
        {error && (
          <p className="text-red-400 text-xs mt-6 max-w-sm">
            {error}
          </p>
        )}
      </div>

      <Canvas camera={{ position: [0, 0, 30], fov: 60 }}>
        <fog attach="fog" args={['#eababa', 20, 60]} />
        <ambientLight intensity={0.6} color="#fdeabe" />
        <directionalLight position={[0, 5, -10]} intensity={2.5} color="#ffeedd" />
        <Environment preset="sunset" />
        
        {/* Sun */}
        <group position={[0, 0, -40]}>
          <mesh>
            <circleGeometry args={[0.6, 32]} />
            <meshBasicMaterial color="#ffffff" fog={false} />
          </mesh>
          <mesh position={[0, 0, -0.1]}>
            <circleGeometry args={[1.5, 32]} />
            <meshBasicMaterial color="#fdeabe" transparent opacity={0.4} fog={false} />
          </mesh>
        </group>
        
        <Boids targetRef={targetRef} isFistRef={isFistRef} params={boidParams} />
        <HandIndicator targetRef={targetRef} isFistRef={isFistRef} />
        
        <OrbitControls enablePan={false} enableZoom={true} />
      </Canvas>
    </div>
  );
}
