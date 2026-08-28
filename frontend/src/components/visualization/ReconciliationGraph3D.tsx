import React, { Suspense, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import { Building2, Store, CreditCard, Cpu } from 'lucide-react';
import { CurrencyText } from '../common/CurrencyText.js';

interface NodeData {
  source: string;
  fileName: string;
  totalRows: number;
  amount: number;
  matched: number;
  exceptions: number;
}

interface Props {
  nodeMetrics?: {
    bank: NodeData;
    merchant: NodeData;
    settlement: NodeData;
  };
  matchRate?: number;
}

// 3D Single Node Component
const NodeMesh: React.FC<{
  position: [number, number, number];
  color: string;
  title: string;
  icon: React.ReactNode;
  data?: NodeData;
  isActive: boolean;
  onHover: (active: boolean) => void;
}> = ({ position, color, title, icon, data, isActive, onHover }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      meshRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.4}>
      <group position={position}>
        <mesh
          ref={meshRef}
          onPointerOver={() => onHover(true)}
          onPointerOut={() => onHover(false)}
        >
          <octahedronGeometry args={[0.7, 0]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={isActive ? 0.8 : 0.3}
            roughness={0.2}
            metalness={0.8}
            wireframe={false}
          />
        </mesh>

        {/* Outer Glow Ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.85, 0.95, 32]} />
          <meshBasicMaterial color={color} opacity={0.4} transparent side={THREE.DoubleSide} />
        </mesh>

        {/* HTML Tooltip Overlay */}
        <Html position={[0, -1.1, 0]} center distanceFactor={8}>
          <div
            className={`transition-all duration-300 pointer-events-none ${
              isActive ? 'scale-105 opacity-100 z-30' : 'scale-95 opacity-85 z-10'
            }`}
          >
            <div className="bg-slate-900/95 border border-slate-700/80 backdrop-blur-md rounded-xl p-3 shadow-2xl min-w-[170px] text-center">
              <div className="flex items-center justify-center gap-1.5 font-bold text-xs text-slate-100 mb-1">
                {icon}
                <span>{title}</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono mb-1 truncate max-w-[150px]">
                {data?.fileName || 'Source File'}
              </div>
              <div className="text-xs font-bold text-cyan-400 font-mono">
                <CurrencyText amount={data?.amount || 0} />
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 pt-1.5 border-t border-slate-800">
                <span className="text-emerald-400 font-mono">{data?.matched || 0} Matched</span>
                <span className="text-rose-400 font-mono">{data?.exceptions || 0} Excp</span>
              </div>
            </div>
          </div>
        </Html>
      </group>
    </Float>
  );
};

// Flow Particles & Connecting Laser Beams
const ConnectionStreams: React.FC<{ matchRate: number }> = ({ matchRate }) => {
  const points = useMemo(() => {
    // Bank -> Engine, Merchant -> Engine, Settlement -> Engine
    return [
      new THREE.Vector3(-2.8, 1.4, 0), // Bank
      new THREE.Vector3(2.8, 1.4, 0),  // Merchant
      new THREE.Vector3(0, -2.4, 0),   // Settlement
      new THREE.Vector3(0, 0.2, 0),    // Center Core
    ];
  }, []);

  const particleGeom = useMemo(() => {
    const count = 60;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const t = (i / count);
      const start = points[i % 3];
      const end = points[3];
      pos[i * 3] = THREE.MathUtils.lerp(start.x, end.x, t);
      pos[i * 3 + 1] = THREE.MathUtils.lerp(start.y, end.y, t);
      pos[i * 3 + 2] = THREE.MathUtils.lerp(start.z, end.z, t);
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return geom;
  }, [points]);

  const particlesRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < 60; i++) {
        const start = points[i % 3];
        const end = points[3];
        let progress = ((state.clock.getElapsedTime() * 0.4 + i / 60) % 1);
        positions[i * 3] = THREE.MathUtils.lerp(start.x, end.x, progress);
        positions[i * 3 + 1] = THREE.MathUtils.lerp(start.y, end.y, progress);
        positions[i * 3 + 2] = THREE.MathUtils.lerp(start.z, end.z, progress);
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Central Core */}
      <mesh position={[0, 0.2, 0]}>
        <icosahedronGeometry args={[0.85, 2]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={0.6}
          roughness={0.1}
          metalness={0.9}
          wireframe
        />
      </mesh>

      <Html position={[0, 0.2, 0]} center distanceFactor={8}>
        <div className="bg-slate-950/90 border border-cyan-500/50 rounded-full p-2 text-cyan-400 shadow-xl pointer-events-none flex flex-col items-center">
          <Cpu className="w-5 h-5 animate-pulse" />
          <span className="text-[9px] font-mono font-bold mt-0.5">{matchRate}% Match</span>
        </div>
      </Html>

      {/* Moving Particles */}
      <points ref={particlesRef} geometry={particleGeom}>
        <pointsMaterial size={0.08} color="#38bdf8" transparent opacity={0.8} />
      </points>
    </group>
  );
};

