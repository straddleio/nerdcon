import React, { useEffect, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html, useProgress } from '@react-three/drei';
import { useDemoStore } from '@/lib/state';
import { Scene } from './Scene';
import { Waldo3D } from './stages/Waldo3D';
import { Blake3D } from './stages/Blake3D';
import { Minting3D } from './stages/Minting3D';

function LoadingScreen(): JSX.Element {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="font-pixel text-primary text-sm whitespace-nowrap">
        SYSTEM_INIT... {progress.toFixed(0)}%
      </div>
    </Html>
  );
}

export const GeneratorModalV5: React.FC = () => {
  const showPaykeyGenerator = useDemoStore((state) => state.showPaykeyGenerator);
  const generatorData = useDemoStore((state) => state.generatorData);
  const clearGeneratorData = useDemoStore((state) => state.clearGeneratorData);

  const [stage, setStage] = useState<'waldo' | 'blake3' | 'minting'>('waldo');
  const [generatedHash, setGeneratedHash] = useState<string>('');

  useEffect(() => {
    if (showPaykeyGenerator && generatorData) {
      setStage(generatorData.waldoData ? 'waldo' : 'blake3');
    }
  }, [showPaykeyGenerator, generatorData]);

  if (!showPaykeyGenerator || !generatorData) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      {/* 3D Canvas Layer */}
      <div className="absolute inset-0 z-0">
        <Canvas dpr={[1, 2]}>
          <Suspense fallback={<LoadingScreen />}>
            <Scene>
              {stage === 'waldo' && (
                <Waldo3D data={generatorData} onComplete={() => setStage('blake3')} />
              )}

              {stage === 'blake3' && (
                <Blake3D
                  data={generatorData}
                  onComplete={(h) => {
                    setGeneratedHash(h);
                    setStage('minting');
                  }}
                />
              )}

              {stage === 'minting' && (
                <Minting3D hash={generatedHash} onComplete={clearGeneratorData} />
              )}
            </Scene>
          </Suspense>
        </Canvas>
      </div>

      {/* UI Overlay (HUD) */}
      <div className="absolute inset-0 z-10 pointer-events-none p-8 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-pixel text-white drop-shadow-[0_0_10px_rgba(0,255,255,0.8)]">
              PAYKEY GENERATOR <span className="text-primary text-sm">v5.0</span>
            </h1>
            <div className="text-xs font-mono text-white/60 mt-1">
              GPU_ACCELERATED // WEBGL2.0 // R3F
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-mono text-primary">SECURE_ENCLAVE_ACTIVE</div>
            <div className="text-[10px] font-mono text-white/40">
              UID: {generatorData.customerName}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-end">
          <div className="flex gap-4 text-[10px] font-mono text-white/40">
            <div>FPS: 60</div>
            <div>DRAW_CALLS: 12</div>
            <div>MEM: 24MB</div>
          </div>

          <button
            onClick={clearGeneratorData}
            className="pointer-events-auto bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded text-xs font-mono backdrop-blur-md transition-all"
          >
            TERMINATE_SEQUENCE [ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
