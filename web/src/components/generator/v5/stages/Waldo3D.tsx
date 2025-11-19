import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import type { GeneratorData } from '@/lib/state';

interface Props {
  data: GeneratorData;
  onComplete: () => void;
}

export const Waldo3D: React.FC<Props> = ({ data, onComplete }) => {
  const group = useRef<THREE.Group>(null);
  const [text, setText] = useState(data.customerName.toUpperCase());
  const [similarity, setSimilarity] = useState(0);

  useEffect(() => {
    const seq = async (): Promise<void> => {
      // 1. Normalize (Glitch Effect)
      for (let i = 0; i < 10; i++) {
        setText((prev) =>
          prev
            .split('')
            .map((c) =>
              Math.random() > 0.5 ? String.fromCharCode(65 + Math.floor(Math.random() * 26)) : c
            )
            .join('')
        );
        await new Promise((r) => setTimeout(r, 50));
      }
      setText(data.customerName.toUpperCase());
      await new Promise((r) => setTimeout(r, 500));

      // 2. Permute (Float variations)
      const target = data.waldoData?.matchedName || data.customerName;
      const variants = [
        `${data.customerName} JR`,
        `MR ${data.customerName}`,
        `${data.customerName.split(' ').reverse().join(', ')}`,
        target,
      ];

      for (let i = 0; i < variants.length; i++) {
        setText(variants[i]);
        await new Promise((r) => setTimeout(r, 300));
      }

      // 3. Match & Score
      setText(target);
      const scoreTarget = data.waldoData?.correlationScore || 98;
      for (let i = 0; i <= scoreTarget; i += 2) {
        setSimilarity(i);
        await new Promise((r) => setTimeout(r, 20));
      }

      await new Promise((r) => setTimeout(r, 1000));
      onComplete();
    };
    void seq();
  }, []);

  useFrame((state) => {
    if (group.current) {
      // Gentle floating
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      group.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.3) * 0.05;
    }
  });

  return (
    <group ref={group}>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        {/* Main Identity Text */}
        <Text
          font="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxK.woff" // Standard fallback font
          fontSize={0.5}
          color="#00FFFF"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#004444"
        >
          {text}
        </Text>

        {/* Similarity Score */}
        {similarity > 0 && (
          <Text
            position={[0, -0.8, 0]}
            fontSize={0.2}
            color="#00FF99"
            anchorX="center"
            anchorY="middle"
          >
            MATCH_CONFIDENCE: {similarity}%
          </Text>
        )}
      </Float>

      {/* Connection Line to Bank Record (Simulated) */}
      {similarity > 0 && (
        <mesh position={[0, -1.5, -2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 4, 8]} />
          <meshBasicMaterial color="#00FF99" transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
};
