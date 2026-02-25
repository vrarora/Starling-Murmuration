import { create } from 'zustand';

interface SettingsState {
  // Boids
  boidCount: number;
  flightSpeed: number;
  cohesion: number;
  alignment: number;
  separation: number;
  perceptionRadius: number;
  
  // Environment
  sunElevation: number;
  sunAzimuth: number;
  skyTurbidity: number;
  skyRayleigh: number;
  mieCoefficient: number;
  mieDirectionalG: number;
  ambientLight: number;
  directionalLight: number;

  setSetting: (key: keyof Omit<SettingsState, 'setSetting'>, value: number) => void;
}

export const useSettings = create<SettingsState>((set) => ({
  boidCount: 1000,
  flightSpeed: 22,
  cohesion: 0.5,
  alignment: 2.0,
  separation: 0.8,
  perceptionRadius: 5.0,

  sunElevation: 2,
  sunAzimuth: 180,
  skyTurbidity: 5.2,
  skyRayleigh: 2.2,
  mieCoefficient: 0.001,
  mieDirectionalG: 0.63,
  ambientLight: 2.0,
  directionalLight: 1.4,

  setSetting: (key, value) => set({ [key]: value }),
}));
