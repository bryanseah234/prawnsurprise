import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Float, Environment, Center } from '@react-three/drei';
import * as THREE from 'three';
import { DieType } from '../../types';

// Fix for missing types in this environment
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      meshStandardMaterial: any;
      lineSegments: any;
      wireframeGeometry: any;
      lineBasicMaterial: any;
      ambientLight: any;
      pointLight: any;
      spotLight: any;
    }
  }
}

// --- GEOMETRY HELPERS ---

// Helper to create a custom D10 (Pentagonal Dipyramid)
const createD10Geometry = () => {
  const radius = 1;
  const height = 1.2;
  const vertices = [];
  const indices = [];

  // Top vertex
  vertices.push(0, height, 0);
  // Bottom vertex
  vertices.push(0, -height, 0);

  // Equatorial vertices (5)
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    vertices.push(Math.sin(angle) * radius, 0, Math.cos(angle) * radius);
  }

  // Faces
  // Top pyramid: Top (0), Eq(i), Eq(i+1)
  // Bottom pyramid: Bottom (1), Eq(i+1), Eq(i)
  for (let i = 0; i < 5; i++) {
    const current = i + 2;
    const next = ((i + 1) % 5) + 2;
    
    // Top face
    indices.push(0, current, next);
    // Bottom face
    indices.push(1, next, current);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
};

// --- DATA: FACE NORMALS & VALUES ---
// We define where each number is on the standard geometries so we can rotate them to face the camera.
// Normals are approximate "Up" vectors for the faces.

const getDieConfig = (type: DieType) => {
  const t = (1 + Math.sqrt(5)) / 2; // Golden ratio for Icosahedron if we used it, but we are using manual configs

  switch (type) {
    case DieType.D4:
        // Tetrahedron (Standard)
        // Faces are at tetrahedral angles.
        // We will construct vectors based on standard Tetrahedron geometry.
        const d4Geo = new THREE.TetrahedronGeometry(1.5);
        d4Geo.computeVertexNormals();
        // Extract face normals from geometry (approximate for the 4 faces)
        // Face 0: (1, 1, 1), Face 1: (-1, -1, 1), etc... 
        // We'll hardcode vectors that roughly match the visual center of faces
        return {
          geometry: d4Geo,
          faces: [
            { value: 1, normal: new THREE.Vector3(1, 1, 1).normalize() },
            { value: 2, normal: new THREE.Vector3(-1, -1, 1).normalize() },
            { value: 3, normal: new THREE.Vector3(-1, 1, -1).normalize() },
            { value: 4, normal: new THREE.Vector3(1, -1, -1).normalize() }
          ]
        };

    case DieType.D6:
        // Cube
        return {
          geometry: new THREE.BoxGeometry(2, 2, 2),
          faces: [
            { value: 1, normal: new THREE.Vector3(1, 0, 0) },
            { value: 2, normal: new THREE.Vector3(-1, 0, 0) },
            { value: 3, normal: new THREE.Vector3(0, 1, 0) },
            { value: 4, normal: new THREE.Vector3(0, -1, 0) },
            { value: 5, normal: new THREE.Vector3(0, 0, 1) },
            { value: 6, normal: new THREE.Vector3(0, 0, -1) }
          ]
        };

    case DieType.D8:
        // Octahedron
        return {
          geometry: new THREE.OctahedronGeometry(1.5),
          faces: [
             // Top pyramid 4
            { value: 1, normal: new THREE.Vector3(1, 1, 1).normalize() },
            { value: 2, normal: new THREE.Vector3(-1, 1, 1).normalize() },
            { value: 3, normal: new THREE.Vector3(1, 1, -1).normalize() },
            { value: 4, normal: new THREE.Vector3(-1, 1, -1).normalize() },
             // Bottom pyramid 4
            { value: 5, normal: new THREE.Vector3(1, -1, 1).normalize() },
            { value: 6, normal: new THREE.Vector3(-1, -1, 1).normalize() },
            { value: 7, normal: new THREE.Vector3(1, -1, -1).normalize() },
            { value: 8, normal: new THREE.Vector3(-1, -1, -1).normalize() },
          ]
        };

    case DieType.D10:
        // Custom Pentagonal Dipyramid
        const d10Geo = createD10Geometry();
        // Calculate face normals roughly. 
        // 5 top faces, 5 bottom faces.
        const d10Faces = [];
        for(let i=0; i<5; i++) {
             const angle = (i / 5) * Math.PI * 2 + (Math.PI/5); // Offset to center of face
             // Top faces (1, 3, 5, 7, 9)
             d10Faces.push({
                 value: i * 2 + 1,
                 normal: new THREE.Vector3(Math.sin(angle), 0.5, Math.cos(angle)).normalize()
             });
             // Bottom faces (2, 4, 6, 8, 10)
             d10Faces.push({
                 value: i * 2 + 2,
                 normal: new THREE.Vector3(Math.sin(angle), -0.5, Math.cos(angle)).normalize()
             });
        }

        return {
            geometry: d10Geo,
            faces: d10Faces
        };
  }
}

