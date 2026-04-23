/**
 * components/AvatarUpload.tsx
 * Drag-and-drop avatar uploader with preview and progress.
 * Restricted to the personnel's own profile (session check).
 */

'use client';

import { useRef, useState, useCallback } from 'react';
import { uploadAvatar, deleteAvatar, getAvatarPlaceholder } from '@/lib/avatar';
import { soundSuccess, soundError, soundKeypress } from '@/lib/sound';

interface AvatarUploadProps {
  personnelId:  string;
  codename:     string;
  currentUrl?:  string | null;
  canEdit:      boolean;
  onUpload:     (url: string) => void;
}

type UploadState = 'idle' | 'dragging' | 'uploading' | 'success' | 'error';

export default function AvatarUpload({
  personnelId,
  codename,
  currentUrl,
  canEdit,
  onUpload,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state,    setState]    = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [preview,  setPreview]  = useState<string | null>(currentUrl ?? null);

  const placeholder = getAvatarPlaceholder(codename);

  const handleFile = useCallback(async (file: File) => {
    // Preview immediately
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setState('uploading');
    setProgress(0);

    // Fake progress animation while uploading
    const tick = setInterval(() => setProgress(p => Math.min(p + 15, 85)), 200);

    const { url, error } = await uploadAvatar(personnelId, file);
    clearInterval(tick);

    if (error || !url) {
      setState('error');
      setErrorMsg(error ?? 'Upload failed.');
      setPreview(currentUrl ?? null);
      soundError();
      setTimeout(() => setState('idle'), 3000);
      return;
    }

    setProgress(100);
    setState('success');
    setPreview(url);
    onUpload(url);
    soundSuccess();
    setTimeout(() => setState('idle'), 2000);
  }, [personnelId, currentUrl, onUpload]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState('idle');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setState('dragging'); };
  const onDragLeave = () => setState('idle');

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDelete = async () => {
    soundKeypress();
    await deleteAvatar(personnelId);
    setPreview(null);
    onUpload('');
  };

  const imgSrc = preview || placeholder;

  return (
    <div className="space-y-2">
      {/* Avatar display */}
      <div
        className={`
          relative w-28 h-28 border-2 rounded-sm overflow-hidden group
          transition-all duration-200
          ${state === 'dragging'  ? 'border-accent border-dashed scale-105' : ''}
          ${state === 'uploading' ? 'border-accent/60' : ''}
          ${state === 'success'   ? 'border-green-400' : ''}
          ${state === 'error'     ? 'border-red-400'   : ''}
          ${state === 'idle'      ? 'border-border'    : ''}
        `}
        onDrop={canEdit ? onDrop : undefined}
        onDragOver={canEdit ? onDragOver : undefined}
        onDragLeave={canEdit ? onDragLeave : undefined}
      >
        {/* Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={codename}
          className={`w-full h-full object-cover transition-all duration-300 ${
            state === 'uploading' ? 'opacity-40 blur-sm' : 'opacity-100'
          }`}
        />

        {/* Upload overlay (hover) */}
        {canEdit && state === 'idle' && (
          <div
            className="absolute inset-0 bg-bg/70 opacity-0 group-hover:opacity-100 transition-opacity
                       flex flex-col items-center justify-center cursor-pointer gap-1"
            onClick={() => inputRef.current?.click()}
          >
            <span className="text-accent text-lg">↑</span>
            <span className="font-mono text-[9px] text-accent tracking-widest">UPLOAD</span>
          </div>
        )}

        {/* Dragging overlay */}
        {state === 'dragging' && (
          <div className="absolute inset-0 bg-accent/10 flex items-center justify-center">
            <span className="font-mono text-[10px] text-accent animate-blink">DROP FILE</span>
          </div>
        )}

        {/* Progress overlay */}
        {state === 'uploading' && (
          <div className="absolute inset-0 bg-bg/80 flex flex-col items-center justify-center gap-2">
            <span className="font-mono text-[9px] text-accent tracking-widest animate-blink">
              UPLOADING
            </span>
            <div className="w-16 h-px bg-border overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Success overlay */}
        {state === 'success' && (
          <div className="absolute inset-0 bg-green-400/10 flex items-center justify-center">
            <span className="text-green-400 text-xl animate-fadeIn">✓</span>
          </div>
        )}

        {/* Error overlay */}
        {state === 'error' && (
          <div className="absolute inset-0 bg-red-400/10 flex items-center justify-center">
            <span className="text-red-400 text-xl">✗</span>
          </div>
        )}
      </div>

      {/* Error message */}
      {state === 'error' && (
        <p className="font-mono text-[10px] text-red-400">{errorMsg}</p>
      )}

      {/* Controls */}
      {canEdit && state === 'idle' && (
        <div className="flex gap-2">
          <button
            onClick={() => inputRef.current?.click()}
            className="font-mono text-[10px] text-accent hover:text-text transition-colors tracking-widest"
          >
            [CHANGE]
          </button>
          {preview && preview !== placeholder && (
            <button
              onClick={handleDelete}
              className="font-mono text-[10px] text-red-400/60 hover:text-red-400 transition-colors"
            >
              [REMOVE]
            </button>
          )}
        </div>
      )}

      {canEdit && (
        <p className="font-mono text-[9px] text-text-muted">
          Drag image or click to upload. Max 5MB.
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={onInputChange}
      />
    </div>
  );
}
