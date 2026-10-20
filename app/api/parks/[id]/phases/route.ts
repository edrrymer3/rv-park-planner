import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PHASE_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: parkId } = await params;
    const body = await request.json();

    const existing = await prisma.phase.count({ where: { parkId } });
    const phase = await prisma.phase.create({
      data: {
        parkId,
        name: body.name || `Phase ${existing + 1}`,
        color: body.color || PHASE_COLORS[existing % PHASE_COLORS.length],
        order: existing + 1,
      },
    });

    return NextResponse.json(phase, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create phase" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: parkId } = await params;
    const { phaseId } = await request.json();
    // Unassign sites from this phase first
    await prisma.site.updateMany({ where: { phaseId }, data: { phaseId: null } });
    await prisma.phase.delete({ where: { id: phaseId, parkId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete phase" }, { status: 500 });
  }
}
