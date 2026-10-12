import React from 'react';

export interface GaugeProps {
  value: number;
  color?: string;
  showLabels?: boolean;
  min?: string;
  max?: string;
}

export const Gauge: React.FC<GaugeProps> = ({
  value,
  color = '#ef4d23',
  showLabels = false,
  min = '0',
  max = '100',
}) => {
  const totalTicks = 40;
  const activeCount = Math.round((Math.max(0, Math.min(100, value)) / 100) * totalTicks);

  const ticks = Array.from({ length: totalTicks }, (_, i) => {
    // Span a 180° arc from angle π to 2π
    const angle = Math.PI + (i / (totalTicks - 1)) * Math.PI;
    const rOuter = 80;
    const rInner = 70;

    const x1 = 100 + rInner * Math.cos(angle);
    const y1 = 100 + rInner * Math.sin(angle);
    const x2 = 100 + rOuter * Math.cos(angle);
    const y2 = 100 + rOuter * Math.sin(angle);

    const isActive = i < activeCount;

    return (
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={isActive ? color : '#d4d4d8'}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    );
  });

  return (
    <div className="flex flex-col items-center w-full max-w-[260px] mx-auto select-none">
      <svg
        viewBox="0 0 200 120"
        className="w-full h-auto overflow-visible"
        aria-label={`Gauge indicator showing ${value}%`}
      >
        {ticks}
        <text
          x={100}
          y={105}
          textAnchor="middle"
          fontSize={22}
          fontWeight={600}
          fill="#18181b"
        >
          {value}%
        </text>
      </svg>

      {showLabels && (
        <div className="w-full flex justify-between text-[11px] text-neutral-500 font-medium px-4 mt-0.5">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  );
};
