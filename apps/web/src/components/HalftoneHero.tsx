"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  abs,
  float,
  length,
  max,
  mix,
  smoothstep,
  texture as tslTexture,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
import * as THREE from "three/webgpu";
import { createHalftoneColorNode } from "@/lib/shaders/halftoneColorNode";
import { crtScanlineEffect } from "@/lib/shaders/utils/crtScanlineEffect";
import { vignetteEffect } from "@/lib/shaders/utils/vignetteEffect";
import WebGPUScene from "./webgpu/WebGPUScene";
import WebGPUSketch from "./webgpu/WebGPUSketch";

const BG_TEXTURE_URL = "/textures/bg-texture.webp";
const MODEL_URL = "/models/imac-g3-v1.1.glb";
const SCREEN_VIDEO_URL = "/textures/charlie-texture-c.mp4";
const INTRO_CONTRAST_FROM = 3.0;
const INTRO_CONTRAST_TO = 1.55;
const IMAC_SCALE = 2.75;
const IMAC_POS_X = 0;
const IMAC_POS_Y = -1.2;
const IMAC_ROT_Y = -Math.PI / 2;
const IMAC_ROT_X = 0;
const IMAC_CAM_FOV = 35;
const IMAC_CAM_Z = 4.5;
const IMAC_INTRO_START_Y = -2.35;
const IMAC_INTRO_START_Z = 1.3;
const IMAC_INTRO_START_SCALE = 3.15;
const IMAC_INTRO_DAMP = 2.2;
const IMAC_SCROLL_PUSHBACK_Z = -0.9;
const IMAC_SCROLL_PUSHBACK_Y = -0.26;
const SCREEN_ASPECT = 4 / 3;
const SCREEN_GLARE_LIGHT_POS = new THREE.Vector3(1.55, 0.55, 1.85);
const SCREEN_GLARE_VIEW_Z = 1.95;
const SCREEN_GLARE_VIEW_RANGE_X = 1.35;
const SCREEN_GLARE_VIEW_RANGE_Y = 0.24;
const SCREEN_GLARE_SOFT_RADIUS = 0.66;
const SCREEN_GLARE_TIGHT_RADIUS = 0.3;
const SCREEN_GLARE_SOFT_STRENGTH = 0.3;
const SCREEN_GLARE_TIGHT_STRENGTH = 0.52;
const SCREEN_GLARE_STREAK_STRENGTH = 0.22;
const SCREEN_GLARE_POINTER_DAMP = 4.2;

useLoader.preload(THREE.TextureLoader, BG_TEXTURE_URL);

