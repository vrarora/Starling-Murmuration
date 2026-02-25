import * as THREE from 'three';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';

const BOID_COUNT = 800;

class Boid {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  acceleration: THREE.Vector3;
  phase: number;

  constructor(maxSpeed: number) {
    this.position = new THREE.Vector3(
      (Math.random() - 0.5) * 80,
      (Math.random() - 0.5) * 40,
      (Math.random() - 0.5) * 80
    );
    this.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    ).normalize().multiplyScalar(maxSpeed);
    this.acceleration = new THREE.Vector3();
    this.phase = Math.random() * Math.PI * 2;
  }
}

type BoidParams = {
  separation: number;
  alignment: number;
  cohesion: number;
  swirlStrength: number;
  maxSpeed: number;
  maxForce: number;
  neighborDist: number;
  desiredSeparation: number;
  targetPull: number;
};

export function Boids({ targetRef, isFistRef, params }: { targetRef: React.RefObject<THREE.Vector3 | null>, isFistRef: React.RefObject<boolean>, params: BoidParams }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const currentParams = useRef({
    separation: params.separation,
    cohesion: params.cohesion,
    targetPull: params.targetPull,
    swirlStrength: params.swirlStrength
  });

  const boids = useMemo(() => {
    return Array.from({ length: BOID_COUNT }, () => new Boid(params.maxSpeed));
  }, []); // Intentionally not depending on maxSpeed so they don't reset

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Pre-allocate vectors to avoid garbage collection in the loop
  const diff = useMemo(() => new THREE.Vector3(), []);
  const steer = useMemo(() => new THREE.Vector3(), []);
  const centerSteer = useMemo(() => new THREE.Vector3(), []);
  const separationVec = useMemo(() => new THREE.Vector3(), []);
  const alignmentVec = useMemo(() => new THREE.Vector3(), []);
  const cohesionVec = useMemo(() => new THREE.Vector3(), []);
  const swirlVec = useMemo(() => new THREE.Vector3(), []);
  const targetPos = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const time = state.clock.elapsedTime;
    const target = targetRef.current;
    const isFist = isFistRef.current;
    
    // Target parameters based on gesture
    const targetSeparation = isFist ? 1.0 : params.separation;
    const targetCohesion = isFist ? 1.5 : params.cohesion;
    const targetTargetPull = isFist ? 1.5 : params.targetPull;
    const targetSwirlStrength = isFist ? params.swirlStrength * 0.5 : params.swirlStrength;

    // Smoothly interpolate parameters
    const lerpFactor = 5.0 * delta;
    currentParams.current.separation += (targetSeparation - currentParams.current.separation) * lerpFactor;
    currentParams.current.cohesion += (targetCohesion - currentParams.current.cohesion) * lerpFactor;
    currentParams.current.targetPull += (targetTargetPull - currentParams.current.targetPull) * lerpFactor;
    currentParams.current.swirlStrength += (targetSwirlStrength - currentParams.current.swirlStrength) * lerpFactor;

    const { separation, cohesion, targetPull, swirlStrength } = currentParams.current;
    const { maxSpeed, maxForce, neighborDist, desiredSeparation, alignment } = params;
    const neighborDistSq = neighborDist * neighborDist;
    const desiredSeparationSq = desiredSeparation * desiredSeparation;

    for (let i = 0; i < BOID_COUNT; i++) {
      const boid = boids[i];
      
      separationVec.set(0, 0, 0);
      alignmentVec.set(0, 0, 0);
      cohesionVec.set(0, 0, 0);
      let total = 0;

      for (let j = 0; j < BOID_COUNT; j++) {
        if (i === j) continue;
        const other = boids[j];
        
        const dSq = boid.position.distanceToSquared(other.position);

        if (dSq > 0 && dSq < neighborDistSq) {
          alignmentVec.add(other.velocity);
          cohesionVec.add(other.position);
          
          if (dSq < desiredSeparationSq) {
            diff.subVectors(boid.position, other.position);
            const d = Math.sqrt(dSq);
            diff.normalize().divideScalar(d);
            separationVec.add(diff);
          }
          total++;
        }
      }

      if (total > 0) {
        alignmentVec.divideScalar(total).normalize().multiplyScalar(maxSpeed).sub(boid.velocity).clampLength(0, maxForce);
        cohesionVec.divideScalar(total).sub(boid.position).normalize().multiplyScalar(maxSpeed).sub(boid.velocity).clampLength(0, maxForce);
        separationVec.divideScalar(total);
        if (separationVec.lengthSq() > 0) {
          separationVec.normalize().multiplyScalar(maxSpeed).sub(boid.velocity).clampLength(0, maxForce * 1.5);
        }
      }

      boid.acceleration.add(separationVec.multiplyScalar(separation));
      boid.acceleration.add(alignmentVec.multiplyScalar(alignment));
      boid.acceleration.add(cohesionVec.multiplyScalar(cohesion));

      // Wavy swirly motion (Flow field based on time and position)
      swirlVec.set(
        Math.sin(time * 0.5 + boid.position.y * 0.1) + Math.cos(time * 0.3 + boid.position.z * 0.05),
        Math.cos(time * 0.4 + boid.position.z * 0.1) + Math.sin(time * 0.6 + boid.position.x * 0.05),
        Math.sin(time * 0.6 + boid.position.x * 0.1) + Math.cos(time * 0.4 + boid.position.y * 0.05)
      );
      swirlVec.normalize().multiplyScalar(maxSpeed).sub(boid.velocity).clampLength(0, maxForce * swirlStrength);
      boid.acceleration.add(swirlVec);

      if (target) {
        steer.subVectors(target, boid.position);
        const d = steer.length();
        if (d > 0) {
          steer.normalize().multiplyScalar(maxSpeed * targetPull).sub(boid.velocity).clampLength(0, maxForce * 2.5);
          boid.acceleration.add(steer);
        }
      } else {
        centerSteer.set(0, 0, 0).sub(boid.position);
        centerSteer.normalize().multiplyScalar(maxSpeed).sub(boid.velocity).clampLength(0, maxForce * 0.1);
        boid.acceleration.add(centerSteer);
      }

      // Boundary wrapping
      const limitX = 40;
      const limitY = 20;
      const limitZ = 40;
      if (boid.position.x < -limitX) boid.position.x = limitX;
      if (boid.position.x > limitX) boid.position.x = -limitX;
      if (boid.position.y < -limitY) boid.position.y = limitY;
      if (boid.position.y > limitY) boid.position.y = -limitY;
      if (boid.position.z < -limitZ) boid.position.z = limitZ;
      if (boid.position.z > limitZ) boid.position.z = -limitZ;

      boid.velocity.add(boid.acceleration);
      boid.velocity.clampLength(0, maxSpeed);
      boid.position.add(boid.velocity);
      boid.acceleration.set(0, 0, 0);

      dummy.position.copy(boid.position);
      targetPos.addVectors(boid.position, boid.velocity);
      dummy.lookAt(targetPos);
      
      // Smooth flying animations: Banking and Flapping
      const bank = -boid.velocity.x * 3.0;
      dummy.rotateZ(bank);
      
      // Rotate the cone so it points along the velocity vector
      dummy.rotateX(Math.PI / 2);
      
      // Flapping animation based on speed
      const flapSpeed = 20 + (boid.velocity.length() / maxSpeed) * 15;
      const flap = Math.sin(time * flapSpeed + boid.phase);
      dummy.scale.set(1 + flap * 0.3, 1, 1 + flap * 0.1);
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, BOID_COUNT]}>
      <coneGeometry args={[0.12, 0.4, 4]} />
      <meshPhysicalMaterial 
        color="#1a1a20" 
        roughness={0.4} 
        metalness={0.8} 
        iridescence={1.0} 
        iridescenceIOR={1.5} 
        iridescenceThicknessRange={[100, 400]} 
      />
    </instancedMesh>
  );
}
