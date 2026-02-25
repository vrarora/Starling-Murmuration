import React, { useState } from 'react';

type Tab = 'BOIDS' | 'ENVIRONMENT' | 'EFFECTS';

export function SettingsPanel({ params, setParams }: { params: any, setParams: any }) {
  const [activeTab, setActiveTab] = useState<Tab>('BOIDS');

  const Slider = ({ label, value, min, max, step, onChange }: any) => (
    <div className="mb-5">
      <div className="flex justify-between text-[10px] text-white/70 tracking-widest mb-3 uppercase font-medium">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
      />
    </div>
  );

  return (
    <div className="absolute right-8 top-24 w-[320px] bg-black/10 backdrop-blur-xl border border-white/10 rounded-2xl p-6 z-10 shadow-2xl">
      <div className="flex gap-6 mb-8 border-b border-white/10">
        {['BOIDS', 'ENVIRONMENT', 'EFFECTS'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as Tab)}
            className={`text-[10px] font-medium tracking-widest uppercase pb-3 -mb-[1px] border-b-2 transition-colors ${
              activeTab === tab ? 'text-white border-white' : 'text-white/50 border-transparent hover:text-white/80'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {activeTab === 'BOIDS' && (
          <>
            <Slider label="Bird Count" value={params.birdCount} min={100} max={10000} step={100} onChange={(v: number) => setParams({ ...params, birdCount: v })} />
            <Slider label="Flight Speed" value={params.flightSpeed} min={5} max={30} step={1} onChange={(v: number) => setParams({ ...params, flightSpeed: v })} />
            <Slider label="Cohesion" value={params.cohesion} min={0} max={2} step={0.1} onChange={(v: number) => setParams({ ...params, cohesion: v })} />
            <Slider label="Alignment" value={params.alignment} min={0} max={5} step={0.1} onChange={(v: number) => setParams({ ...params, alignment: v })} />
            <Slider label="Separation" value={params.separation} min={0} max={2} step={0.1} onChange={(v: number) => setParams({ ...params, separation: v })} />
            <Slider label="Perception Radius" value={params.perceptionRadius} min={1} max={10} step={0.1} onChange={(v: number) => setParams({ ...params, perceptionRadius: v })} />
          </>
        )}
        {activeTab === 'ENVIRONMENT' && (
          <>
            <Slider label="Sun Elevation" value={params.sunElevation} min={-10} max={90} step={1} onChange={(v: number) => setParams({ ...params, sunElevation: v })} />
            <Slider label="Sun Azimuth" value={params.sunAzimuth} min={0} max={360} step={1} onChange={(v: number) => setParams({ ...params, sunAzimuth: v })} />
            <Slider label="Sky Turbidity" value={params.skyTurbidity} min={0} max={20} step={0.1} onChange={(v: number) => setParams({ ...params, skyTurbidity: v })} />
            <Slider label="Sky Rayleigh" value={params.skyRayleigh} min={0} max={4} step={0.1} onChange={(v: number) => setParams({ ...params, skyRayleigh: v })} />
            <Slider label="Mie Coefficient" value={params.mieCoefficient} min={0} max={0.1} step={0.001} onChange={(v: number) => setParams({ ...params, mieCoefficient: v })} />
            <Slider label="Mie Directional G" value={params.mieDirectionalG} min={0} max={1} step={0.01} onChange={(v: number) => setParams({ ...params, mieDirectionalG: v })} />
            <Slider label="Ambient Light" value={params.ambientLight} min={0} max={5} step={0.1} onChange={(v: number) => setParams({ ...params, ambientLight: v })} />
            <Slider label="Directional Light" value={params.directionalLight} min={0} max={5} step={0.1} onChange={(v: number) => setParams({ ...params, directionalLight: v })} />
          </>
        )}
        {activeTab === 'EFFECTS' && (
          <div className="text-white/50 text-xs text-center py-4">Effects settings coming soon</div>
        )}
      </div>
    </div>
  );
}
