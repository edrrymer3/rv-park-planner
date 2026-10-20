"use client";

import { Trash2 } from "lucide-react";
import type { SiteData, PhaseData } from "@/app/parks/[id]/page";

interface SitePropertiesProps {
  site: SiteData;
  phases: PhaseData[];
  onUpdate: (updates: Partial<SiteData>) => void;
  onDelete: () => void;
}

const AMENITIES = [
  { id: "electric", label: "⚡ Electric" },
  { id: "water", label: "💧 Water" },
  { id: "sewer", label: "🚰 Sewer" },
  { id: "wifi", label: "📶 WiFi" },
  { id: "shade", label: "🌲 Shade" },
  { id: "concrete", label: "🏗️ Concrete" },
];

export default function SiteProperties({ site, phases, onUpdate, onDelete }: SitePropertiesProps) {
  const amenities: string[] = site.amenities ? JSON.parse(site.amenities) : [];

  function toggleAmenity(id: string) {
    const updated = amenities.includes(id)
      ? amenities.filter((a) => a !== id)
      : [...amenities, id];
    onUpdate({ amenities: JSON.stringify(updated) });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-xs uppercase tracking-wider">Site Properties</p>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{
            backgroundColor:
              site.type === "pull-through" ? "#1d4ed8" + "33" : "#166534" + "33",
            color: site.type === "pull-through" ? "#93c5fd" : "#86efac",
          }}
        >
          {site.type === "pull-through" ? "Pull-Through" : "Back-In"}
        </span>
      </div>

      <div>
        <label className="text-gray-500 text-xs">Label</label>
        <input
          value={site.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          className="mt-1 w-full bg-gray-800 text-white border border-gray-700 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-green-500"
        />
      </div>

      <div>
        <label className="text-gray-500 text-xs">Type</label>
        <select
          value={site.type}
          onChange={(e) =>
            onUpdate({
              type: e.target.value as "back-in" | "pull-through",
              width: e.target.value === "pull-through" ? 80 : 60,
            })
          }
          className="mt-1 w-full bg-gray-800 text-white border border-gray-700 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-green-500"
        >
          <option value="back-in">Back-In</option>
          <option value="pull-through">Pull-Through</option>
        </select>
      </div>

      <div>
        <label className="text-gray-500 text-xs">Phase</label>
        <select
          value={site.phaseId || ""}
          onChange={(e) => onUpdate({ phaseId: e.target.value || null })}
          className="mt-1 w-full bg-gray-800 text-white border border-gray-700 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-green-500"
        >
          <option value="">No Phase</option>
          {phases.map((ph) => (
            <option key={ph.id} value={ph.id}>
              {ph.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-gray-500 text-xs mb-1.5 block">Amenities</label>
        <div className="grid grid-cols-2 gap-1">
          {AMENITIES.map((a) => {
            const active = amenities.includes(a.id);
            return (
              <button
                key={a.id}
                onClick={() => toggleAmenity(a.id)}
                className={`text-xs py-1 px-2 rounded-lg transition-colors text-left ${
                  active
                    ? "bg-green-700/40 text-green-300 border border-green-600"
                    : "bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600"
                }`}
              >
                {a.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="text-gray-600 text-xs space-y-0.5 pt-1">
        <p>Position: ({Math.round(site.x)}, {Math.round(site.y)})</p>
        <p>Size: {site.width}×{site.height}px</p>
      </div>

      <button
        onClick={onDelete}
        className="w-full flex items-center justify-center gap-2 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors text-sm border border-red-900/30 hover:border-red-800"
      >
        <Trash2 size={14} />
        Delete Site
      </button>
    </div>
  );
}
