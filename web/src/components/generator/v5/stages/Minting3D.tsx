import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface Props {
  hash: string;
  onComplete: () => void;
}

export const Minting3D: React.FC<Props> = ({ hash, onComplete }) => {
  const coinRef = useRef<THREE.Group>(null);
  const startTime = useRef(Date.now());

  useFrame(() => {
    if (coinRef.current) {
      // Spin up
      const elapsed = (Date.now() - startTime.current) / 1000;
      coinRef.current.rotation.y += 0.1 - Math.max(0, elapsed - 2) * 0.05; // Slow down
      coinRef.current.rotation.x = Math.sin(elapsed) * 0.2;

      if (elapsed > 3.5) {
        onComplete();
      }
    }
  });

  return (
    <group ref={coinRef}>
      {/* The Paykey Coin */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 0.2, 64]} />
        <meshStandardMaterial color="#FFD700" metalness={1} roughness={0.1} emissive="#332200" />
      </mesh>

      {/* Inner Detail */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.11]}>
        <ringGeometry args={[1.2, 1.4, 64]} />
        <meshStandardMaterial color="#FFFF00" emissive="#FFFF00" emissiveIntensity={2} />
      </mesh>

      {/* Floating Hash Text */}
      <Text position={[0, -2, 0]} fontSize={0.2} color="#FFD700" anchorX="center" anchorY="middle">
        {hash}
      </Text>

      <Text
        position={[0, 0, 0.15]}
        fontSize={0.3}
        color="#000000"
        anchorX="center"
        anchorY="middle"
        rotation={[0, 0, 0]}
      >
        STRADDLE
      </Text>
    </group>
  );
};
