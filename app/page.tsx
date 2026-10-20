"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, MapPin, Layers, TrendingUp, Trash2, ExternalLink } from "lucide-react";

interface ParkSummary {
  id: string;
  name: string;
  acreage: number | null;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
  _count: { sites: number; phases: number };
  phases: Array<{ id: string; name: string; color: string }>;
}

export default function HomePage() {
  const [parks, setParks] = useState<ParkSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAcreage, setNewAcreage] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadParks(); }, []);

  async function loadParks() {
    const res = await fetch("/api/parks");
    if (res.ok) setParks(await res.json());
    setLoading(false);
  }

  async function createPark() {
    if (!newName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/parks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, acreage: newAcreage, description: newDesc }),
    });
    if (res.ok) {
      const park = await res.json();
      setParks((prev) => [park, ...prev]);
      setShowCreate(false);
      setNewName(""); setNewAcreage(""); setNewDesc("");
    }
    setCreating(false);
  }

  async function deletePark(id: string, e: React.MouseEvent) {
    e.preventDefault();
    if (!confirm("Delete this park?")) return;
    await fetch(`/api/parks/${id}`, { method: "DELETE" });
    setParks((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              🏕️ <span className="text-green-400">Park</span>Solves
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">AI-powered RV park layout & planning tool</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/billing"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Pricing
            </Link>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors"
            >
              <Plus size={16} />
              New Park
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats bar */}
        {parks.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { icon: MapPin, label: "Parks", value: parks.length },
              { icon: Layers, label: "Total Sites", value: parks.reduce((a, p) => a + p._count.sites, 0) },
              {
                icon: TrendingUp,
                label: "Est. Annual Rev",
                value: "$" + Math.round(
                  parks.reduce((a, p) => a + p._count.sites * 45 * 0.65 * 365, 0)
                ).toLocaleString(),
              },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                  <Icon size={15} />
                  {label}
                </div>
                <p className="text-2xl font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Park grid */}
        {loading ? (
          <div className="text-center py-20 text-gray-500 animate-pulse">Loading parks...</div>
        ) : parks.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-6xl mb-4">🏕️</p>
            <h2 className="text-xl font-semibold text-white mb-2">No parks yet</h2>
            <p className="text-gray-400 mb-6">Create your first RV park to get started with AI layout planning</p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl transition-colors"
            >
              Create Your First Park
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {parks.map((park) => (
              <Link
                key={park.id}
                href={`/parks/${park.id}`}
                className="group bg-gray-900 rounded-xl border border-gray-800 hover:border-green-700 transition-all overflow-hidden"
              >
                {/* Thumbnail */}
                <div className="h-36 bg-gray-800 relative overflow-hidden">
                  {park.imageUrl ? (
                    <img
                      src={park.imageUrl}
                      alt={park.name}
                      className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-4xl opacity-30">🗺️</div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {park.phases.slice(0, 3).map((ph) => (
                      <span
                        key={ph.id}
                        className="w-3 h-3 rounded-full border border-gray-700"
                        style={{ backgroundColor: ph.color }}
                        title={ph.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-white font-semibold group-hover:text-green-400 transition-colors">
                        {park.name}
                      </h3>
                      {park.acreage && (
                        <p className="text-gray-500 text-sm">{park.acreage} acres</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => deletePark(park.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 mt-3 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <MapPin size={13} />
                      {park._count.sites} sites
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers size={13} />
                      {park._count.phases} phases
                    </span>
                    {park._count.sites > 0 && (
                      <span className="text-green-500 text-xs ml-auto">
                        ~${Math.round(park._count.sites * 45 * 0.65 * 365).toLocaleString()}/yr
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}

            {/* Add new card */}
            <button
              onClick={() => setShowCreate(true)}
              className="bg-gray-900/50 rounded-xl border-2 border-dashed border-gray-700 hover:border-green-600 transition-colors flex flex-col items-center justify-center gap-2 min-h-48 text-gray-500 hover:text-green-400"
            >
              <Plus size={28} />
              <span className="text-sm font-medium">Add Park</span>
            </button>
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-md border border-gray-700">
            <div className="p-6">
              <h2 className="text-white font-bold text-lg mb-4">Create New Park</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Park Name *</label>
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && createPark()}
                    placeholder="e.g. Riverside RV Resort"
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Acreage (optional)</label>
                  <input
                    type="number"
                    value={newAcreage}
                    onChange={(e) => setNewAcreage(e.target.value)}
                    placeholder="e.g. 5.5"
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Notes (optional)</label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    rows={2}
                    placeholder="Location, goals, current state..."
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-green-500 resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createPark}
                  disabled={!newName.trim() || creating}
                  className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 disabled:bg-green-900 text-white font-semibold rounded-lg transition-colors"
                >
                  {creating ? "Creating..." : "Create Park"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
