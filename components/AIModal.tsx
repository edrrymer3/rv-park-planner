"use client";

import { useState } from "react";
import { X, Sparkles, CheckCircle, AlertCircle } from "lucide-react";
import type { ParkData, PhaseData, SiteData } from "@/app/parks/[id]/page";

interface AIModalProps {
  park: ParkData;
  phases: PhaseData[];
  onClose: () => void;
  onApply: (sites: Omit<SiteData, "id">[]) => Promise<void>;
  onPhasesCreated: (phases: PhaseData[]) => void;
  parkId: string;
}

interface LayoutSuggestion {
  totalSites: number;
  pullThroughCount: number;
  backInCount: number;
  pullThroughRatio: number;
  roadWidthFt: number;
  utilityRunRecommendation: string;
  layoutNotes: string;
  phases: Array<{ name: string; siteCount: number; description: string; estimatedRevenue?: number }>;
  _mock?: boolean;
}

const PHASE_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6"];

export default function AIModal({ park, phases, onClose, onApply, onPhasesCreated, parkId }: AIModalProps) {
  const [acreage, setAcreage] = useState(park.acreage?.toString() || "");
  const [goals, setGoals] = useState("maximize revenue, family-friendly, mix of pull-through and back-in");
  const [phaseCount, setPhaseCount] = useState(2);
  const [avgRate, setAvgRate] = useState(45);
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<LayoutSuggestion | null>(null);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    if (!acreage || parseFloat(acreage) <= 0) {
      setError("Please enter a valid acreage");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/parks/${parkId}/ai-layout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acreage: parseFloat(acreage), goals, phaseCount, avgNightlyRate: avgRate }),
      });
      if (!res.ok) throw new Error("AI request failed");
      const data: LayoutSuggestion = await res.json();
      setSuggestion(data);
    } catch (err) {
      setError("Failed to generate layout. Check your API key in .env");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function applyLayout() {
    if (!suggestion) return;
    setApplying(true);

    // Create phases for this suggestion
    const newPhases: PhaseData[] = [];
    for (let i = 0; i < suggestion.phases.length; i++) {
      const ph = suggestion.phases[i];
      // Only create if not already existing
      if (phases.length <= i) {
        const res = await fetch(`/api/parks/${parkId}/phases`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: ph.name, color: PHASE_COLORS[i % PHASE_COLORS.length] }),
        });
        if (res.ok) newPhases.push(await res.json());
      } else {
        newPhases.push(phases[i]);
      }
    }
    if (newPhases.length > 0) onPhasesCreated([...phases.filter(p => !newPhases.find(np => np.id === p.id)), ...newPhases]);

    // Generate site positions across the canvas
    const canvasW = 800;
    const canvasH = 580;
    const margin = 80;
    const siteW_pt = 80;
    const siteW_bi = 60;
    const siteH = 30;
    const gap = 10;

    const sitesToCreate: Omit<SiteData, "id">[] = [];
    const rows = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    let globalSiteIdx = 0;
    let phaseStartRow = 0;

    for (let pi = 0; pi < suggestion.phases.length; pi++) {
      const phase = suggestion.phases[pi];
      const phaseId = newPhases[pi]?.id || null;
      const pullCount = Math.round((suggestion.pullThroughRatio / 100) * phase.siteCount);
      const backInCount = phase.siteCount - pullCount;

      const phaseSites: Array<{ type: "pull-through" | "back-in" }> = [
        ...Array(pullCount).fill({ type: "pull-through" }),
        ...Array(backInCount).fill({ type: "back-in" }),
      ];

      for (let si = 0; si < phaseSites.length; si++) {
        const rowIdx = Math.floor(globalSiteIdx / 10) + phaseStartRow;
        const colIdx = globalSiteIdx % 10;
        const isPT = phaseSites[si].type === "pull-through";
        const w = isPT ? siteW_pt : siteW_bi;

        sitesToCreate.push({
          label: `${rows[rowIdx % 26]}${colIdx + 1}`,
          type: phaseSites[si].type,
          x: margin + colIdx * (siteW_pt + gap),
          y: margin + (Math.floor(globalSiteIdx / 10) + phaseStartRow) * (siteH + gap + 12),
          width: w,
          height: siteH,
          phaseId,
          amenities: null,
        });

        globalSiteIdx++;
      }
      phaseStartRow += Math.ceil(phaseSites.length / 10);
      globalSiteIdx = 0;
    }

    await onApply(sitesToCreate);
    setApplying(false);
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Sparkles size={18} className="text-green-400" />
            AI Layout Generator
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-400 text-sm mb-1.5">Acreage *</label>
              <input
                type="number"
                value={acreage}
                onChange={(e) => setAcreage(e.target.value)}
                placeholder="e.g. 5.5"
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1.5">Phases</label>
              <select
                value={phaseCount}
                onChange={(e) => setPhaseCount(parseInt(e.target.value))}
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
              >
                {[1, 2, 3, 4].map((n) => <option key={n} value={n}>Phase {n > 1 ? `1–${n}` : "1"}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1.5">Avg Nightly Rate ($)</label>
              <input
                type="number"
                value={avgRate}
                onChange={(e) => setAvgRate(parseInt(e.target.value))}
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1.5">Goals & Notes</label>
            <textarea
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              rows={2}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 resize-none"
              placeholder="e.g. maximize revenue, family-friendly, more pull-throughs..."
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 px-3 py-2 rounded-lg">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button
            onClick={generate}
            disabled={loading}
            className="w-full py-2.5 bg-green-600 hover:bg-green-500 disabled:bg-green-900 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles size={16} />
            {loading ? "Generating with Claude..." : "Generate Layout"}
          </button>

          {/* Results */}
          {suggestion && (
            <div className="space-y-4 border-t border-gray-800 pt-4">
              {suggestion._mock && (
                <div className="text-yellow-400 text-xs bg-yellow-900/20 px-3 py-1.5 rounded-lg">
                  ⚠️ Demo mode — add ANTHROPIC_API_KEY to .env for real AI suggestions
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Total Sites", value: suggestion.totalSites },
                  { label: "Pull-Through", value: suggestion.pullThroughCount },
                  { label: "Back-In", value: suggestion.backInCount },
                  { label: "Road Width", value: `${suggestion.roadWidthFt} ft` },
                  { label: "PT Ratio", value: `${suggestion.pullThroughRatio}%` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-800 rounded-lg p-3 text-center">
                    <p className="text-gray-400 text-xs">{label}</p>
                    <p className="text-white font-bold text-lg">{value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-gray-800 rounded-lg p-3 space-y-2">
                <p className="text-gray-300 text-sm">{suggestion.layoutNotes}</p>
                <p className="text-gray-400 text-xs">
                  <span className="text-green-400">Utility:</span> {suggestion.utilityRunRecommendation}
                </p>
              </div>

              {/* Phases */}
              <div className="space-y-2">
                {suggestion.phases.map((ph, i) => (
                  <div key={i} className="bg-gray-800 rounded-lg p-3 flex items-start gap-3">
                    <span
                      className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0"
                      style={{ backgroundColor: PHASE_COLORS[i % PHASE_COLORS.length] }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-white font-medium text-sm">{ph.name} — {ph.siteCount} sites</p>
                        {ph.estimatedRevenue && (
                          <p className="text-green-400 text-sm font-medium">
                            ${ph.estimatedRevenue.toLocaleString()}/yr
                          </p>
                        )}
                      </div>
                      <p className="text-gray-400 text-xs mt-0.5">{ph.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={applyLayout}
                disabled={applying}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle size={16} />
                {applying ? "Applying..." : "Apply This Layout"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
