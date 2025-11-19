import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Instance, Instances, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { GeneratorData } from '@/lib/state';

// Type definition for the proxy object returned by <Instance />
// Drei's Instance component mimics an Object3D but patches direct color/scale access
interface DreiInstance extends THREE.Object3D {
  color: THREE.Color;
}

interface Props {
  data: GeneratorData;
  onComplete: (h: string) => void;
}

export const Blake3D: React.FC<Props> = ({ data, onComplete }) => {
  const blocksRef = useRef<THREE.Group>(null);

  // Data Sources (Inputs)
  // 1. Identity
  // 2. Risk/Review
  // 3. Bank Data

  const inputNodes = useMemo(
    () => [
      { x: -4, y: -2, z: 0, type: 'IDENTITY', label: data.customerName.toUpperCase() },
      { x: 0, y: -2, z: 0, type: 'RISK_MODEL', label: 'RISK_CHECK: PASS' },
      { x: 4, y: -2, z: 0, type: 'BANK_DATA', label: `ACCT ****${data.accountLast4}` },
    ],
    [data]
  );

  // Tree Structure (Merkle Tree above inputs)
  const treeNodes = useMemo(
    () => [
      // Layer 1 (Aggregators)
      { x: -2, y: 0, z: 0, level: 1 },
      { x: 2, y: 0, z: 0, level: 1 },
      // Layer 2 (Root)
      { x: 0, y: 2, z: 0, level: 2 },
    ],
    []
  );

  const allInstances = useMemo(() => {
    return [
      ...inputNodes.map((n, i) => ({ ...n, isInput: true, index: i })),
      ...treeNodes.map((n, i) => ({ ...n, isInput: false, index: i + 3 })),
    ];
  }, [inputNodes, treeNodes]);

  useFrame((state) => {
    if (blocksRef.current) {
      // Gentle hover
      blocksRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
    }

    // Sequence Logic
    const time = state.clock.elapsedTime;
    if (time > 6.0) {
      onComplete('758c519d.02.c16f91');
    }
  });

  return (
    <group ref={blocksRef} scale={0.8}>
      {/* Render Blocks */}
      <Instances range={100}>
        <boxGeometry args={[1.5, 0.8, 0.8]} />
        <meshStandardMaterial color="#00FFFF" emissive="#004444" roughness={0.2} metalness={0.8} />

        {allInstances.map((node, i) => (
          <Block key={i} {...node} />
        ))}
      </Instances>
      {/* Render Labels for Inputs */}
      {inputNodes.map((node, i) => (
        <group key={`label-${i}`} position={[node.x, node.y - 1, node.z]}>
          <Text fontSize={0.3} color="#00FFFF" anchorX="center" anchorY="top">
            {node.type}
          </Text>
          <Text
            position={[0, -0.4, 0]}
            fontSize={0.2}
            color="#FFFFFF"
            anchorX="center"
            anchorY="top"
            fillOpacity={0.6}
          >
            {node.label}
          </Text>
        </group>
      ))}
      {/* Visual Connections (Beams) */}
      <DataBeam start={[-4, -1.6, 0]} end={[-2, -0.4, 0]} delay={1} /> {/* Identity -> Left Agg */}
      <DataBeam start={[0, -1.6, 0]} end={[-2, -0.4, 0]} delay={1.5} /> {/* Risk -> Left Agg */}
      <DataBeam start={[0, -1.6, 0]} end={[2, -0.4, 0]} delay={1.5} /> {/* Risk -> Right Agg */}
      <DataBeam start={[4, -1.6, 0]} end={[2, -0.4, 0]} delay={2} /> {/* Bank -> Right Agg */}
      <DataBeam start={[-2, 0.4, 0]} end={[0, 1.6, 0]} delay={3.5} /> {/* Left Agg -> Root */}
      <DataBeam start={[2, 0.4, 0]} end={[0, 1.6, 0]} delay={3.5} /> {/* Right Agg -> Root */}
    </group>
  );
};

interface BlockProps {
  x: number;
  y: number;
  z: number;
  isInput?: boolean;
  index: number;
  level: number;
}

const Block: React.FC<BlockProps> = ({ x, y, z, isInput = false, index, level }) => {
  const ref = useRef<DreiInstance>(null);

  useFrame((state) => {
    if (!ref.current) {
      return;
    }

    const time = state.clock.elapsedTime;

    // Activation Timing
    let activateTime = 0;
    if (isInput) {
      activateTime = 0.5 + index * 0.5;
    } // Inputs light up sequentially
    else {
      activateTime = 3.0 + level * 1.5;
    } // Tree lights up up later

    const isActive = time > activateTime;

    if (isActive) {
      // Pulse effect
      const pulse = Math.sin((time - activateTime) * 10) * 0.1 + 1;
      ref.current.scale.setScalar(pulse);

      if (!isInput && level === 2) {
        ref.current.color.setHex(0xffd700); // Gold Root
      } else if (!isInput) {
        ref.current.color.setHex(0xff0099); // Magenta Nodes
      } else {
        ref.current.color.setHex(0x00ffff); // Cyan Inputs
      }
    } else {
      ref.current.color.setHex(0x333333);
      ref.current.scale.setScalar(0.9);
    }
  });

  return <Instance ref={ref} position={[x, y, z]} />;
};

// Animated Beam Component
const DataBeam: React.FC<{
  start: [number, number, number];
  end: [number, number, number];
  delay: number;
}> = ({ start, end, delay }) => {
  const ref = useRef<THREE.Mesh>(null);
  const curve = useMemo(
    () => new THREE.LineCurve3(new THREE.Vector3(...start), new THREE.Vector3(...end)),
    [start, end]
  );

  useFrame((state) => {
    if (!ref.current) {
      return;
    }
    const time = state.clock.elapsedTime;

    if (time > delay) {
      // "Shoot" particle along line
      const progress = (time - delay) * 2; // Speed
      if (progress < 1) {
        const pos = curve.getPoint(progress);
        ref.current.position.copy(pos);
        ref.current.visible = true;
        ref.current.scale.setScalar(1);
      } else {
        // Arrived
        ref.current.visible = false;
      }
    } else {
      ref.current.visible = false;
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshBasicMaterial color="#FFFFFF" />
    </mesh>
  );
};
