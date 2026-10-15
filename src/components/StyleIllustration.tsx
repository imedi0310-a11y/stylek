import { useId } from "react";
import { buildHairGeometry, HEAD, illustrationPalette, ILLUSTRATION_SIZE } from "@/lib/illustration";
import type { IllustrationSpec } from "@/lib/types";

interface Props {
  id: string;
  spec: IllustrationSpec;
  title: string;
  className?: string;
}

function PatternDefs({ id, pattern }: { id: string; pattern: NonNullable<IllustrationSpec["pattern"]> }) {
  const stroke = "rgba(255,255,255,0.18)";
  switch (pattern) {
    case "wavy":
      return (
        <pattern id={id} width="16" height="10" patternUnits="userSpaceOnUse">
          <path d="M0 5 Q4 1 8 5 T16 5" fill="none" stroke={stroke} strokeWidth="1.2" />
        </pattern>
      );
    case "curly":
      return (
        <pattern id={id} width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="5" cy="5" r="3.2" fill="none" stroke={stroke} strokeWidth="1.2" />
        </pattern>
      );
    case "coily":
      return (
        <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.8" fill="none" stroke={stroke} strokeWidth="1" />
        </pattern>
      );
    case "straight":
    default:
      return (
        <pattern id={id} width="8" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(12)">
          <line x1="4" y1="0" x2="4" y2="40" stroke="rgba(255,255,255,0.1)" strokeWidth="0.9" />
        </pattern>
      );
  }
}

/**
 * Simplified, faceless vector illustration of a hairstyle. Used as the default
 * reference image so the catalogue never depends on unlicensed photos.
 */
export function StyleIllustration({ id, spec, title, className }: Props) {
  const uid = useId().replace(/:/g, "");
  const patternId = `hair-pattern-${uid}`;
  const { back, front, faded, frontOpacity } = buildHairGeometry(spec);
  const palette = illustrationPalette(id, spec);
  const pattern = spec.pattern ?? "straight";

  return (
    <svg
      viewBox={`0 0 ${ILLUSTRATION_SIZE.width} ${ILLUSTRATION_SIZE.height}`}
      role="img"
      aria-label={title}
      className={className}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <PatternDefs id={patternId} pattern={pattern} />
      </defs>
      <rect width="200" height="240" fill={palette.background} />
      <circle cx="160" cy="40" r="60" fill="#ffffff" opacity="0.35" />
      {/* Shoulders */}
      <path d="M22 240 C24 204 58 190 100 190 C142 190 176 204 178 240 Z" fill="#3c4a52" />
      {/* Back hair */}
      {back.map((d, i) => (
        <g key={`b${i}`}>
          <path d={d} fill={palette.hair} />
          <path d={d} fill={`url(#${patternId})`} />
        </g>
      ))}
      {/* Neck */}
      <path d="M86 148 L86 186 Q100 196 114 186 L114 148 Z" fill={palette.skin} />
      <path d="M86 168 Q100 180 114 168 L114 160 Q100 172 86 160 Z" fill="#000" opacity="0.08" />
      {/* Ears and head */}
      <ellipse cx={HEAD.cx - HEAD.rx} cy="116" rx="6" ry="11" fill={palette.skin} />
      <ellipse cx={HEAD.cx + HEAD.rx} cy="116" rx="6" ry="11" fill={palette.skin} />
      <ellipse cx={HEAD.cx} cy={HEAD.cy} rx={HEAD.rx} ry={HEAD.ry} fill={palette.skin} />
      {/* Faded sides */}
      {faded.map((d, i) => (
        <path key={`f${i}`} d={d} fill={palette.hair} opacity="0.35" />
      ))}
      {/* Front hair */}
      <g opacity={frontOpacity}>
        {front.map((d, i) => (
          <g key={`h${i}`}>
            <path d={d} fill={palette.hair} />
            <path d={d} fill={`url(#${patternId})`} />
          </g>
        ))}
      </g>
    </svg>
  );
}
