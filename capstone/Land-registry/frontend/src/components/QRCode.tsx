"use client";

import { QRCodeSVG } from "qrcode.react";

interface Props {
  value: string;
  size?: number;
  label?: string;
}

export default function QRCode({ value, size = 120, label }: Props) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="p-2 bg-amber-50 rounded-lg">
        <QRCodeSVG
          value={value}
          size={size}
          bgColor="#fefce8"
          fgColor="#1a1208"
          level="M"
        />
      </div>
      {label && (
        <span className="text-xs text-stone-500 font-mono text-center">{label}</span>
      )}
    </div>
  );
}
