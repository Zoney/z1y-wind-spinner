'use client';

import { useState } from 'react';
import { WindmillConfig } from '@/types/windmill';

interface WindmillControlsProps {
  windmills: WindmillConfig[];
  onWindmillUpdate: (updatedWindmills: WindmillConfig[]) => void;
}

export function WindmillControls({ windmills, onWindmillUpdate }: WindmillControlsProps) {
  const [selectedWindmill, setSelectedWindmill] = useState<string>(windmills[0]?.id || '');
  const [isOpen, setIsOpen] = useState(false);

  const handleUpdate = (field: string, value: number) => {
    const updatedWindmills = windmills.map(windmill => {
      if (windmill.id === selectedWindmill) {
        if (field.includes('.')) {
          const [parent, child] = field.split('.');
          return {
            ...windmill,
            [parent]: {
              ...(windmill[parent as keyof WindmillConfig] as object),
              [child]: value
            }
          };
        }
        return { ...windmill, [field]: value };
      }
      return windmill;
    });
    onWindmillUpdate(updatedWindmills);
  };

  const selectedConfig = windmills.find(w => w.id === selectedWindmill);

  if (!selectedConfig) return null;

  return (
    <div className="absolute top-4 right-4 z-10 bg-black/75 text-white p-4 rounded-lg max-w-sm">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left font-bold mb-2 hover:text-blue-300"
      >
        Windmill Settings {isOpen ? '▼' : '▶'}
      </button>
      
      {isOpen && (
        <div className="space-y-3 text-sm">
          <div>
            <label className="block mb-1">Select Windmill:</label>
            <select 
              value={selectedWindmill}
              onChange={(e) => setSelectedWindmill(e.target.value)}
              className="w-full bg-gray-700 rounded p-1"
            >
              {windmills.map(windmill => (
                <option key={windmill.id} value={windmill.id}>
                  {windmill.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1">Height (m):</label>
            <input 
              type="number" 
              value={selectedConfig.height}
              onChange={(e) => handleUpdate('height', Number(e.target.value))}
              className="w-full bg-gray-700 rounded p-1"
            />
          </div>

          <div>
            <label className="block mb-1">Blade Length (m):</label>
            <input 
              type="number" 
              value={selectedConfig.bladeLength}
              onChange={(e) => handleUpdate('bladeLength', Number(e.target.value))}
              className="w-full bg-gray-700 rounded p-1"
            />
          </div>

          <div>
            <label className="block mb-1">Blade Width (m):</label>
            <input 
              type="number" 
              step="0.1"
              value={selectedConfig.bladeWidth}
              onChange={(e) => handleUpdate('bladeWidth', Number(e.target.value))}
              className="w-full bg-gray-700 rounded p-1"
            />
          </div>

          <div>
            <label className="block mb-1">Rotation Speed:</label>
            <input 
              type="number" 
              step="0.1"
              value={selectedConfig.rotationSpeed}
              onChange={(e) => handleUpdate('rotationSpeed', Number(e.target.value))}
              className="w-full bg-gray-700 rounded p-1"
            />
          </div>

          <div>
            <label className="block mb-1">Latitude:</label>
            <input 
              type="number" 
              step="0.0001"
              value={selectedConfig.position.latitude}
              onChange={(e) => handleUpdate('position.latitude', Number(e.target.value))}
              className="w-full bg-gray-700 rounded p-1"
            />
          </div>

          <div>
            <label className="block mb-1">Longitude:</label>
            <input 
              type="number" 
              step="0.0001"
              value={selectedConfig.position.longitude}
              onChange={(e) => handleUpdate('position.longitude', Number(e.target.value))}
              className="w-full bg-gray-700 rounded p-1"
            />
          </div>

          <div>
            <label className="block mb-1">Noise @ 100m (dB):</label>
            <input 
              type="number" 
              value={selectedConfig.noiseLevel.distance100m}
              onChange={(e) => handleUpdate('noiseLevel.distance100m', Number(e.target.value))}
              className="w-full bg-gray-700 rounded p-1"
            />
          </div>
        </div>
      )}
    </div>
  );
}