export const ReconciliationGraph3D: React.FC<Props> = ({ nodeMetrics, matchRate = 0 }) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [webglError, setWebglError] = useState(false);

  if (webglError) {
    return <ReconciliationGraph2DFallback nodeMetrics={nodeMetrics} matchRate={matchRate} />;
  }

  return (
    <div className="relative w-full h-[360px] rounded-2xl bg-slate-950 border border-slate-800/80 overflow-hidden shadow-inner flex items-center justify-center">
      <div className="absolute top-3 left-4 z-20 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
          Reconciliation Node Flow Engine (3D)
        </span>
      </div>

      <div className="absolute bottom-3 right-4 z-20 text-[11px] text-slate-400 font-mono bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800 backdrop-blur-sm">
        Hover nodes to inspect source ledgers
      </div>

      <Canvas
        camera={{ position: [0, 0, 7.5], fov: 45 }}
        onError={() => setWebglError(true)}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.7} />
        <pointLight position={[10, 10, 10]} intensity={1.2} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#38bdf8" />
        
        <Suspense fallback={null}>
          {/* Bank Node */}
          <NodeMesh
            position={[-2.8, 1.4, 0]}
            color="#10b981"
            title="Bank Statement"
            icon={<Building2 className="w-3.5 h-3.5 text-emerald-400" />}
            data={nodeMetrics?.bank}
            isActive={hoveredNode === 'bank'}
            onHover={(act) => setHoveredNode(act ? 'bank' : null)}
          />

          {/* Merchant Node */}
          <NodeMesh
            position={[2.8, 1.4, 0]}
            color="#38bdf8"
            title="Merchant Ledger"
            icon={<Store className="w-3.5 h-3.5 text-cyan-400" />}
            data={nodeMetrics?.merchant}
            isActive={hoveredNode === 'merchant'}
            onHover={(act) => setHoveredNode(act ? 'merchant' : null)}
          />

          {/* Settlement Node */}
          <NodeMesh
            position={[0, -2.4, 0]}
            color="#8b5cf6"
            title="Settlement Report"
            icon={<CreditCard className="w-3.5 h-3.5 text-purple-400" />}
            data={nodeMetrics?.settlement}
            isActive={hoveredNode === 'settlement'}
            onHover={(act) => setHoveredNode(act ? 'settlement' : null)}
          />

          {/* Connected Stream */}
          <ConnectionStreams matchRate={matchRate} />
        </Suspense>

        <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 1.8} minPolarAngle={Math.PI / 2.5} />
      </Canvas>
    </div>
  );
};

// 2D Clean Fallback Component
export const ReconciliationGraph2DFallback: React.FC<Props> = ({ nodeMetrics, matchRate = 0 }) => {
  return (
    <div className="w-full p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
          Reconciliation 3-Source Flow (2D Architecture)
        </h4>
        <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
          Match Rate: {matchRate}%
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
        <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-1">
            <Building2 className="w-4 h-4" /> Bank Statement
          </div>
          <div className="text-xs text-slate-400 font-mono truncate">{nodeMetrics?.bank.fileName || 'Bank Ledger'}</div>
          <div className="text-lg font-bold text-slate-100 font-mono mt-2">
            <CurrencyText amount={nodeMetrics?.bank.amount || 0} />
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800">
            <span>{nodeMetrics?.bank.matched || 0} Matched</span>
            <span className="text-rose-400">{nodeMetrics?.bank.exceptions || 0} Exceptions</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm mb-1">
            <Store className="w-4 h-4" /> Merchant Ledger
          </div>
          <div className="text-xs text-slate-400 font-mono truncate">{nodeMetrics?.merchant.fileName || 'Sales Orders'}</div>
          <div className="text-lg font-bold text-slate-100 font-mono mt-2">
            <CurrencyText amount={nodeMetrics?.merchant.amount || 0} />
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800">
            <span>{nodeMetrics?.merchant.matched || 0} Matched</span>
            <span className="text-rose-400">{nodeMetrics?.merchant.exceptions || 0} Exceptions</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-purple-500/30">
          <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm mb-1">
            <CreditCard className="w-4 h-4" /> Settlement Report
          </div>
          <div className="text-xs text-slate-400 font-mono truncate">{nodeMetrics?.settlement.fileName || 'Gateway Payouts'}</div>
          <div className="text-lg font-bold text-slate-100 font-mono mt-2">
            <CurrencyText amount={nodeMetrics?.settlement.amount || 0} />
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800">
            <span>{nodeMetrics?.settlement.matched || 0} Matched</span>
            <span className="text-rose-400">{nodeMetrics?.settlement.exceptions || 0} Exceptions</span>
          </div>
        </div>
      </div>
    </div>
  );
};
