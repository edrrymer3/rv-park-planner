import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const park = await prisma.park.findUnique({
      where: { id },
      include: {
        sites: { orderBy: { label: "asc" } },
        phases: { orderBy: { order: "asc" } },
        subscription: true,
      },
    });
    if (!park) return NextResponse.json({ error: "Park not found" }, { status: 404 });
    return NextResponse.json(park);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch park" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const park = await prisma.park.update({
      where: { id },
      data: {
        name: body.name,
        acreage: body.acreage != null ? parseFloat(body.acreage) : undefined,
        description: body.description,
        imageUrl: body.imageUrl,
      },
    });
    return NextResponse.json(park);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update park" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.park.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete park" }, { status: 500 });
  }
}
