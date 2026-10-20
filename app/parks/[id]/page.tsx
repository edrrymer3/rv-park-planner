"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ChevronLeft, Download, Save, Plus, Trash2, Sparkles, Upload, Layers } from "lucide-react";
import AIModal from "@/components/AIModal";
import RevenueCalc from "@/components/RevenueCalc";
import SiteProperties from "@/components/SiteProperties";
import { exportPDF } from "@/components/ExportPDF";

// Konva must be loaded client-side only
const CanvasEditor = dynamic(() => import("@/components/CanvasEditor"), { ssr: false });

export interface SiteData {
  id: string;
  label: string;
  type: "back-in" | "pull-through";
  x: number;
  y: number;
  width: number;
  height: number;
  phaseId: string | null;
  amenities: string | null;
}

export interface PhaseData {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface ParkData {
  id: string;
  name: string;
  acreage: number | null;
  description: string | null;
  imageUrl: string | null;
  sites: SiteData[];
  phases: PhaseData[];
}

function getNextLabel(sites: SiteData[]): string {
  const labels = new Set(sites.map((s) => s.label));
  const rows = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  for (const row of rows) {
    for (let n = 1; n <= 99; n++) {
      const label = `${row}${n}`;
      if (!labels.has(label)) return label;
    }
  }
  return `Z${sites.length + 1}`;
}

export default function ParkEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const [parkId, setParkId] = useState<string>("");
  const [park, setPark] = useState<ParkData | null>(null);
  const [sites, setSites] = useState<SiteData[]>([]);
  const [phases, setPhases] = useState<PhaseData[]>([]);
  const [selectedSite, setSelectedSite] = useState<SiteData | null>(null);
  const [showAI, setShowAI] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<{ toDataURL: () => string } | null>(null);

  useEffect(() => {
    params.then(({ id }) => {
      setParkId(id);
      loadPark(id);
    });
  }, []);

  async function loadPark(id: string) {
    const res = await fetch(`/api/parks/${id}`);
    if (!res.ok) return;
    const data: ParkData = await res.json();
    setPark(data);
    setSites(data.sites);
    setPhases(data.phases);
  }

