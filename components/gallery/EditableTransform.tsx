'use client';

import { useRef, useState } from 'react';
import { TransformControls, Html } from '@react-three/drei';
import { useControls, button } from 'leva';
import * as THREE from 'three';

interface EditableTransformProps {
  name: string;
  initialPosition: [number, number, number];
  initialRotation?: [number, number, number];
  editMode: boolean;
  children: React.ReactNode;
}

export default function EditableTransform({ name, initialPosition, initialRotation = [0, 0, 0], editMode, children }: EditableTransformProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [position, setPosition] = useState<[number, number, number]>(initialPosition);
  const [rotation, setRotation] = useState<[number, number, number]>(initialRotation);

  // Add a button to Leva for this specific object to copy its coordinates
  const { mode } = useControls(
    name,
    {
      copyTransform: button(() => {
        // When using TransformControls, the position/rotation is applied to the TransformControls object itself,
        // not the groupRef inside it. We need to read from our state which is updated onMouseUp.
        // If the user hasn't released the mouse yet, we can read directly from the TransformControls object
        // by accessing the groupRef's parent (which is the TransformControls object)
        let currentPos = position;
        let currentRot = rotation;
        
        if (groupRef.current && groupRef.current.parent) {
          // The parent of groupRef is the TransformControls object
          const { x, y, z } = groupRef.current.parent.position;
          currentPos = [x, y, z];
          const { x: rx, y: ry, z: rz } = groupRef.current.parent.rotation;
          currentRot = [rx, ry, rz];
        }

        const posString = `[${currentPos[0].toFixed(2)}, ${currentPos[1].toFixed(2)}, ${currentPos[2].toFixed(2)}]`;
        const rotString = `[${currentRot[0].toFixed(2)}, ${currentRot[1].toFixed(2)}, ${currentRot[2].toFixed(2)}]`;
        
        const out = `Position: ${posString}\nRotation: ${rotString}`;
        navigator.clipboard.writeText(out);
        alert(`Copied ${name} transform:\n${out}`);
      }),
      mode: {
        options: ['translate', 'rotate', 'scale'],
        value: 'translate',
      }
    },
    // Only show this folder in Leva when editMode is true
    { render: (get) => get('editMode') }
  );

  if (!editMode) {
    return (
      <group position={position} rotation={rotation} ref={groupRef}>
        {children}
      </group>
    );
  }

  return (
    <TransformControls
      mode={mode as any}
      position={position}
      rotation={rotation}
      onMouseUp={(e: any) => {
        // Save the new position when the user finishes dragging
        // so it doesn't snap back when editMode is toggled off
        if (e?.target?.object) {
          const { x, y, z } = e.target.object.position;
          setPosition([x, y, z]);
          const { x: rx, y: ry, z: rz } = e.target.object.rotation;
          setRotation([rx, ry, rz]);
        }
      }}
    >
      <group ref={groupRef}>
        {children}
      </group>
    </TransformControls>
  );
}
