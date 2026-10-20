"use client";

import { useState } from "react";
import type { SiteData, PhaseData } from "@/app/parks/[id]/page";

interface RevenueCalcProps {
  sites: SiteData[];
  phases: PhaseData[];
}

function fmt(n: number) {
  return "$" + Math.round(n).toLocaleString();
}

export default function RevenueCalc({ sites, phases }: RevenueCalcProps) {
  const [rate, setRate] = useState(45);
  const [occ, setOcc] = useState(65);

  const annual = sites.length * rate * (occ / 100) * 365;
  const monthly = annual / 12;

  const phaseRevenue = phases.map((ph) => {
    const count = sites.filter((s) => s.phaseId === ph.id).length;
    return { ...ph, count, annual: count * rate * (occ / 100) * 365 };
  });

  const unassigned = sites.filter((s) => !s.phaseId).length;

  return (
    <div className="space-y-3">
      <p className="text-gray-400 text-xs uppercase tracking-wider">Revenue Calculator</p>

      <div className="space-y-2">
        <div>
          <label className="text-gray-500 text-xs">Avg Nightly Rate</label>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-gray-400 text-sm">$</span>
            <input
              type="number"
              value={rate}
              onChange={(e) => setRate(parseInt(e.target.value) || 0)}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-green-500"
            />
          </div>
        </div>
        <div>
          <label className="text-gray-500 text-xs">Occupancy %</label>
          <input
            type="range"
            min={0}
            max={100}
            value={occ}
            onChange={(e) => setOcc(parseInt(e.target.value))}
            className="w-full mt-1 accent-green-500"
          />
          <div className="flex justify-between text-gray-500 text-xs">
            <span>0%</span>
            <span className="text-green-400 font-medium">{occ}%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-3 space-y-1.5">
        <div className="flex justify-between">
          <span className="text-gray-400 text-xs">Monthly</span>
          <span className="text-white font-semibold text-sm">{fmt(monthly)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 text-xs">Annual</span>
          <span className="text-green-400 font-bold">{fmt(annual)}</span>
        </div>
        <div className="text-gray-600 text-xs pt-1">
          {sites.length} sites × {fmt(rate)}/night × {occ}%
        </div>
      </div>

      {phaseRevenue.length > 0 && (
        <div className="space-y-1">
          <p className="text-gray-500 text-xs">By Phase</p>
          {phaseRevenue.map((ph) => (
            <div key={ph.id} className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ph.color }} />
              <span className="text-gray-400 flex-1">{ph.name} ({ph.count})</span>
              <span className="text-white">{fmt(ph.annual)}</span>
            </div>
          ))}
          {unassigned > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-gray-600" />
              <span className="text-gray-400 flex-1">Unassigned ({unassigned})</span>
              <span className="text-white">{fmt(unassigned * rate * (occ / 100) * 365)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
