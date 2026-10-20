"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("Incorrect password. Try again.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-5xl mb-3">🏕️</p>
          <h1 className="text-2xl font-bold text-white">
            <span className="text-green-400">Park</span>Solves
          </h1>
          <p className="text-gray-400 text-sm mt-1">RV Park Site Planner</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1.5">Access Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-green-500"
              placeholder="Enter password..."
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={!password || loading}
            className="w-full py-2.5 bg-green-600 hover:bg-green-500 disabled:bg-green-900 text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? "Checking..." : "Enter"}
          </button>
        </form>

        <p className="text-center text-gray-600 text-xs mt-4">
          Beta preview — invite only
        </p>
      </div>
    </div>
  );
}
