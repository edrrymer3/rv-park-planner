import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureDb } from "@/lib/db-init";

export async function GET() {
  try {
    await ensureDb();
    const parks = await prisma.park.findMany({
      include: {
        _count: { select: { sites: true, phases: true } },
        phases: { orderBy: { order: "asc" } },
        subscription: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(parks);
  } catch (error) {
    console.error("GET /api/parks error:", error);
    return NextResponse.json({ error: "Failed to fetch parks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDb();
    const body = await request.json();
    const { name, acreage, description } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Park name is required" }, { status: 400 });
    }

    const park = await prisma.park.create({
      data: {
        name: name.trim(),
        acreage: acreage ? parseFloat(acreage) : null,
        description: description?.trim() || null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(park, { status: 201 });
  } catch (error) {
    console.error("POST /api/parks error:", error);
    return NextResponse.json({ error: "Failed to create park" }, { status: 500 });
  }
}
