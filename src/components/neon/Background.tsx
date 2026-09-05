"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Stars } from "@react-three/drei";
import type { Mesh } from "three";

function NeonRings() {
  const ring1 = useRef<Mesh>(null);
  const ring2 = useRef<Mesh>(null);
  const ring3 = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ring1.current) ring1.current.rotation.z = t * 0.12;
    if (ring2.current) ring2.current.rotation.z = -t * 0.09;
    if (ring3.current) ring3.current.rotation.z = t * 0.05;
  });
  return (
    <group position={[2.6, 1.2, -4]} rotation={[0.4, 0.2, 0]}>
      <mesh ref={ring1}>
        <torusGeometry args={[2.4, 0.012, 12, 140]} />
        <meshBasicMaterial color="#22d3ee" toneMapped={false} />
      </mesh>
      <mesh ref={ring2} scale={1.35}>
        <torusGeometry args={[2.4, 0.01, 12, 140]} />
        <meshBasicMaterial color="#e879f9" toneMapped={false} />
      </mesh>
      <mesh ref={ring3} scale={1.8}>
        <torusGeometry args={[2.4, 0.008, 12, 140]} />
        <meshBasicMaterial color="#a3e635" toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function Background() {
  return (
    <div className="fixed inset-0 z-0 opacity-60" aria-hidden>
      <Canvas camera={{ position: [0, 0, 6], fov: 55 }} dpr={[1, 1.5]}>
        <Stars radius={40} depth={30} count={900} factor={2.2} fade speed={0.6} />
        <Float speed={1.1} rotationIntensity={0.25} floatIntensity={0.5}>
          <NeonRings />
        </Float>
      </Canvas>
    </div>
  );
}
