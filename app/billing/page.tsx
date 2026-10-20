"use client";

import Link from "next/link";
import { Check, ChevronLeft, AlertCircle } from "lucide-react";

const PLANS = [
  {
    name: "Basic",
    price: 99,
    description: "Perfect for a single park getting started",
    features: [
      "1 park",
      "Up to 100 sites",
      "AI layout suggestions",
      "PDF export",
      "Revenue calculator",
      "Phase planning (2 phases)",
    ],
    cta: "Start Free Trial",
    highlight: false,
  },
  {
    name: "Pro",
    price: 199,
    description: "For established parks with multiple phases",
    features: [
      "3 parks",
      "Unlimited sites",
      "AI layout suggestions (priority)",
      "PDF export",
      "Revenue calculator",
      "Phase planning (unlimited)",
      "Satellite image integration",
      "Shareable read-only links",
    ],
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: 299,
    description: "For multi-park operators and developers",
    features: [
      "Unlimited parks",
      "Unlimited sites",
      "AI layout suggestions (priority)",
      "Custom branding on PDFs",
      "Phase planning (unlimited)",
      "Multi-user access",
      "Dedicated onboarding",
      "Phone support",
    ],
    cta: "Contact Us",
    highlight: false,
  },
];

export default function BillingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <span className="text-green-400 font-bold text-lg">🏕️ ParkSolves</span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-300">Pricing</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Test mode banner */}
        <div className="flex items-center gap-2 bg-yellow-900/30 border border-yellow-700 text-yellow-300 rounded-xl px-4 py-3 mb-10 text-sm">
          <AlertCircle size={16} />
          <strong>Test Mode:</strong> Stripe billing is stubbed. No charges will occur.
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Simple, Transparent Pricing</h1>
          <p className="text-gray-400">14-day free trial. No credit card required to start.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-6 flex flex-col ${
                plan.highlight
                  ? "bg-green-900/20 border-green-600 ring-1 ring-green-600"
                  : "bg-gray-900 border-gray-700"
              }`}
            >
              {plan.highlight && (
                <span className="text-xs font-bold text-green-400 uppercase tracking-wider mb-3">
                  ⭐ Most Popular
                </span>
              )}
              <h2 className="text-xl font-bold text-white">{plan.name}</h2>
              <p className="text-gray-400 text-sm mt-1 mb-4">{plan.description}</p>

              <div className="mb-6">
                <span className="text-4xl font-bold text-white">${plan.price}</span>
                <span className="text-gray-400">/mo per park</span>
              </div>

              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                    <Check size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => alert("Stripe billing coming soon! Test mode only for now.")}
                className={`w-full py-2.5 rounded-xl font-semibold transition-colors ${
                  plan.highlight
                    ? "bg-green-600 hover:bg-green-500 text-white"
                    : "bg-gray-800 hover:bg-gray-700 text-white"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-600 text-sm mt-8">
          Questions? Email{" "}
          <a href="mailto:hello@parksolves.com" className="text-green-400 hover:underline">
            hello@parksolves.com
          </a>
        </p>
      </main>
    </div>
  );
}