function IMacModel() {
  const viewport = useThree((s) => s.viewport);
  const size = useThree((s) => s.size);
  const { scene: gltfScene } = useGLTF(MODEL_URL);
  const scrollProgressRef = useRef(0);
  const glarePointerUniform = useMemo(
    () => uniform(new THREE.Vector2(0, 0)),
    [],
  );

  // Separate scene + 3-point lighting for the model
  const [modelScene] = useState(() => {
    const s = new THREE.Scene();

    // Ambient base — soft fill so nothing is pure black
    s.add(new THREE.AmbientLight(0xffffff, 0.5));

    // Key light — warm, upper right, main shadow caster
    const key = new THREE.DirectionalLight(0xfff5e6, 1.6);
    key.position.set(4, 5, 3);
    s.add(key);

    // Fill light — cooler, softer, from left to lift shadows
    const fill = new THREE.DirectionalLight(0xe6f0ff, 0.6);
    fill.position.set(-3, 2, 2);
    s.add(fill);

    // Top light — subtle overhead to catch the glossy top surfaces
    const top = new THREE.DirectionalLight(0xffffff, 0.4);
    top.position.set(0, 8, -1);
    s.add(top);

    return s;
  });

  const perspCamera = useMemo(() => {
    const cam = new THREE.PerspectiveCamera(
      IMAC_CAM_FOV,
      size.width / size.height,
      0.1,
      100,
    );
    cam.position.set(0, 0.15, IMAC_CAM_Z);
    cam.lookAt(0, 0, 0);
    return cam;
  }, [size.width, size.height]);

  // Render target with alpha for compositing
  const renderTarget = useMemo(() => {
    const dpr =
      typeof window !== "undefined"
        ? Math.min(window.devicePixelRatio, 1.5)
        : 1;
    const rt = new THREE.RenderTarget(
      Math.round(size.width * dpr),
      Math.round(size.height * dpr),
    );
    return rt;
  }, [size.width, size.height]);

  // Video texture — created and managed entirely in an effect to survive strict mode
  const videoTextureRef = useRef<THREE.VideoTexture | null>(null);
  const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(
    null,
  );
  const modelIntroProgressRef = useRef(0);

  useEffect(() => {
    const video = document.createElement("video");
    video.src = SCREEN_VIDEO_URL;
    video.crossOrigin = "anonymous";
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    const tex = new THREE.VideoTexture(video);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    videoTextureRef.current = tex;
    setVideoTexture(tex);

    const tryPlay = () => {
      video.play().catch(() => {});
    };

    if (video.readyState >= 2) {
      tryPlay();
    } else {
      video.addEventListener("canplay", tryPlay, { once: true });
    }

    return () => {
      video.removeEventListener("canplay", tryPlay);
      video.pause();
      video.removeAttribute("src");
      video.load();
      tex.dispose();
      videoTextureRef.current = null;
    };
  }, []);

  // Clone + setup model once (re-runs when videoTexture becomes available)
  const model = useMemo(() => {
    const cloned = gltfScene.clone();
    cloned.updateWorldMatrix(true, true);
    let screenMeshCount = 0;

    cloned.traverse((obj) => {
      if (!(obj as THREE.Mesh).isMesh) return;
      const mesh = obj as THREE.Mesh;
      const mat = (
        Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
      ) as THREE.MeshStandardMaterial;

      if (mat.name.toLowerCase().includes("screen") && videoTexture) {
        screenMeshCount += 1;
        // View-dependent reflection model for realistic screen glare.
        const screenUV = uv();
        const p = vec2(
          screenUV.x.sub(0.5).mul(float(2.0 * SCREEN_ASPECT)),
          screenUV.y.sub(0.5).mul(float(2.0)),
        );
        const viewPos = vec3(
          glarePointerUniform.x.mul(float(SCREEN_GLARE_VIEW_RANGE_X)),
          glarePointerUniform.y.mul(float(SCREEN_GLARE_VIEW_RANGE_Y)),
          float(SCREEN_GLARE_VIEW_Z),
        );
        const glareCenter = vec2(
          float(SCREEN_GLARE_LIGHT_POS.z)
            .mul(viewPos.x)
            .add(float(SCREEN_GLARE_VIEW_Z * SCREEN_GLARE_LIGHT_POS.x))
            .div(float(SCREEN_GLARE_LIGHT_POS.z + SCREEN_GLARE_VIEW_Z)),
          float(SCREEN_GLARE_LIGHT_POS.z)
            .mul(viewPos.y)
            .add(float(SCREEN_GLARE_VIEW_Z * SCREEN_GLARE_LIGHT_POS.y))
            .div(float(SCREEN_GLARE_LIGHT_POS.z + SCREEN_GLARE_VIEW_Z)),
        );
        const offset = vec2(p.x.sub(glareCenter.x), p.y.sub(glareCenter.y));

        const viewDelta = vec3(
          viewPos.x.sub(p.x),
          viewPos.y.sub(p.y),
          viewPos.z,
        );
        const viewLen = max(length(viewDelta), float(0.0001));
        const viewDir = viewDelta.div(viewLen);
        const ndv = max(viewDir.z, float(0.0));
        const fresnelCore = float(1.0).sub(ndv);
        const fresnel = fresnelCore
          .mul(fresnelCore)
          .mul(float(0.9))
          .add(float(0.1));
        const grazingStretch = abs(viewPos.x).mul(float(0.65)).add(float(1.0));

        const softBlob = smoothstep(
          float(SCREEN_GLARE_SOFT_RADIUS),
          float(0.0),
          length(vec2(offset.x.mul(grazingStretch), offset.y.mul(0.82))),
        );
        const tightBlob = smoothstep(
          float(SCREEN_GLARE_TIGHT_RADIUS),
          float(0.0),
          length(
            vec2(offset.x.mul(grazingStretch.mul(1.35)), offset.y.mul(1.1)),
          ),
        );
        const streak = smoothstep(
          float(0.2),
          float(0.0),
          abs(offset.x.mul(0.78).add(offset.y.mul(1.25))),
        ).mul(smoothstep(float(0.92), float(0.0), length(offset)));

        const glare = softBlob
          .mul(float(SCREEN_GLARE_SOFT_STRENGTH))
          .add(tightBlob.mul(float(SCREEN_GLARE_TIGHT_STRENGTH)))
          .add(streak.mul(float(SCREEN_GLARE_STREAK_STRENGTH)))
          .mul(fresnel)
          .clamp(float(0.0), float(1.0));
        const edgeFade = smoothstep(
          float(1.4),
          float(0.45),
          length(vec2(p.x.mul(0.68), p.y)),
        );
        const glareMix = glare.mul(edgeFade).clamp(float(0.0), float(1.0));
        const videoSample = vec4(tslTexture(videoTexture, screenUV));

        const scanlineVideo = crtScanlineEffect({
          inputColor: videoSample,
          inputUV: () => screenUV,
          lineFrequency: 120,
          lineIntensity: 0.18,
          curvature: 0.04,
          scanlineSharpness: 0.92,
        });

        const vignetteVideo = vignetteEffect({
          inputColor: scanlineVideo,
          inputUV: () => screenUV,
          smoothing: 0.22,
          exponent: 4.2,
        });
        const videoColor = vec3(
          vignetteVideo.x,
          vignetteVideo.y,
          vignetteVideo.z,
        );
        const videoLuma = videoColor.x
          .mul(0.2126)
          .add(videoColor.y.mul(0.7152))
          .add(videoColor.z.mul(0.0722));
        const fadedVideoColor = mix(videoColor, vec3(videoLuma), float(0.05));

        const screenMat = new THREE.MeshBasicNodeMaterial({
          toneMapped: false,
        });
        screenMat.colorNode = mix(fadedVideoColor, vec3(1.0), glareMix);

        // Adjust UVs: video is 16:9, screen is ~4:3 → center-crop horizontally
        // 4:3 = 1.333, 16:9 = 1.778 → crop factor = 1.333 / 1.778 = 0.75
        const screenAspect = 4 / 3;
        const videoAspect = 16 / 9;
        const geo = mesh.geometry;
        const uvAttr = geo.attributes.uv;
        if (uvAttr) {
          const cropX = screenAspect / videoAspect; // ~0.75
          const offsetX = (1 - cropX) / 2;
          for (let i = 0; i < uvAttr.count; i++) {
            const u = uvAttr.getX(i);
            uvAttr.setX(i, u * cropX + offsetX);
          }
          uvAttr.needsUpdate = true;
        }

        mesh.material = screenMat;
      }
    });

    if (
      videoTexture &&
      screenMeshCount === 0 &&
      typeof window !== "undefined" &&
      process.env.NODE_ENV !== "production"
    ) {
      // Helps debug cases where GLTF material names don't include "screen".
      console.warn("[HalftoneHero] No screen mesh matched for glare material.");
    }

    // Center the model
    const box = new THREE.Box3().setFromObject(cloned);
    const center = box.getCenter(new THREE.Vector3());
    cloned.position.sub(center);

    return cloned;
  }, [gltfScene, glarePointerUniform, videoTexture]);

  // Add model to the offscreen scene
  useLayoutEffect(() => {
    const group = new THREE.Group();
    group.add(model);
    modelScene.add(group);
    return () => {
      modelScene.remove(group);
    };
  }, [model, modelScene]);

  useEffect(() => {
    modelIntroProgressRef.current = 0;
  }, [model]);

  useEffect(() => {
    const updateScrollProgress = () => {
      const viewportHeight = window.innerHeight || 1;
      const rawProgress = window.scrollY / (viewportHeight * 0.75);
      scrollProgressRef.current = THREE.MathUtils.clamp(rawProgress, 0, 1);
    };

    updateScrollProgress();
    window.addEventListener("scroll", updateScrollProgress, { passive: true });
    window.addEventListener("resize", updateScrollProgress);

    return () => {
      window.removeEventListener("scroll", updateScrollProgress);
      window.removeEventListener("resize", updateScrollProgress);
    };
  }, []);

  // Update model transforms + pointer-driven camera parallax
  useFrame(({ gl, pointer }, delta) => {
    const glarePointer = glarePointerUniform.value as THREE.Vector2;
    glarePointer.x = THREE.MathUtils.damp(
      glarePointer.x,
      pointer.x,
      SCREEN_GLARE_POINTER_DAMP,
      delta,
    );
    glarePointer.y = THREE.MathUtils.damp(
      glarePointer.y,
      pointer.y,
      SCREEN_GLARE_POINTER_DAMP,
      delta,
    );

    const introNow = modelIntroProgressRef.current;
    const introNext = THREE.MathUtils.damp(
      introNow,
      1.0,
      IMAC_INTRO_DAMP,
      delta,
    );
    modelIntroProgressRef.current = introNext > 0.999 ? 1.0 : introNext;
    const introEase = THREE.MathUtils.smoothstep(
      modelIntroProgressRef.current,
      0.0,
      1.0,
    );

    model.scale.setScalar(
      THREE.MathUtils.lerp(IMAC_INTRO_START_SCALE, IMAC_SCALE, introEase),
    );
    model.rotation.set(IMAC_ROT_X, IMAC_ROT_Y, 0);
    const scrollEase = THREE.MathUtils.smootherstep(
      scrollProgressRef.current,
      0.0,
      1.0,
    );
    model.position.x = IMAC_POS_X;
    model.position.y = THREE.MathUtils.lerp(
      IMAC_INTRO_START_Y,
      IMAC_POS_Y + IMAC_SCROLL_PUSHBACK_Y * scrollEase,
      introEase,
    );
    model.position.z = THREE.MathUtils.lerp(
      IMAC_INTRO_START_Z,
      IMAC_SCROLL_PUSHBACK_Z * scrollEase,
      introEase,
    );

    // Subtle parallax on the perspective camera
    const targetX = pointer.x * -0.15;
    const targetY = 0.15 + pointer.y * 0.1;
    perspCamera.position.z = THREE.MathUtils.damp(
      perspCamera.position.z,
      IMAC_CAM_Z,
      6.5,
      delta,
    );
    perspCamera.position.x = THREE.MathUtils.damp(
      perspCamera.position.x,
      targetX,
      4.2,
      delta,
    );
    perspCamera.position.y = THREE.MathUtils.damp(
      perspCamera.position.y,
      targetY,
      4.2,
      delta,
    );
    if (Math.abs(perspCamera.fov - IMAC_CAM_FOV) > 0.001) {
      perspCamera.fov = IMAC_CAM_FOV;
      perspCamera.updateProjectionMatrix();
    }
    perspCamera.lookAt(0, 0, 0);

    // Render model scene to FBO with perspective camera
    const renderer = gl as typeof gl & {
      getRenderTarget: () => THREE.RenderTarget | null;
      setRenderTarget: (target: THREE.RenderTarget | null) => void;
    };
    const prevRT = renderer.getRenderTarget();
    renderer.setRenderTarget(renderTarget);
    gl.setClearColor(0x000000, 0);
    gl.clear();
    gl.render(modelScene, perspCamera);
    renderer.setRenderTarget(prevRT);
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
    <mesh
      position={[0, 0, 0.5]}
      geometry={flippedPlane}
      scale={[viewport.width, viewport.height, 1]}
    >
      <meshBasicMaterial map={renderTarget.texture} transparent />
    </mesh>
  );
}

function HalftoneSketch() {
  const texture = useLoader(THREE.TextureLoader, BG_TEXTURE_URL);
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const hoveredRef = useRef(false);
  const scrollProgressRef = useRef(0);
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

    (uniforms.resolution.value as THREE.Vector2).set(width * dpr, height * dpr);
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
    uniforms.textureScale.value = 1.0;

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

  useEffect(() => {
    const updateScrollProgress = () => {
      const viewportHeight = window.innerHeight || 1;
      const rawProgress = window.scrollY / (viewportHeight * 0.75);
      scrollProgressRef.current = THREE.MathUtils.clamp(rawProgress, 0, 1);
    };

    updateScrollProgress();
    window.addEventListener("scroll", updateScrollProgress, { passive: true });
    window.addEventListener("resize", updateScrollProgress);

    return () => {
      window.removeEventListener("scroll", updateScrollProgress);
      window.removeEventListener("resize", updateScrollProgress);
    };
  }, []);

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
    uniforms.textureScale.value = THREE.MathUtils.damp(
      uniforms.textureScale.value as number,
      THREE.MathUtils.lerp(1.0, 5.0, scrollProgressRef.current),
      4.2,
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
      <WebGPUScene frameloop="always" orthographic>
        <HalftoneSketch />
        <Suspense fallback={null}>
          <IMacModel />
        </Suspense>
      </WebGPUScene>
      {/* TODO: good fade with ease sin, just at the sides not center */}
      {/* <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-b from-transparent to-[#FCFCFB]" /> */}
    </div>
  );
}
