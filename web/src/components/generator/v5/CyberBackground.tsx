import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Custom shader for a "Digital Rain" / Cyber-grid background
// Optimized for performance (single draw call)

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float iTime;
  uniform vec3 iColor;
  varying vec2 vUv;

  // Random function
  float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  void main() {
      vec2 uv = vUv;
      
      // Grid effect
      float gridScale = 40.0;
      vec2 gridUv = fract(uv * gridScale);
      vec2 gridId = floor(uv * gridScale);
      
      // Random digital rain drops
      float dropSpeed = 2.0 + random(vec2(gridId.x, 0.0)) * 3.0;
      float dropPos = fract(iTime * 0.5 * dropSpeed + random(vec2(gridId.x, 1.0)));
      
      // Trail effect
      float trail = smoothstep(0.0, 1.0, (1.0 - distance(gridUv.y, dropPos)));
      trail *= step(gridUv.y, dropPos); // Only trail behind
      
      // Hex character simulation (just pixel noise)
      float charNoise = step(0.5, random(vec2(gridId.x, gridId.y + floor(iTime * 10.0))));
      
      float alpha = trail * charNoise * 0.5;
      
      // Base grid glow
      float gridLine = step(0.95, gridUv.x) + step(0.95, gridUv.y);
      alpha += gridLine * 0.05;

      // Vignette
      float vig = 1.0 - distance(uv, vec2(0.5)) * 1.2;
      
      vec3 finalColor = iColor * alpha;
      gl_FragColor = vec4(finalColor, alpha * vig);
  }
`;

export const CyberBackground: React.FC = () => {
  const mesh = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(
    () => ({
      iTime: { value: 0 },
      iColor: { value: new THREE.Color('#00FFFF') },
    }),
    []
  );

  useFrame((state) => {
    if (mesh.current) {
      uniforms.iTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={mesh} position={[0, 0, -10]} scale={[30, 30, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        fragmentShader={fragmentShader}
        vertexShader={vertexShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
};
