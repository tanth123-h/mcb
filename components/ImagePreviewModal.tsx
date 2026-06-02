'use client';

export default function ImagePreviewModal({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[220] bg-bg/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-4xl panel border-accent/30 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="font-mono text-[10px] tracking-widest text-accent uppercase">Image Preview</p>
          <button onClick={onClose} className="font-mono text-[10px] text-text-muted hover:text-text">[CLOSE]</button>
        </div>
        <div className="bg-black/50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className="w-full max-h-[80vh] object-contain" />
        </div>
      </div>
    </div>
  );
}
