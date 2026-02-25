import { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import * as THREE from 'three';

export function useHandTracking() {
  const targetRef = useRef<THREE.Vector3 | null>(null);
  const isFistRef = useRef<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let landmarker: HandLandmarker | null = null;
    let animationFrameId: number;

    const init = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
        );
        if (!active) return;
        
        landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numHands: 1
        });
        if (!active) return;

        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (videoRef.current && active) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          
          videoRef.current.onloadeddata = () => {
            setIsReady(true);
            detect();
          };
        }
      } catch (err: any) {
        console.error('Error accessing webcam or initializing MediaPipe:', err);
        setError(err.message || 'Failed to initialize hand tracking');
      }
    };

    const detect = () => {
      if (!active) return;
      if (videoRef.current && videoRef.current.readyState >= 2 && landmarker) {
        const results = landmarker.detectForVideo(videoRef.current, performance.now());
        
        if (results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];
          const landmark = landmarks[9]; // Middle finger MCP
          
          // Fist detection: check if fingertips are closer to wrist than MCP joints
          const isFingerCurled = (tipIdx: number, mcpIdx: number) => {
            const tip = landmarks[tipIdx];
            const mcp = landmarks[mcpIdx];
            const wrist = landmarks[0];
            const distTip = Math.hypot(wrist.x - tip.x, wrist.y - tip.y);
            const distMcp = Math.hypot(wrist.x - mcp.x, wrist.y - mcp.y);
            return distTip < distMcp;
          };
          
          const isFist = isFingerCurled(8, 5) && isFingerCurled(12, 9) && isFingerCurled(16, 13) && isFingerCurled(20, 17);
          isFistRef.current = isFist;
          
          // Map webcam coordinates to 3D space
          // Webcam X is 0 (left) to 1 (right). We mirror it so moving hand right moves target right.
          const x = -(landmark.x - 0.5) * 30; 
          const y = -(landmark.y - 0.5) * 20;
          const z = (landmark.z) * 20; // Depth
          
          if (!targetRef.current) {
            targetRef.current = new THREE.Vector3(x, y, z);
          } else {
            targetRef.current.x += (x - targetRef.current.x) * 0.2;
            targetRef.current.y += (y - targetRef.current.y) * 0.2;
            targetRef.current.z += (z - targetRef.current.z) * 0.2;
          }
        } else {
          // 0 hands
          targetRef.current = null;
          isFistRef.current = false;
        }
      }
      animationFrameId = requestAnimationFrame(detect);
    };

    init();

    return () => {
      active = false;
      cancelAnimationFrame(animationFrameId);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      if (landmarker) {
        landmarker.close();
      }
    };
  }, []);

  return { targetRef, videoRef, isReady, error, isFistRef };
}
