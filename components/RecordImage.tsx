'use client';

import { useState } from 'react';
import ImagePreviewModal from './ImagePreviewModal';

export default function RecordImage({
  src,
  alt,
  emptyLabel = 'No image uploaded',
}: {
  src?: string | null;
  alt: string;
  emptyLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  if (!src) {
    return (
      <div className="border border-border/60 bg-bg/40 min-h-40 flex items-center justify-center">
        <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        className="group relative w-full overflow-hidden border border-border/60 bg-bg/40"
        onClick={() => setOpen(true)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-bg/10 to-transparent" />
        <div className="absolute bottom-3 left-3">
          <p className="font-mono text-[10px] text-accent tracking-widest uppercase">Click To Inspect</p>
        </div>
      </button>
      {open && <ImagePreviewModal src={src} alt={alt} onClose={() => setOpen(false)} />}
    </>
  );
}
