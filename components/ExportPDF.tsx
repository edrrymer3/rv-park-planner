import jsPDF from "jspdf";
import type { SiteData, PhaseData } from "@/app/parks/[id]/page";

interface ExportOptions {
  parkName: string;
  sites: SiteData[];
  phases: PhaseData[];
  canvasDataUrl: string;
  avgRate?: number;
  occupancy?: number;
}

export async function exportPDF({
  parkName,
  sites,
  phases,
  canvasDataUrl,
  avgRate = 45,
  occupancy = 65,
}: ExportOptions) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "letter" });

  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Header bar
  doc.setFillColor(17, 24, 39); // gray-900
  doc.rect(0, 0, W, 18, "F");
  doc.setTextColor(34, 197, 94); // green-500
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("🏕️ ParkSolves", 8, 11);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text(parkName, W / 2, 11, { align: "center" });
  doc.setFontSize(9);
  doc.setTextColor(156, 163, 175);
  doc.text(`Generated ${new Date().toLocaleDateString()}`, W - 8, 11, { align: "right" });

  // Canvas image
  const canvasY = 22;
  const canvasH = 110;
  const canvasW = W - 16;
  doc.addImage(canvasDataUrl, "PNG", 8, canvasY, canvasW, canvasH);
  doc.setDrawColor(75, 85, 99);
  doc.rect(8, canvasY, canvasW, canvasH);

  // Revenue section
  const revY = canvasY + canvasH + 6;
  const annual = sites.length * avgRate * (occupancy / 100) * 365;
  const monthly = annual / 12;

  doc.setFillColor(31, 41, 55);
  doc.roundedRect(8, revY, 85, 28, 2, 2, "F");
  doc.setTextColor(156, 163, 175);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("REVENUE PROJECTION", 12, revY + 6);
  doc.setTextColor(34, 197, 94);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`$${Math.round(annual).toLocaleString()}/yr`, 12, revY + 18);
  doc.setFontSize(10);
  doc.setTextColor(209, 213, 219);
  doc.text(`$${Math.round(monthly).toLocaleString()}/mo`, 12, revY + 25);

  // Site summary
  doc.setFillColor(31, 41, 55);
  doc.roundedRect(98, revY, 55, 28, 2, 2, "F");
  doc.setTextColor(156, 163, 175);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("SITE SUMMARY", 102, revY + 6);
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text(`${sites.length} Total Sites`, 102, revY + 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(209, 213, 219);
  doc.text(`${sites.filter(s => s.type === "pull-through").length} Pull-Through`, 102, revY + 20);
  doc.text(`${sites.filter(s => s.type === "back-in").length} Back-In`, 102, revY + 26);

  // Phases table
  if (phases.length > 0) {
    doc.setFillColor(31, 41, 55);
    const phaseX = 158;
    const phaseW = W - phaseX - 8;
    doc.roundedRect(phaseX, revY, phaseW, 28, 2, 2, "F");
    doc.setTextColor(156, 163, 175);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("PHASE REVENUE", phaseX + 4, revY + 6);

    let rowY = revY + 12;
    phases.forEach((ph) => {
      const count = sites.filter(s => s.phaseId === ph.id).length;
      const rev = count * avgRate * (occupancy / 100) * 365;
      const [r, g, b] = hexToRgb(ph.color);
      doc.setFillColor(r, g, b);
      doc.circle(phaseX + 6, rowY - 1.5, 2, "F");
      doc.setTextColor(209, 213, 219);
      doc.setFontSize(7.5);
      doc.text(`${ph.name} (${count} sites)`, phaseX + 11, rowY);
      doc.setTextColor(34, 197, 94);
      doc.text(`$${Math.round(rev).toLocaleString()}`, phaseX + phaseW - 4, rowY, { align: "right" });
      rowY += 7;
    });
  }

  // Site inventory (new page if many sites)
  if (sites.length > 0) {
    doc.addPage();
    doc.setFillColor(17, 24, 39);
    doc.rect(0, 0, W, 18, "F");
    doc.setTextColor(34, 197, 94);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Site Inventory — " + parkName, 8, 11);
    doc.setTextColor(156, 163, 175);
    doc.setFontSize(8);
    doc.text(`${sites.length} sites`, W - 8, 11, { align: "right" });

    // Table header
    const cols = { label: 10, type: 35, phase: 65, amenities: 95, pos: 160 };
    doc.setFillColor(31, 41, 55);
    doc.rect(8, 22, W - 16, 8, "F");
    doc.setTextColor(156, 163, 175);
    doc.setFontSize(8);
    doc.text("SITE", cols.label, 27);
    doc.text("TYPE", cols.type, 27);
    doc.text("PHASE", cols.phase, 27);
    doc.text("AMENITIES", cols.amenities, 27);
    doc.text("POSITION", cols.pos, 27);

    let tableY = 35;
    const sorted = [...sites].sort((a, b) => a.label.localeCompare(b.label));
    sorted.forEach((site, i) => {
      if (tableY > H - 12) {
        doc.addPage();
        tableY = 15;
      }
      if (i % 2 === 0) {
        doc.setFillColor(24, 33, 47);
        doc.rect(8, tableY - 3, W - 16, 7, "F");
      }
      const phase = phases.find(p => p.id === site.phaseId);
      const amenities: string[] = site.amenities ? JSON.parse(site.amenities) : [];
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(site.label, cols.label, tableY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(209, 213, 219);
      doc.text(site.type === "pull-through" ? "Pull-Through" : "Back-In", cols.type, tableY);
      if (phase) {
        const [r, g, b] = hexToRgb(phase.color);
        doc.setTextColor(r, g, b);
        doc.text(phase.name, cols.phase, tableY);
      } else {
        doc.setTextColor(107, 114, 128);
        doc.text("—", cols.phase, tableY);
      }
      doc.setTextColor(209, 213, 219);
      doc.text(amenities.join(", ") || "—", cols.amenities, tableY);
      doc.setTextColor(107, 114, 128);
      doc.text(`(${Math.round(site.x)}, ${Math.round(site.y)})`, cols.pos, tableY);
      tableY += 7;
    });
  }

  doc.save(`${parkName.replace(/\s+/g, "-")}-site-map.pdf`);
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [99, 102, 241];
}
