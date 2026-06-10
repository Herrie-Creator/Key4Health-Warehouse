import React from 'react';

// HD SVG recreation of the Key4Health logo
// Exact colours extracted from the original:
//   Navy bg:     #2b3a5c
//   Oval:        #b85c38  (terracotta/rust)
//   Text:        #ffffff
//   Subtitle:    #c8d0dc

export function LogoFull({ width = 280, className = '' }) {
  return (
    <svg
      width={width}
      height={width * 0.36}
      viewBox="0 0 560 200"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Key4Health Sales & Distribution"
    >
      {/* Background */}
      <rect width="560" height="200" rx="10" fill="#2b3a5c" />

      {/* Terracotta oval */}
      <ellipse cx="218" cy="95" rx="44" ry="54" fill="#b85c38" />

      {/* "4" inside oval */}
      <text
        x="218" y="114"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="700"
        fontSize="62"
        fill="#ffffff"
        letterSpacing="-2"
      >4</text>

      {/* "KEY" — left of oval */}
      <text
        x="30" y="118"
        fontFamily="'Trebuchet MS', 'Arial', sans-serif"
        fontWeight="700"
        fontSize="62"
        fill="#ffffff"
        letterSpacing="4"
      >KEY</text>

      {/* "HEALTH" — right of oval */}
      <text
        x="272" y="118"
        fontFamily="'Trebuchet MS', 'Arial', sans-serif"
        fontWeight="700"
        fontSize="62"
        fill="#ffffff"
        letterSpacing="4"
      >HEALTH</text>

      {/* Divider line under main text */}
      <line x1="30" y1="136" x2="530" y2="136" stroke="#c8d0dc" strokeWidth="0.8" opacity="0.4" />

      {/* "SALES & DISTRIBUTION" subtitle */}
      <text
        x="280" y="162"
        textAnchor="middle"
        fontFamily="'Trebuchet MS', 'Arial', sans-serif"
        fontWeight="400"
        fontSize="20"
        fill="#c8d0dc"
        letterSpacing="5"
      >SALES &amp; DISTRIBUTION</text>
    </svg>
  );
}

// Compact version for sidebar (no background, horizontal layout)
export function LogoSidebar({ width = 160 }) {
  return (
    <svg
      width={width}
      height={width * 0.28}
      viewBox="0 0 560 158"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Key4Health"
    >
      {/* Oval */}
      <ellipse cx="218" cy="75" rx="44" ry="54" fill="#b85c38" />

      {/* "4" */}
      <text x="218" y="94" textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="700" fontSize="62" fill="#ffffff" letterSpacing="-2">4</text>

      {/* KEY */}
      <text x="30" y="98"
        fontFamily="'Trebuchet MS', Arial, sans-serif"
        fontWeight="700" fontSize="62" fill="#ffffff" letterSpacing="4">KEY</text>

      {/* HEALTH */}
      <text x="272" y="98"
        fontFamily="'Trebuchet MS', Arial, sans-serif"
        fontWeight="700" fontSize="62" fill="#ffffff" letterSpacing="4">HEALTH</text>

      {/* subtitle */}
      <text x="280" y="140" textAnchor="middle"
        fontFamily="'Trebuchet MS', Arial, sans-serif"
        fontWeight="400" fontSize="18" fill="#8b9ab5" letterSpacing="4">SALES &amp; DISTRIBUTION</text>
    </svg>
  );
}

// Icon-only (oval with 4) for favicon / small use
export function LogoIcon({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="80" rx="12" fill="#2b3a5c" />
      <ellipse cx="40" cy="40" rx="22" ry="27" fill="#b85c38" />
      <text x="40" y="52" textAnchor="middle"
        fontFamily="Georgia, serif" fontWeight="700" fontSize="32" fill="#ffffff">4</text>
    </svg>
  );
}

export default LogoFull;
