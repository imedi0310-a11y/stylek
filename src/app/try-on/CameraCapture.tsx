"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, X } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { cameraErrorKey, stopStream, type CameraErrorKey } from "@/lib/tryon/camera";
import { sourceToCanvas } from "@/lib/tryon/image";

interface Props {
  onCapture: (canvas: HTMLCanvasElement) => void;
  onClose: () => void;
  onError: (key: CameraErrorKey) => void;
}

/** Live camera dialog. The stream starts only after the user tapped Take Photo and stops on close. */
export function CameraCapture({ onCapture, onClose, onError }: Props) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open && typeof dialog.showModal === "function") dialog.showModal();
  }, []);

  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false })
      .then(async (stream) => {
        if (cancelled) {
          stopStream(stream);
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => undefined);
          setReady(true);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) onError(cameraErrorKey(error));
      });
    return () => {
      cancelled = true;
      setReady(false);
      stopStream(streamRef.current);
      streamRef.current = null;
    };
  }, [facing, onError]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    try {
      const canvas = sourceToCanvas(video, video.videoWidth, video.videoHeight);
      stopStream(streamRef.current);
      streamRef.current = null;
      onCapture(canvas);
    } catch {
      onError("camera.failed");
    }
  }, [onCapture, onError]);

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      aria-labelledby="camera-title"
      className="m-auto w-[min(100vw-2rem,32rem)] rounded-[var(--radius-card)] bg-surface p-0 text-ink shadow-xl backdrop:bg-black/70"
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 id="camera-title" className="font-semibold">
          {t("camera.title")}
        </h2>
        <button type="button" onClick={onClose} className="btn btn-ghost min-h-10 w-10 p-0" aria-label={t("camera.cancel")}>
          <X aria-hidden className="h-5 w-5" />
        </button>
      </div>
      <div className="relative aspect-[3/4] bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          className={`h-full w-full object-cover ${facing === "user" ? "-scale-x-100" : ""}`}
          aria-label={t("camera.title")}
        />
        {!ready && (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-white/80" role="status">
            {t("camera.starting")}
          </p>
        )}
        {/* Framing guide */}
        <div aria-hidden className="pointer-events-none absolute inset-x-[22%] top-[14%] bottom-[22%] rounded-[50%] border-2 border-dashed border-white/50" />
      </div>
      <div className="flex items-center justify-between gap-3 p-4">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {t("camera.cancel")}
        </button>
        <button type="button" className="btn btn-primary" onClick={capture} disabled={!ready}>
          <Camera aria-hidden className="h-5 w-5" />
          {t("camera.capture")}
        </button>
        <button
          type="button"
          className="btn btn-ghost min-h-11 w-11 p-0"
          onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
          aria-label={t("camera.switch")}
          title={t("camera.switch")}
        >
          <RefreshCw aria-hidden className="h-5 w-5" />
        </button>
      </div>
    </dialog>
  );
}
