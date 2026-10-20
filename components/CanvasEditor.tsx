"use client";

import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Rect, Text, Group, Image as KonvaImage } from "react-konva";
import type { SiteData, PhaseData } from "@/app/parks/[id]/page";

interface CanvasEditorProps {
  sites: SiteData[];
  phases: PhaseData[];
  backgroundImage: string | null;
  selectedSiteId: string | null;
  onSiteSelect: (site: SiteData | null) => void;
  onSiteMove: (id: string, x: number, y: number) => void;
  stageRef: React.MutableRefObject<{ toDataURL: () => string } | null>;
}

function useImage(url: string | null) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!url) { setImage(null); return; }
    const img = new window.Image();
    img.src = url;
    img.onload = () => setImage(img);
  }, [url]);
  return image;
}

export default function CanvasEditor({
  sites,
  phases,
  backgroundImage,
  selectedSiteId,
  onSiteSelect,
  onSiteMove,
  stageRef,
}: CanvasEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const bgImage = useImage(backgroundImage);
  const internalStageRef = useRef<{ toDataURL: () => string } | null>(null);

  useEffect(() => {
    const observe = () => {
      if (containerRef.current) {
        const { offsetWidth, offsetHeight } = containerRef.current;
        setDimensions({ width: offsetWidth, height: offsetHeight });
      }
    };
    observe();
    const ro = new ResizeObserver(observe);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (internalStageRef.current) {
      stageRef.current = internalStageRef.current;
    }
  }, [internalStageRef.current]);

  function getPhaseColor(phaseId: string | null): string {
    if (!phaseId) return "#6b7280";
    const phase = phases.find((p) => p.id === phaseId);
    return phase?.color || "#6b7280";
  }

  return (
    <div ref={containerRef} className="w-full h-full">
      <Stage
        ref={internalStageRef as never}
        width={dimensions.width}
        height={dimensions.height}
        onClick={(e) => {
          if (e.target === e.target.getStage()) onSiteSelect(null);
        }}
      >
        <Layer>
          {/* Background image */}
          {bgImage && (
            <KonvaImage
              image={bgImage}
              x={0}
              y={0}
              width={dimensions.width}
              height={dimensions.height}
              opacity={0.4}
            />
          )}

          {/* Grid dots */}
          {!bgImage && Array.from({ length: Math.ceil(dimensions.width / 40) }).map((_, xi) =>
            Array.from({ length: Math.ceil(dimensions.height / 40) }).map((_, yi) => (
              <Rect
                key={`grid-${xi}-${yi}`}
                x={xi * 40}
                y={yi * 40}
                width={2}
                height={2}
                fill="#374151"
                cornerRadius={1}
              />
            ))
          )}

          {/* Sites */}
          {sites.map((site) => {
            const isSelected = site.id === selectedSiteId;
            const color = getPhaseColor(site.phaseId);
            const isPullThrough = site.type === "pull-through";

            return (
              <Group
                key={site.id}
                x={site.x}
                y={site.y}
                draggable
                onClick={() => onSiteSelect(site)}
                onDragEnd={(e) => {
                  onSiteMove(site.id, e.target.x(), e.target.y());
                }}
              >
                {/* Site body */}
                <Rect
                  width={site.width}
                  height={site.height}
                  fill={color + "33"}
                  stroke={isSelected ? "#60a5fa" : color}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  cornerRadius={3}
                  shadowColor={isSelected ? "#60a5fa" : "transparent"}
                  shadowBlur={isSelected ? 8 : 0}
                />
                {/* Label */}
                <Text
                  text={site.label}
                  width={site.width}
                  height={site.height}
                  align="center"
                  verticalAlign="middle"
                  fontSize={isPullThrough ? 11 : 10}
                  fontStyle="bold"
                  fill={isSelected ? "#93c5fd" : "#e5e7eb"}
                />
                {/* Type indicator */}
                {isPullThrough && (
                  <Rect
                    x={2}
                    y={2}
                    width={site.width - 4}
                    height={3}
                    fill={color}
                    cornerRadius={1}
                    opacity={0.7}
                  />
                )}
              </Group>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}