// --- COMPONENT: THE DIE MESH ---

const DieMesh = ({ type, result, isRolling }: { type: DieType, result: number | null, isRolling: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { geometry, faces } = useMemo(() => getDieConfig(type), [type]);
  
  // Random rotation speed vector
  const rotationSpeed = useRef(new THREE.Vector3(
     Math.random() * 0.2 + 0.1, 
     Math.random() * 0.2 + 0.1, 
     Math.random() * 0.2 + 0.1
  ));

  // Determine target rotation when result is present
  const targetQuaternion = useMemo(() => {
    if (result === null || !meshRef.current) return null;
    
    // Find the face definition for the result
    // Note: D10 logic above generates odds then evens, we need to search properly
    let face = faces.find(f => f.value === result);
    // Fallback if mismatch
    if (!face) face = faces[0];

    // We want this face normal to point towards Camera Z (0, 0, 1)
    // or slightly tilted for better viewing angle, let's say (0, 0.2, 1) normalized
    const targetVec = new THREE.Vector3(0, 0, 1);
    
    const quaternion = new THREE.Quaternion();
    // setFromUnitVectors calculates rotation from A to B
    quaternion.setFromUnitVectors(face.normal, targetVec);
    return quaternion;

  }, [result, faces]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    if (isRolling) {
      // Wild Spin
      meshRef.current.rotation.x += rotationSpeed.current.x;
      meshRef.current.rotation.y += rotationSpeed.current.y;
      meshRef.current.rotation.z += rotationSpeed.current.z;
    } else if (result !== null && targetQuaternion) {
      // Deterministic Landing: Smoothly interpolate to the target quaternion
      meshRef.current.quaternion.slerp(targetQuaternion, 0.1);
    }
  });

  return (
    <group>
        <mesh ref={meshRef} geometry={geometry}>
            <meshStandardMaterial color="#FF6F61" roughness={0.4} metalness={0.1} flatShading />
            
            {/* Render Numbers on Faces */}
            {faces.map((face, i) => (
                <FaceNumber key={i} position={face.normal.clone().multiplyScalar(type === DieType.D4 ? 0.9 : 1.1)} normal={face.normal} value={face.value} />
            ))}
            
            {/* Wireframe for retro look */}
            <lineSegments>
                <wireframeGeometry args={[geometry]} />
                <lineBasicMaterial color="black" linewidth={2} />
            </lineSegments>
        </mesh>
    </group>
  );
};

// Helper to place text on the die surface
const FaceNumber = ({ position, normal, value }: { position: THREE.Vector3, normal: THREE.Vector3, value: number }) => {
    return (
        <group position={position} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal)}>
             <Text
                color="white"
                fontSize={0.6}
                font="https://fonts.gstatic.com/s/pressstart2p/v14/e3t4euO8T-267oIAQAu6jDQyK3nVivM.woff" // Google Font URL direct
                anchorX="center"
                anchorY="middle"
            >
                {value}
            </Text>
        </group>
    )
}


// --- MAIN EXPORT ---

interface Die3DProps {
  type: DieType;
  value: number | null;
  isRolling: boolean;
}

export const Die3D: React.FC<Die3DProps> = ({ type, value, isRolling }) => {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        {/* Lighting */}
        <ambientLight intensity={1.5} />
        <pointLight position={[10, 10, 10]} intensity={2} />
        <spotLight position={[-10, -10, 10]} angle={0.3} />

        {/* Floating container for idle anim */}
        <Float speed={isRolling ? 0 : 2} rotationIntensity={isRolling ? 0 : 0.5} floatIntensity={isRolling ? 0 : 0.5}>
           <DieMesh type={type} result={value} isRolling={isRolling} />
        </Float>
      </Canvas>
    </div>
  );
};