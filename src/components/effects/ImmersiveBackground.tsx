import { useRef, useMemo, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";

function FloatingParticles({ count = 200 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null);

  const [positions, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 15;
      sz[i] = Math.random() * 3 + 0.5;
    }
    return [pos, sz];
  }, [count]);

  useFrame((state) => {
    if (!mesh.current) return;
    const time = state.clock.elapsedTime;
    mesh.current.rotation.y = time * 0.02;
    mesh.current.rotation.x = Math.sin(time * 0.01) * 0.1;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="#B8A675"
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function NebulaClouds() {
  const group = useRef<THREE.Group>(null);
  
  const clouds = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      position: [
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 12,
        -5 - Math.random() * 10,
      ] as [number, number, number],
      scale: 2 + Math.random() * 4,
      color: i % 2 === 0 ? "#B8A675" : "#AD7A5C",
      speed: 0.1 + Math.random() * 0.2,
    }));
  }, []);

  useFrame((state) => {
    if (!group.current) return;
    const time = state.clock.elapsedTime;
    group.current.children.forEach((child, i) => {
      child.position.y += Math.sin(time * clouds[i].speed + i) * 0.001;
      child.position.x += Math.cos(time * clouds[i].speed * 0.5 + i) * 0.001;
    });
  });

  return (
    <group ref={group}>
      {clouds.map((cloud, i) => (
        <mesh key={i} position={cloud.position}>
          <sphereGeometry args={[cloud.scale, 16, 16]} />
          <meshBasicMaterial
            color={cloud.color}
            transparent
            opacity={0.03}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function LightRays() {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    const time = state.clock.elapsedTime;
    group.current.rotation.z = time * 0.01;
    group.current.children.forEach((child, i) => {
      (child as THREE.Mesh).material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      mat.opacity = 0.02 + Math.sin(time * 0.3 + i * 1.5) * 0.015;
    });
  });

  return (
    <group ref={group} position={[0, 0, -8]}>
      {Array.from({ length: 4 }, (_, i) => (
        <mesh key={i} rotation={[0, 0, (i * Math.PI) / 4 + 0.3]}>
          <planeGeometry args={[0.15, 25]} />
          <meshBasicMaterial
            color="#B8A675"
            transparent
            opacity={0.025}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

function Scene() {
  return (
    <>
      <color attach="background" args={["#141414"]} />
      <fog attach="fog" args={["#141414", 8, 30]} />
      <ambientLight intensity={0.1} />
      <Stars
        radius={20}
        depth={50}
        count={1500}
        factor={3}
        saturation={0.1}
        fade
        speed={0.5}
      />
      <FloatingParticles count={150} />
      <NebulaClouds />
      <LightRays />
    </>
  );
}

export function ImmersiveBackground() {
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: false, powerPreference: "low-power" }}
        style={{ background: "transparent" }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
