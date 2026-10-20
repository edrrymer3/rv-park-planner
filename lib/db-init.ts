/**
 * db-init.ts — Runtime database initializer for Vercel/SQLite
 *
 * Vercel serverless uses /tmp which is ephemeral but writable.
 * This module creates tables + seeds a demo park on first use.
 * Data survives warm invocations; resets on cold starts / new deploys.
 */

import { prisma } from "./prisma";

let initialized = false;

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS "Park" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "acreage" REAL,
  "description" TEXT,
  "imageUrl" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Phase" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "parkId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "color" TEXT NOT NULL DEFAULT '#3B82F6',
  "order" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "Phase_parkId_fkey" FOREIGN KEY ("parkId") REFERENCES "Park" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Site" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "parkId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'back-in',
  "x" REAL NOT NULL,
  "y" REAL NOT NULL,
  "width" REAL NOT NULL DEFAULT 60,
  "height" REAL NOT NULL DEFAULT 30,
  "phaseId" TEXT,
  "amenities" TEXT,
  CONSTRAINT "Site_parkId_fkey" FOREIGN KEY ("parkId") REFERENCES "Park" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Site_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Subscription" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "parkId" TEXT NOT NULL UNIQUE,
  "plan" TEXT NOT NULL DEFAULT 'basic',
  "status" TEXT NOT NULL DEFAULT 'trialing',
  "stripeId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Subscription_parkId_fkey" FOREIGN KEY ("parkId") REFERENCES "Park" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
`;

function cuid(): string {
  return (
    "c" +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 10)
  );
}

export async function ensureDb(): Promise<void> {
  if (initialized) return;

  try {
    // Run schema statements one by one
    for (const stmt of SCHEMA_SQL.split(";").map((s) => s.trim()).filter(Boolean)) {
      await prisma.$executeRawUnsafe(stmt + ";");
    }

    // Seed demo park if empty
    const count = await prisma.park.count().catch(() => 0);
    if (count === 0) {
      const parkId = cuid();
      const phase1Id = cuid();
      const phase2Id = cuid();

      await prisma.park.create({
        data: {
          id: parkId,
          name: "Riverside RV Resort (Demo)",
          acreage: 8,
          description: "Demo park — edit freely. Data may reset on cold starts.",
          updatedAt: new Date(),
        },
      });

      await prisma.phase.createMany({
        data: [
          { id: phase1Id, parkId, name: "Phase 1", color: "#22c55e", order: 1 },
          { id: phase2Id, parkId, name: "Phase 2", color: "#3b82f6", order: 2 },
        ],
      });

      // Seed 24 demo sites: A1–A6 pull-through (Phase 1), B1–B10 back-in (Phase 1), C1–C8 back-in (Phase 2)
      const sites = [];
      const rows = [
        { row: "A", count: 6, type: "pull-through" as const, phaseId: phase1Id, yBase: 80, w: 80 },
        { row: "B", count: 10, type: "back-in" as const, phaseId: phase1Id, yBase: 160, w: 60 },
        { row: "C", count: 8, type: "back-in" as const, phaseId: phase2Id, yBase: 240, w: 60 },
      ];
      for (const row of rows) {
        for (let i = 1; i <= row.count; i++) {
          sites.push({
            id: cuid(),
            parkId,
            label: `${row.row}${i}`,
            type: row.type,
            x: 60 + (i - 1) * (row.w + 12),
            y: row.yBase,
            width: row.w,
            height: 30,
            phaseId: row.phaseId,
            amenities: JSON.stringify(i % 3 === 0 ? ["electric", "water", "sewer"] : ["electric", "water"]),
          });
        }
      }
      await prisma.site.createMany({ data: sites });
    }

    initialized = true;
  } catch (err) {
    // Tables may already exist (race condition on warm start) — that's fine
    console.warn("[db-init] init warning:", err instanceof Error ? err.message : err);
    initialized = true;
  }
}
