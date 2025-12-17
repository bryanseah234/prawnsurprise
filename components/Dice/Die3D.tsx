import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import { DieType } from '../../types';

// Use string tags for intrinsic elements to avoid TypeScript environment issues
const Group = 'group' as any;
const Mesh = 'mesh' as any;
const MeshStandardMaterial = 'meshStandardMaterial' as any;
const LineSegments = 'lineSegments' as any;
const EdgesGeometry = 'edgesGeometry' as any;
const LineBasicMaterial = 'lineBasicMaterial' as any;
const AmbientLight = 'ambientLight' as any;
const PointLight = 'pointLight' as any;
const SpotLight = 'spotLight' as any;

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

const getDieConfig = (type: DieType) => {
  switch (type) {
    case DieType.D4: {
        // Tetrahedron (Radius 1.5)
        // Distance to face center = radius / 3 = 0.5
        // Note: Standard Tetrahedron vertices are (1,1,1), (1,-1,-1), (-1,1,-1), (-1,-1,1).
        // The Faces are OPPOSITE these vertices.
        const d4Geo = new THREE.TetrahedronGeometry(1.5);
        d4Geo.computeVertexNormals();
        return {
          geometry: d4Geo,
          textOffset: 0.6, // Just above the surface (0.5)
          fontSize: 0.35,
          faces: [
            // Inverted vectors to point to faces, not vertices
            { value: 1, normal: new THREE.Vector3(-1, -1, -1).normalize() },
            { value: 2, normal: new THREE.Vector3(1, 1, -1).normalize() },
            { value: 3, normal: new THREE.Vector3(1, -1, 1).normalize() },
            { value: 4, normal: new THREE.Vector3(-1, 1, 1).normalize() }
          ]
        };
    }

    case DieType.D6: {
        // Cube (Size 2)
        // Distance to face center = 1.0
        return {
          geometry: new THREE.BoxGeometry(2, 2, 2),
          textOffset: 1.05, 
          fontSize: 0.8,
          faces: [
            { value: 1, normal: new THREE.Vector3(1, 0, 0) },
            { value: 2, normal: new THREE.Vector3(-1, 0, 0) },
            { value: 3, normal: new THREE.Vector3(0, 1, 0) },
            { value: 4, normal: new THREE.Vector3(0, -1, 0) },
            { value: 5, normal: new THREE.Vector3(0, 0, 1) },
            { value: 6, normal: new THREE.Vector3(0, 0, -1) }
          ]
        };
    }

    case DieType.D8: {
        // Octahedron (Radius 1.5)
        // Distance to face center ~ 0.866
        return {
          geometry: new THREE.OctahedronGeometry(1.5),
          textOffset: 0.88,
          fontSize: 0.45,
          faces: [
            { value: 1, normal: new THREE.Vector3(1, 1, 1).normalize() },
            { value: 2, normal: new THREE.Vector3(-1, 1, 1).normalize() },
            { value: 3, normal: new THREE.Vector3(1, 1, -1).normalize() },
            { value: 4, normal: new THREE.Vector3(-1, 1, -1).normalize() },
            { value: 5, normal: new THREE.Vector3(1, -1, 1).normalize() },
            { value: 6, normal: new THREE.Vector3(-1, -1, 1).normalize() },
            { value: 7, normal: new THREE.Vector3(1, -1, -1).normalize() },
            { value: 8, normal: new THREE.Vector3(-1, -1, -1).normalize() },
          ]
        };
    }

    case DieType.D10: {
        // Custom D10
        // Radius=1, Height=1.2
        // Face angle logic needs to align with the slope of the pyramid.
        // Slope vector is (1.2, 1) relative to (r, y).
        const d10Geo = createD10Geometry();
        const d10Faces = [];
        
        // Slope factor for normal calculation
        // For a cone with radius R and height H, normal has slope R/H in (r,y) space? 
        // Normal vector N = (H, R)
        const slopeH = 1.2;
        const slopeR = 1.0;

        for(let i=0; i<5; i++) {
             // Rotate by PI/5 to align with face centers (between vertices)
             const angle = (i / 5) * Math.PI * 2 + (Math.PI/5); 
             
             // Top faces: Normal points UP and OUT
             d10Faces.push({
                 value: i * 2 + 1,
                 normal: new THREE.Vector3(Math.sin(angle) * slopeH, slopeR, Math.cos(angle) * slopeH).normalize()
             });
             // Bottom faces: Normal points DOWN and OUT
             d10Faces.push({
                 value: i * 2 + 2,
                 normal: new THREE.Vector3(Math.sin(angle) * slopeH, -slopeR, Math.cos(angle) * slopeH).normalize()
             });
        }

        return {
            geometry: d10Geo,
            textOffset: 0.95, // Increased offset to safely clear the geometry (Face distance ~0.77)
            fontSize: 0.35, 
            faces: d10Faces
        };
    }
  }
}

