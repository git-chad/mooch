"use client";

import { Environment, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useLayoutEffect, useMemo } from "react";
import * as THREE from "three";

const MODEL_URL = "/models/imac-g3-v1.1.glb";
const DRACO_DECODER_URL =
  "https://www.gstatic.com/draco/versioned/decoders/1.5.7/";

function CameraRig() {
  const camera = useThree((state) => state.camera);
  const pointer = useThree((state) => state.pointer);

  useFrame((_, delta) => {
    const targetX = pointer.x * 0.16;
    const targetY = 0.2 + pointer.y * 0.11;

    camera.position.x = THREE.MathUtils.damp(
      camera.position.x,
      targetX,
      4.5,
      delta,
    );
    camera.position.y = THREE.MathUtils.damp(
      camera.position.y,
      targetY,
      4.5,
      delta,
    );
    camera.position.z = THREE.MathUtils.damp(
      camera.position.z,
      4.7,
      4.5,
      delta,
    );
    camera.lookAt(0, 0.1, 0);
  });

  return null;
}

function IMacModel() {
  const { scene } = useGLTF(MODEL_URL, DRACO_DECODER_URL);
  const model = useMemo(() => scene.clone(), [scene]);

  useLayoutEffect(() => {
    const meshBox = new THREE.Box3();
    const worldBox = new THREE.Box3();
    const tempBox = new THREE.Box3();

    model.updateWorldMatrix(true, true);

    model.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) {
        return;
      }

      const materials = Array.isArray(obj.material)
        ? obj.material
        : [obj.material];

      const nextMaterials = materials.map((material) => {
        const m = material.clone();
        const matName = m.name.toLowerCase();
        const isScreen = matName.includes("screen");

        if (!isScreen) {
          m.transparent = false;
          m.opacity = 1;
          m.alphaTest = 0;
          m.depthWrite = true;
        }

        return m;
      });

      obj.material = Array.isArray(obj.material)
        ? nextMaterials
        : nextMaterials[0];

      obj.geometry.computeBoundingBox();
      if (!obj.geometry.boundingBox) {
        return;
      }

      tempBox.copy(obj.geometry.boundingBox).applyMatrix4(obj.matrixWorld);
      if (meshBox.isEmpty()) {
        meshBox.copy(tempBox);
      } else {
        meshBox.union(tempBox);
      }
    });

    if (meshBox.isEmpty()) {
      return;
    }

    const size = meshBox.getSize(new THREE.Vector3());
    const center = meshBox.getCenter(new THREE.Vector3());
    model.position.sub(center);

    const maxAxis = Math.max(size.x, size.y, size.z);
    const targetMaxDim = 3.3;
    const scalar = maxAxis > 0 ? targetMaxDim / maxAxis : 1;
    model.scale.setScalar(scalar);

    worldBox.setFromObject(model);
    const bottom = worldBox.min.y;
    model.position.y -= bottom + 1.42;
  }, [model]);

  return (
    <group position={[0, -0.15, 0]} rotation={[0, -Math.PI / 2, 0]}>
      <primitive object={model} />
    </group>
  );
}

export function HeroModel() {
  return (
    <div className="h-[420px] w-full overflow-hidden rounded-[16px]">
      <Canvas
        dpr={[1, 1.5]}
        camera={{
          fov: 30,
          near: 0.1,
          far: 100,
          position: [0, 0.23, 5.05],
        }}
      >
        <color attach="background" args={["#FCFCFB"]} />
        <ambientLight intensity={0.65} />
        <directionalLight intensity={1.25} position={[3, 5, 4]} />
        <Suspense fallback={null}>
          <IMacModel />
          <Environment preset="studio" />
        </Suspense>
        <CameraRig />
      </Canvas>
    </div>
  );
}
