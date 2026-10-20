import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureDb } from "@/lib/db-init";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDb();
    const { id } = await params;
    const sites = await prisma.site.findMany({
      where: { parkId: id },
      orderBy: { label: "asc" },
    });
    return NextResponse.json(sites);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch sites" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: parkId } = await params;
    const body = await request.json();

    const site = await prisma.site.create({
      data: {
        parkId,
        label: body.label,
        type: body.type || "back-in",
        x: body.x ?? 100,
        y: body.y ?? 100,
        width: body.type === "pull-through" ? 80 : 60,
        height: 30,
        phaseId: body.phaseId || null,
        amenities: body.amenities ? JSON.stringify(body.amenities) : null,
      },
    });

    return NextResponse.json(site, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create site" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: parkId } = await params;
    await prisma.site.deleteMany({ where: { parkId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete sites" }, { status: 500 });
  }
}
