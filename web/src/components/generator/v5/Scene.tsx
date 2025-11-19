import React from 'react';
import { PerspectiveCamera, Environment, Stars } from '@react-three/drei';
import { CyberBackground } from './CyberBackground';

// Using a dedicated Scene component to handle logic inside the Canvas context
export const Scene: React.FC<React.PropsWithChildren<unknown>> = ({ children }) => {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} color="#ff00ff" intensity={0.5} />

      <CyberBackground />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      <Environment preset="city" />

      {children}
    </>
  );
};
