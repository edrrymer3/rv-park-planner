import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;
    const body = await request.json();

    const site = await prisma.site.update({
      where: { id: siteId },
      data: {
        label: body.label,
        type: body.type,
        x: body.x,
        y: body.y,
        width: body.width,
        height: body.height,
        phaseId: body.phaseId,
        amenities: body.amenities != null ? JSON.stringify(body.amenities) : undefined,
      },
    });

    return NextResponse.json(site);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update site" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;
    await prisma.site.delete({ where: { id: siteId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete site" }, { status: 500 });
  }
}
