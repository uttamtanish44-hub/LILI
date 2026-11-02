import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { AIState } from '../types';

interface Hologram3DProps {
  state: AIState;
  accentColor?: 'cyan' | 'emerald' | 'gold' | 'crimson';
  audioLevel?: number; // 0 to 1
  onClick?: () => void;
}

export const Hologram3D: React.FC<Hologram3DProps> = ({
  state,
  accentColor = 'cyan',
  audioLevel = 0,
  onClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<AIState>(state);
  const audioLevelRef = useRef<number>(audioLevel);
  const accentRef = useRef<string>(accentColor);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    audioLevelRef.current = audioLevel;
  }, [audioLevel]);

  useEffect(() => {
    accentRef.current = accentColor;
  }, [accentColor]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Dimensions
    const width = container.clientWidth || 380;
    const height = container.clientHeight || 380;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 4.2;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Particle Group
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 1. Core Sphere Particles
    const particlesCount = 1800;
    const positions = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);
    const originalPositions = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const radius = 1.35 + (Math.random() - 0.5) * 0.15;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      originalPositions[i * 3] = x;
      originalPositions[i * 3 + 1] = y;
      originalPositions[i * 3 + 2] = z;

      // Initial Cyan Color
      colors[i * 3] = 0.0;
      colors[i * 3 + 1] = 0.85;
      colors[i * 3 + 2] = 1.0;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Canvas particle texture generator for smooth glowing dots
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.3, 'rgba(0,230,255,0.8)');
      grad.addColorStop(0.7, 'rgba(0,150,255,0.3)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
    }
    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 0.045,
      map: texture,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particlesSphere = new THREE.Points(geometry, material);
    mainGroup.add(particlesSphere);

    // 2. Orbital Rings
    const createRing = (radius: number, tubeRadius: number, segments: number) => {
      const ringGeom = new THREE.TorusGeometry(radius, tubeRadius, 16, segments);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00e5ff,
        wireframe: true,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
      });
      return new THREE.Mesh(ringGeom, ringMat);
    };

    const ring1 = createRing(1.7, 0.006, 120);
    const ring2 = createRing(1.95, 0.005, 120);
    const ring3 = createRing(2.2, 0.004, 120);

    ring1.rotation.x = Math.PI / 3;
    ring2.rotation.y = Math.PI / 4;
    ring3.rotation.z = Math.PI / 6;

    mainGroup.add(ring1);
    mainGroup.add(ring2);
    mainGroup.add(ring3);

    // 3. Inner Glowing Core Mesh
    const coreGeom = new THREE.IcosahedronGeometry(0.75, 3);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
    });
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);
    mainGroup.add(coreMesh);

    // Lighting
    const pointLight = new THREE.PointLight(0x00f0ff, 2, 10);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Color Theme Helper
    const getStateColor = (currState: AIState, theme: string) => {
      if (currState === 'warning') return { r: 1.0, g: 0.2, b: 0.1, hex: 0xff3311 }; // Red Alert
      if (currState === 'private') return { r: 0.65, g: 0.1, b: 0.95, hex: 0xa61af3 }; // Purple Vault
      if (currState === 'thinking') return { r: 1.0, g: 0.78, b: 0.1, hex: 0xffc71a }; // Gold Spark
      if (currState === 'listening') return { r: 0.0, g: 0.95, b: 1.0, hex: 0x00f3ff }; // Bright Neon Cyan

      switch (theme) {
        case 'emerald': return { r: 0.1, g: 0.95, b: 0.5, hex: 0x1af380 };
        case 'gold': return { r: 1.0, g: 0.8, b: 0.2, hex: 0xffcc33 };
        case 'crimson': return { r: 0.95, g: 0.15, b: 0.35, hex: 0xf32659 };
        default: return { r: 0.0, g: 0.85, b: 1.0, hex: 0x00d9ff };
      }
    };

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      const currState = stateRef.current;
      const currAudio = audioLevelRef.current;
      const currTheme = accentRef.current;

      const targetCol = getStateColor(currState, currTheme);

      // Smoothly update point light color
      pointLight.color.setHex(targetCol.hex);

      // Smoothly update material colors
      const colorAttr = geometry.attributes.color as THREE.BufferAttribute;
      const colArray = colorAttr.array as Float32Array;

      for (let i = 0; i < particlesCount; i++) {
        colArray[i * 3] += (targetCol.r - colArray[i * 3]) * 0.05;
        colArray[i * 3 + 1] += (targetCol.g - colArray[i * 3 + 1]) * 0.05;
        colArray[i * 3 + 2] += (targetCol.b - colArray[i * 3 + 2]) * 0.05;
      }
      colorAttr.needsUpdate = true;

      // Update ring colors
      (ring1.material as THREE.MeshBasicMaterial).color.setHex(targetCol.hex);
      (ring2.material as THREE.MeshBasicMaterial).color.setHex(targetCol.hex);
      (ring3.material as THREE.MeshBasicMaterial).color.setHex(targetCol.hex);
      (coreMesh.material as THREE.MeshBasicMaterial).color.setHex(targetCol.hex);

      // State Rotations & Dynamics
      if (currState === 'thinking') {
        mainGroup.rotation.y += 0.035;
        ring1.rotation.x += 0.025;
        ring2.rotation.y -= 0.03;
        ring3.rotation.z += 0.02;
        coreMesh.rotation.y += 0.05;
        const scale = 1 + Math.sin(elapsedTime * 8) * 0.08;
        mainGroup.scale.set(scale, scale, scale);
      } else if (currState === 'listening') {
        mainGroup.rotation.y += 0.012;
        ring1.rotation.x += 0.01;
        ring2.rotation.y += 0.015;

        // Pulse scale based on audio input
        const audioPulse = currAudio * 0.4;
        const breath = Math.sin(elapsedTime * 4) * 0.05;
        const scale = 1.05 + breath + audioPulse;
        mainGroup.scale.set(scale, scale, scale);
      } else if (currState === 'speaking') {
        mainGroup.rotation.y += 0.018;
        ring1.rotation.z += 0.02;
        ring2.rotation.x -= 0.015;

        const voicePulse = Math.sin(elapsedTime * 12) * 0.12 + Math.cos(elapsedTime * 8) * 0.06;
        const scale = 1.0 + voicePulse;
        mainGroup.scale.set(scale, scale, scale);
      } else if (currState === 'booting') {
        mainGroup.rotation.y += 0.04;
        mainGroup.rotation.x += 0.02;
        const bootPulse = Math.abs(Math.sin(elapsedTime * 3));
        mainGroup.scale.set(bootPulse, bootPulse, bootPulse);
      } else if (currState === 'warning') {
        mainGroup.rotation.y += 0.008;
        const warnScale = 1 + Math.sin(elapsedTime * 10) * 0.12;
        mainGroup.scale.set(warnScale, warnScale, warnScale);
      } else {
        // Idle state
        mainGroup.rotation.y += 0.005;
        mainGroup.rotation.x = Math.sin(elapsedTime * 0.5) * 0.08;
        ring1.rotation.x += 0.004;
        ring2.rotation.y -= 0.003;
        ring3.rotation.z += 0.002;

        const idleScale = 1.0 + Math.sin(elapsedTime * 1.8) * 0.03;
        mainGroup.scale.set(idleScale, idleScale, idleScale);
      }

      // Particle displacement wobble based on state
      const posAttr = geometry.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      for (let i = 0; i < particlesCount; i++) {
        const ox = originalPositions[i * 3];
        const oy = originalPositions[i * 3 + 1];
        const oz = originalPositions[i * 3 + 2];

        let offset = 0;
        if (currState === 'listening') {
          offset = Math.sin(elapsedTime * 6 + i) * (0.02 + currAudio * 0.1);
        } else if (currState === 'speaking') {
          offset = Math.cos(elapsedTime * 8 + i * 0.5) * 0.04;
        } else if (currState === 'thinking') {
          offset = (Math.random() - 0.5) * 0.03;
        }

        posArray[i * 3] = ox + (ox / 1.35) * offset;
        posArray[i * 3 + 1] = oy + (oy / 1.35) * offset;
        posArray[i * 3 + 2] = oz + (oz / 1.35) * offset;
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      texture.dispose();
      coreGeom.dispose();
      coreMat.dispose();
    };
  }, []);

  return (
    <div
      onClick={onClick}
      className="relative flex items-center justify-center w-full h-full cursor-pointer group"
    >
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-[320px] h-[320px] sm:w-[380px] sm:h-[380px]" />

      {/* Futuristic Ring HUD Overlays */}
      <div className="absolute pointer-events-none rounded-full w-[260px] h-[260px] sm:w-[300px] sm:h-[300px] border border-cyan-500/20 group-hover:border-cyan-400/40 transition-colors animate-[spin_20s_linear_infinite]" />
      <div className="absolute pointer-events-none rounded-full w-[290px] h-[290px] sm:w-[340px] sm:h-[340px] border border-dashed border-cyan-500/15 animate-[spin_35s_linear_infinite_reverse]" />

      {/* Orbiting HUD ticks */}
      <div className="absolute pointer-events-none w-[320px] h-[320px] sm:w-[370px] sm:h-[370px] border border-cyan-500/10 rounded-full flex items-center justify-between px-2">
        <span className="text-[9px] font-mono text-cyan-400/50">SYS.01</span>
        <span className="text-[9px] font-mono text-cyan-400/50">LILI.OS</span>
      </div>
    </div>
  );
};
