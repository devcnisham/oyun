'use client';

import NavIcon from '@/modules/shared/frontend/dash/NavIcon';
import { useState, useRef, type ChangeEvent, type DragEvent } from 'react';
import styles from '@/modules/shared/frontend/dash/PhotoUploader.module.css';

interface PhotoUploaderProps {
  initialImages: string[];
  name?: string;
  maxImages?: number;
}

export default function PhotoUploader({
  initialImages = [],
  name = 'images',
  maxImages = 10,
}: PhotoUploaderProps) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) {
        setError(`"${file.name}" is not a supported image (use JPG, PNG, WebP, or AVIF).`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(`"${file.name}" exceeds the 5 MB limit. Please compress it.`);
        return;
      }
      validFiles.push(file);
    }

    if (images.length + validFiles.length > maxImages) {
      setError(`You can upload at most ${maxImages} images (currently ${images.length}).`);
      return;
    }

    setUploading(true);
    const newUploadedUrls: string[] = [];

    try {
      for (let i = 0; i < validFiles.length; i++) {
        setUploadProgress(`Uploading ${i + 1} of ${validFiles.length}…`);
        const file = validFiles[i];
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/partner/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.url) {
          throw new Error(data.error || `Failed to upload "${file.name}"`);
        }
        newUploadedUrls.push(data.url);
      }

      setImages((prev) => [...prev, ...newUploadedUrls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Try again.');
    } finally {
      setUploading(false);
      setUploadProgress('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = () => {
    setIsDragOver(false);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const makeCover = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      return [item, ...copy];
    });
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    const target = direction === 'left' ? index - 1 : index + 1;
    if (target < 0 || target >= images.length) return;
    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[target];
      copy[target] = temp;
      return copy;
    });
  };

  const handleManualChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const lines = e.target.value.split('\n').map((l) => l.trim()).filter(Boolean);
    setImages(lines);
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <span className={styles.title}>
          Arena Photos ({images.length} / {maxImages})
        </span>
        <button
          type="button"
          onClick={() => setManualMode(!manualMode)}
          className={styles.toggleBtn}
        >
          {manualMode ? 'Switch to photo uploader' : 'Edit raw URLs'}
        </button>
      </div>

      {/* Hidden textarea to submit the newline-separated images with standard Form submit */}
      <textarea
        name={name}
        value={images.join('\n')}
        onChange={handleManualChange}
        style={{ display: manualMode ? 'block' : 'none', width: '100%', minHeight: 120, fontFamily: 'monospace' }}
        placeholder="One photo URL per line (/venues/turf_1.jpg or https://…)"
      />

      {!manualMode && (
        <>
          <div
            className={`${styles.dropzone} ${isDragOver ? styles.dropzoneActive : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
            }}
          >
            <span className={styles.uploadIcon}><NavIcon name="camera" size={28} /></span>
            <span className={styles.primaryText}>
              Click or drag photos here to upload to Supabase Storage
            </span>
            <span className={styles.subText}>
              JPG, PNG, WebP or AVIF up to 5 MB each. High quality 16:9 photos recommended.
            </span>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/avif"
              className={styles.hiddenInput}
              onChange={onInputChange}
            />
          </div>

          {uploading && (
            <div className={styles.uploadingBanner}>
              <div className={styles.spinner} />
              <span>{uploadProgress || 'Uploading images…'}</span>
            </div>
          )}

          {error && <div className={styles.errorBanner}>{error}</div>}

          {images.length > 0 && (
            <div className={styles.grid}>
              {images.map((src, idx) => (
                <div key={`${src}-${idx}`} className={styles.thumbCard}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Arena photo ${idx + 1}`} className={styles.image} />
                  {idx === 0 && <span className={styles.coverBadge}>Cover</span>}
                  <div className={styles.actionsBar}>
                    <div>
                      {idx > 0 && (
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => moveImage(idx, 'left')}
                          title="Move left"
                        >
                          ‹
                        </button>
                      )}
                      {idx < images.length - 1 && (
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => moveImage(idx, 'right')}
                          title="Move right"
                          style={{ marginLeft: 3 }}
                        >
                          ›
                        </button>
                      )}
                      {idx !== 0 && (
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => makeCover(idx)}
                          title="Make cover photo"
                          style={{ marginLeft: 3 }}
                        >
                          <NavIcon name="reviews" size={14} />
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      className={`${styles.iconBtn} ${styles.deleteBtn}`}
                      onClick={() => removeImage(idx)}
                      title="Remove photo"
                    >
                      <NavIcon name="close" size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
