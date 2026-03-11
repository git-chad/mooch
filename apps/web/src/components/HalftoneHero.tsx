"use client";

import { useGLTF } from "@react-three/drei";
import { createPortal, useFrame, useLoader, useThree } from "@react-three/fiber";
import { useControls } from "leva";
import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three/webgpu";
import { createHalftoneColorNode } from "@/lib/shaders/halftoneColorNode";
import WebGPUScene from "./webgpu/WebGPUScene";
import WebGPUSketch from "./webgpu/WebGPUSketch";

const BG_TEXTURE_URL = "/textures/bg-texture.webp";
const MODEL_URL = "/models/imac-g3-v1.1.glb";
const INTRO_CONTRAST_FROM = 3.0;
const INTRO_CONTRAST_TO = 1.55;
useLoader.preload(THREE.TextureLoader, BG_TEXTURE_URL);

function HeroCameraRig() {
  const camera = useThree((state) => state.camera);
  const pointer = useThree((state) => state.pointer);

  useFrame((_, delta) => {
    const targetX = pointer.x * 8;
    const targetY = pointer.y * 6;

    camera.position.x = THREE.MathUtils.damp(
      camera.position.x,
      targetX,
      4.2,
      delta,
    );
    camera.position.y = THREE.MathUtils.damp(
      camera.position.y,
      targetY,
      4.2,
      delta,
    );
  });

  return null;
}

function IMacModel() {
  const viewport = useThree((s) => s.viewport);
  const size = useThree((s) => s.size);
  const { scene: gltfScene } = useGLTF(MODEL_URL);

  const {
    scale,
    posX,
    posY,
    rotY,
    rotX,
    camFov,
    camZ,
  } = useControls("iMac Model", {
    scale: { value: 2.75, min: 0.5, max: 5, step: 0.05, label: "Scale" },
    posX: { value: 0, min: -3, max: 3, step: 0.01, label: "X" },
    posY: { value: -1.2, min: -3, max: 3, step: 0.01, label: "Y" },
    rotY: { value: -Math.PI / 2, min: -Math.PI, max: Math.PI, step: 0.01, label: "Rot Y" },
    rotX: { value: 0, min: -Math.PI / 2, max: Math.PI / 2, step: 0.01, label: "Rot X" },
    camFov: { value: 35, min: 10, max: 90, step: 1, label: "FOV" },
    camZ: { value: 4.5, min: 1, max: 15, step: 0.1, label: "Cam Z" },
  });

  // Separate scene + perspective camera for the model
  const [modelScene] = useState(() => {
    const s = new THREE.Scene();
    s.add(new THREE.AmbientLight(0xffffff, 0.74));
    const dir = new THREE.DirectionalLight(0xffffff, 1.35);
    dir.position.set(3.5, 5, 4);
    s.add(dir);
    return s;
  });

  const perspCamera = useMemo(() => {
    const cam = new THREE.PerspectiveCamera(camFov, size.width / size.height, 0.1, 100);
    cam.position.set(0, 0.15, camZ);
    cam.lookAt(0, 0, 0);
    return cam;
  }, [camFov, camZ, size.width, size.height]);

  // Render target with alpha for compositing
  const renderTarget = useMemo(() => {
    const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 1.5) : 1;
    const rt = new THREE.RenderTarget(
      Math.round(size.width * dpr),
      Math.round(size.height * dpr),
    );
    return rt;
  }, [size.width, size.height]);

  // Clone + setup model once
  const model = useMemo(() => {
    const cloned = gltfScene.clone();
    cloned.updateWorldMatrix(true, true);

    cloned.traverse((obj) => {
      if (!(obj as THREE.Mesh).isMesh) return;
      const mesh = obj as THREE.Mesh;
      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      mesh.material = (materials.length === 1
        ? materials[0]
        : materials
      ) as THREE.Material | THREE.Material[];
    });

    // Center the model
    const box = new THREE.Box3().setFromObject(cloned);
    const center = box.getCenter(new THREE.Vector3());
    cloned.position.sub(center);

    return cloned;
  }, [gltfScene]);

  // Add model to the offscreen scene
  useLayoutEffect(() => {
    const group = new THREE.Group();
    group.add(model);
    modelScene.add(group);
    return () => {
      modelScene.remove(group);
    };
  }, [model, modelScene]);

  // Update model transforms from leva
  useFrame(({ gl }) => {
    model.scale.setScalar(scale);
    model.rotation.set(rotX, rotY, 0);
    model.position.x = posX;
    model.position.y = posY;

    // Render model scene to FBO with perspective camera
    const prevRT = gl.getRenderTarget();
    gl.setRenderTarget(renderTarget);
    gl.setClearColor(0x000000, 0);
    gl.clear();
    gl.render(modelScene, perspCamera);
    gl.setRenderTarget(prevRT);
  });

  // Flip UVs on the display quad — WebGPU render targets are Y-flipped
  const flippedPlane = useMemo(() => {
    const geo = new THREE.PlaneGeometry(1, 1);
    const uvs = geo.attributes.uv;
    for (let i = 0; i < uvs.count; i++) {
      uvs.setY(i, 1 - uvs.getY(i));
    }
    uvs.needsUpdate = true;
    return geo;
  }, []);

  // Display FBO texture on a quad in the ortho scene (in front of halftone)
  return (
    <mesh position={[0, 0, 0.5]} geometry={flippedPlane} scale={[viewport.width, viewport.height, 1]}>
      <meshBasicMaterial map={renderTarget.texture} transparent />
    </mesh>
  );
}