  async function addSite(type: "back-in" | "pull-through" = "back-in") {
    if (!parkId) return;
    const label = getNextLabel(sites);
    const res = await fetch(`/api/parks/${parkId}/sites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label,
        type,
        x: 80 + Math.random() * 400,
        y: 80 + Math.random() * 300,
        phaseId: phases[0]?.id || null,
      }),
    });
    if (res.ok) {
      const site: SiteData = await res.json();
      setSites((prev) => [...prev, site]);
    }
  }

  async function updateSite(siteId: string, updates: Partial<SiteData>) {
    await fetch(`/api/parks/${parkId}/sites/${siteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    setSites((prev) =>
      prev.map((s) => (s.id === siteId ? { ...s, ...updates } : s))
    );
    if (selectedSite?.id === siteId) {
      setSelectedSite((prev) => (prev ? { ...prev, ...updates } : prev));
    }
  }

  async function deleteSite(siteId: string) {
    await fetch(`/api/parks/${parkId}/sites/${siteId}`, { method: "DELETE" });
    setSites((prev) => prev.filter((s) => s.id !== siteId));
    setSelectedSite(null);
  }

  async function addPhase() {
    if (!parkId) return;
    const res = await fetch(`/api/parks/${parkId}/phases`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      const phase: PhaseData = await res.json();
      setPhases((prev) => [...prev, phase]);
    }
  }

  async function applyAILayout(sitesToCreate: Omit<SiteData, "id">[]) {
    // Clear existing sites and create new ones from AI suggestion
    await fetch(`/api/parks/${parkId}/sites`, { method: "DELETE" });
    setSites([]);

    const created: SiteData[] = [];
    for (const s of sitesToCreate) {
      const res = await fetch(`/api/parks/${parkId}/sites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
      if (res.ok) created.push(await res.json());
    }
    setSites(created);
    setShowAI(false);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !parkId) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("image", file);
    const res = await fetch(`/api/parks/${parkId}/upload`, { method: "POST", body: fd });
    if (res.ok) {
      const { url } = await res.json();
      setPark((prev) => prev ? { ...prev, imageUrl: url } : prev);
    }
    setUploading(false);
  }

  async function savePark() {
    if (!park) return;
    setSaving(true);
    await fetch(`/api/parks/${parkId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: park.name }),
    });
    setSaving(false);
    setSaveMsg("Saved!");
    setTimeout(() => setSaveMsg(""), 2000);
  }

  async function handleExportPDF() {
    if (!park || !stageRef.current) return;
    const imgData = stageRef.current.toDataURL();
    await exportPDF({
      parkName: park.name,
      sites,
      phases,
      canvasDataUrl: imgData,
    });
  }

  if (!park) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">Loading park...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-950 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 bg-gray-900 border-b border-gray-800 flex-shrink-0">
        <Link href="/" className="text-gray-400 hover:text-white transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <span className="text-green-400 font-bold text-lg">🏕️ ParkSolves</span>
        <span className="text-gray-600">|</span>
        <h1 className="text-white font-semibold truncate">{park.name}</h1>
        {park.acreage && (
          <span className="text-gray-500 text-sm">{park.acreage} acres</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {saveMsg && <span className="text-green-400 text-sm">{saveMsg}</span>}
          <button
            onClick={savePark}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
          >
            <Save size={15} />
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg transition-colors"
          >
            <Download size={15} />
            Export PDF
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-52 bg-gray-900 border-r border-gray-800 flex flex-col overflow-y-auto flex-shrink-0">
          <div className="p-3 space-y-4">
            {/* Add Sites */}
            <section>
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Add Sites</p>
              <button
                onClick={() => addSite("back-in")}
                className="w-full flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors mb-1.5"
              >
                <Plus size={14} /> Back-In
              </button>
              <button
                onClick={() => addSite("pull-through")}
                className="w-full flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
              >
                <Plus size={14} /> Pull-Through
              </button>
            </section>

            {/* Phases */}
            <section>
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Phases</p>
              {phases.map((ph) => (
                <div
                  key={ph.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg mb-1 text-sm text-white"
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: ph.color }}
                  />
                  <span className="truncate">{ph.name}</span>
                  <span className="ml-auto text-gray-500 text-xs">
                    {sites.filter((s) => s.phaseId === ph.id).length}
                  </span>
                </div>
              ))}
              <button
                onClick={addPhase}
                className="w-full flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm rounded-lg transition-colors mt-1"
              >
                <Layers size={14} /> Add Phase
              </button>
            </section>

            {/* AI */}
            <section>
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">AI Layout</p>
              <button
                onClick={() => setShowAI(true)}
                className="w-full flex items-center gap-2 px-3 py-2 bg-green-700 hover:bg-green-600 text-white text-sm rounded-lg transition-colors"
              >
                <Sparkles size={14} /> Generate
              </button>
            </section>

            {/* Upload */}
            <section>
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Base Map</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
              >
                <Upload size={14} />
                {uploading ? "Uploading..." : park.imageUrl ? "Replace Image" : "Upload Image"}
              </button>
              {park.imageUrl && (
                <p className="text-gray-600 text-xs mt-1 truncate px-1">{park.imageUrl.split("/").pop()}</p>
              )}
            </section>

            {/* Stats */}
            <section className="border-t border-gray-800 pt-3">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Summary</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Total Sites</span>
                  <span className="text-white font-medium">{sites.length}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Pull-Through</span>
                  <span className="text-white">{sites.filter((s) => s.type === "pull-through").length}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Back-In</span>
                  <span className="text-white">{sites.filter((s) => s.type === "back-in").length}</span>
                </div>
              </div>
            </section>
          </div>
        </aside>

        {/* Canvas */}
        <main className="flex-1 relative overflow-hidden bg-gray-950">
          <CanvasEditor
            sites={sites}
            phases={phases}
            backgroundImage={park.imageUrl}
            selectedSiteId={selectedSite?.id || null}
            onSiteSelect={(site) => setSelectedSite(site)}
            onSiteMove={(id, x, y) => updateSite(id, { x, y })}
            stageRef={stageRef}
          />
          {sites.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-gray-600">
                <p className="text-4xl mb-3">🏕️</p>
                <p className="text-lg">No sites yet</p>
                <p className="text-sm mt-1">Add sites or use AI Generate to get started</p>
              </div>
            </div>
          )}
        </main>

        {/* Right Panel */}
        <aside className="w-64 bg-gray-900 border-l border-gray-800 flex flex-col overflow-y-auto flex-shrink-0">
          <div className="p-3 space-y-4">
            {selectedSite ? (
              <SiteProperties
                site={selectedSite}
                phases={phases}
                onUpdate={(updates) => updateSite(selectedSite.id, updates)}
                onDelete={() => deleteSite(selectedSite.id)}
              />
            ) : (
              <div className="text-gray-500 text-sm text-center pt-8">
                <p>Click a site on the canvas</p>
                <p className="text-xs mt-1">to edit its properties</p>
              </div>
            )}

            <div className="border-t border-gray-800 pt-3">
              <RevenueCalc sites={sites} phases={phases} />
            </div>
          </div>
        </aside>
      </div>

      {/* AI Modal */}
      {showAI && (
        <AIModal
          park={park}
          phases={phases}
          onClose={() => setShowAI(false)}
          onApply={applyAILayout}
          onPhasesCreated={(newPhases) => setPhases(newPhases)}
          parkId={parkId}
        />
      )}
    </div>
  );
}