// --- COMPONENT: THE DIE MESH ---

const DieMesh = ({ type, result, isRolling }: { type: DieType, result: number | null, isRolling: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { geometry, faces, textOffset, fontSize } = useMemo(() => getDieConfig(type), [type]);
  
  const rotationSpeed = useRef(new THREE.Vector3(
     Math.random() * 0.2 + 0.1, 
     Math.random() * 0.2 + 0.1, 
     Math.random() * 0.2 + 0.1
  ));

  const targetQuaternion = useMemo(() => {
    if (result === null || !meshRef.current) return null;
    
    let face = faces.find(f => f.value === result);
    if (!face) face = faces[0];

    // Align the face normal to +Z (camera)
    const targetVec = new THREE.Vector3(0, 0, 1);
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(face.normal, targetVec);
    return quaternion;

  }, [result, faces]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    if (isRolling) {
      meshRef.current.rotation.x += rotationSpeed.current.x;
      meshRef.current.rotation.y += rotationSpeed.current.y;
      meshRef.current.rotation.z += rotationSpeed.current.z;
    } else if (result !== null && targetQuaternion) {
      // Smoothly slerp to target
      meshRef.current.quaternion.slerp(targetQuaternion, 0.1);
    }
  });

  return (
    <Group>
        <Mesh ref={meshRef} geometry={geometry}>
            {/* Coral material */}
            <MeshStandardMaterial color="#FF6F61" roughness={0.4} metalness={0.1} flatShading />
            
            {/* Render Numbers on Faces - Black for contrast */}
            {faces.map((face, i) => (
                <FaceNumber 
                  key={i} 
                  position={face.normal.clone().multiplyScalar(textOffset)} 
                  normal={face.normal} 
                  value={face.value} 
                  fontSize={fontSize}
                />
            ))}
            
            {/* Wireframe/Edges */}
            <LineSegments>
                <EdgesGeometry args={[geometry, 15]} />
                <LineBasicMaterial color="black" linewidth={2} />
            </LineSegments>
        </Mesh>
    </Group>
  );
};

const FaceNumber = ({ position, normal, value, fontSize }: { position: THREE.Vector3, normal: THREE.Vector3, value: number, fontSize: number }) => {
    return (
        <Group position={position} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal)}>
             <Text
                color="black"
                fontSize={fontSize}
                font="https://fonts.gstatic.com/s/pressstart2p/v14/e3t4euO8T-267oIAQAu6jDQyK3nVivM.woff"
                anchorX="center"
                anchorY="middle"
                renderOrder={1} // Ensure text renders on top of the face
            >
                {value}
            </Text>
        </Group>
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
        <AmbientLight intensity={1.5} />
        <PointLight position={[10, 10, 10]} intensity={2} />
        <SpotLight position={[-10, -10, 10]} angle={0.3} />

        <Float speed={isRolling ? 0 : 2} rotationIntensity={isRolling ? 0 : 0.5} floatIntensity={isRolling ? 0 : 0.5}>
           <DieMesh type={type} result={value} isRolling={isRolling} />
        </Float>
      </Canvas>
    </div>
  );
};