function HalftoneSketch() {
  const texture = useLoader(THREE.TextureLoader, BG_TEXTURE_URL);
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const hoveredRef = useRef(false);
  const trailHeadRef = useRef(0);
  const trailCooldownRef = useRef(0);
  const lastTrailPointRef = useRef(new THREE.Vector2(Number.NaN, Number.NaN));
  const readyEventSentRef = useRef(false);

  const { colorNode, uniforms } = useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return createHalftoneColorNode(texture);
  }, [texture]);

  // Keep resolution uniform in sync with actual canvas size
  useEffect(() => {
    const dpr =
      typeof (
        gl as {
          getPixelRatio?: () => number;
        }
      )?.getPixelRatio === "function"
        ? (
            gl as {
              getPixelRatio: () => number;
            }
          ).getPixelRatio()
        : 1;
    const width = size?.width ?? 1;
    const height = size?.height ?? 1;

    (uniforms.resolution.value as THREE.Vector2).set(
      width * dpr,
      height * dpr,
    );
  }, [gl, size, uniforms]);

  useEffect(() => {
    uniforms.pixelSize.value = 20;
    uniforms.dotRadius.value = 1.15;
    uniforms.angle.value = (45 * Math.PI) / 180;
    uniforms.contrast.value = INTRO_CONTRAST_FROM;
    uniforms.invertLuma.value = 1.0;
    uniforms.noiseSpeed.value = 0.55;
    uniforms.noiseScale.value = 5.7;
    uniforms.noiseAmount.value = 0.29;
    uniforms.pointerRadius.value = 0.8;
    uniforms.pointerBoost.value = 0.52;
    uniforms.trailRadius.value = 0.56;
    uniforms.trailBoost.value = 0.7;
    uniforms.introProgress.value = 0.0;

    const col = new THREE.Color("#FCFCFB");
    (uniforms.bgColor.value as THREE.Vector3).set(col.r, col.g, col.b);
  }, [uniforms]);

  useEffect(() => {
    const canvas = gl.domElement as HTMLCanvasElement | undefined;
    if (!canvas) {
      return;
    }

    const onEnter = () => {
      hoveredRef.current = true;
    };
    const onLeave = () => {
      hoveredRef.current = false;
      lastTrailPointRef.current.set(Number.NaN, Number.NaN);
    };

    canvas.addEventListener("pointerenter", onEnter);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointercancel", onLeave);
    return () => {
      canvas.removeEventListener("pointerenter", onEnter);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointercancel", onLeave);
    };
  }, [gl]);

  useFrame(({ pointer }, delta) => {
    if (!readyEventSentRef.current) {
      readyEventSentRef.current = true;
      (
        window as Window & {
          __halftoneReady?: boolean;
        }
      ).__halftoneReady = true;
      window.dispatchEvent(new Event("halftone:ready"));
    }

    (uniforms.pointer.value as THREE.Vector2).set(pointer.x, pointer.y);
    const introRaw = uniforms.introProgress.value;
    const introNow = typeof introRaw === "number" ? introRaw : 0;
    const nextIntro = THREE.MathUtils.damp(introNow, 1.0, 1.55, delta);
    uniforms.introProgress.value = nextIntro > 0.999 ? 1.0 : nextIntro;

    const contrastRaw = uniforms.contrast.value;
    const contrastNow =
      typeof contrastRaw === "number" ? contrastRaw : INTRO_CONTRAST_FROM;
    const contrastMix = THREE.MathUtils.smoothstep(nextIntro, 0.08, 0.96);
    const contrastTarget = THREE.MathUtils.lerp(
      INTRO_CONTRAST_FROM,
      INTRO_CONTRAST_TO,
      contrastMix,
    );
    uniforms.contrast.value =
      nextIntro >= 0.999
        ? INTRO_CONTRAST_TO
        : THREE.MathUtils.damp(contrastNow, contrastTarget, 2.9, delta);

    const currentHover = uniforms.hoverMix.value as number;
    const targetHover = hoveredRef.current ? 1 : 0;
    uniforms.hoverMix.value = THREE.MathUtils.damp(
      currentHover,
      targetHover,
      10,
      delta,
    );

    for (let i = 0; i < uniforms.trailLives.length; i++) {
      uniforms.trailLives[i].value = Math.max(
        0,
        (uniforms.trailLives[i].value as number) - delta * 2.35,
      );
    }

    trailCooldownRef.current -= delta;
    if (!hoveredRef.current || trailCooldownRef.current > 0) {
      return;
    }

    const lastPoint = lastTrailPointRef.current;
    const movedEnough =
      Number.isNaN(lastPoint.x) ||
      (pointer.x - lastPoint.x) * (pointer.x - lastPoint.x) +
        (pointer.y - lastPoint.y) * (pointer.y - lastPoint.y) >
        0.0025;
    if (!movedEnough) {
      return;
    }

    const idx = trailHeadRef.current % uniforms.trailPoints.length;
    (uniforms.trailPoints[idx].value as THREE.Vector2).set(
      pointer.x,
      pointer.y,
    );
    uniforms.trailLives[idx].value = 1.0;
    trailHeadRef.current =
      (trailHeadRef.current + 1) % uniforms.trailPoints.length;
    lastPoint.copy(pointer);
    trailCooldownRef.current = 1 / 48;
  });

  return (
    <WebGPUSketch
      position={[0, 0, 0]}
      colorNode={colorNode}
      onPointerEnter={() => {
        hoveredRef.current = true;
      }}
      onPointerLeave={() => {
        hoveredRef.current = false;
        lastTrailPointRef.current.set(Number.NaN, Number.NaN);
      }}
    />
  );
}

export default function HalftoneHero() {
  return (
    <div className="z-10 absolute inset-0 w-full h-full bg-[#FCFCFB]">
      <WebGPUScene
        frameloop="always"
        orthographic
      >
        <HeroCameraRig />
        <HalftoneSketch />
        <Suspense fallback={null}>
          <IMacModel />
        </Suspense>
      </WebGPUScene>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-b from-transparent to-[#FCFCFB]" />
    </div>
  );
}
