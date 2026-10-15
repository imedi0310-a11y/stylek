import type { MessageKey } from "@/i18n/messages";

export type CameraErrorKey = Extract<MessageKey, `camera.${"denied" | "notFound" | "inUse" | "insecure" | "unsupported" | "failed"}`>;

export interface CameraEnvironment {
  isSecureContext: boolean;
  hasGetUserMedia: boolean;
}

export function cameraEnvironment(): CameraEnvironment {
  if (typeof window === "undefined") return { isSecureContext: false, hasGetUserMedia: false };
  return {
    isSecureContext: window.isSecureContext,
    hasGetUserMedia: Boolean(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === "function"),
  };
}

/** Returns why live camera capture is impossible here, or null if it can be attempted. */
export function cameraUnavailableReason(env: CameraEnvironment): CameraErrorKey | null {
  if (!env.isSecureContext) return "camera.insecure";
  if (!env.hasGetUserMedia) return "camera.unsupported";
  return null;
}

/** Maps getUserMedia errors to user-facing messages. */
export function cameraErrorKey(error: unknown): CameraErrorKey {
  const name = error instanceof Error || error instanceof DOMException ? error.name : "";
  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
    case "SecurityError":
      return "camera.denied";
    case "NotFoundError":
    case "DevicesNotFoundError":
    case "OverconstrainedError":
      return "camera.notFound";
    case "NotReadableError":
    case "TrackStartError":
    case "AbortError":
      return "camera.inUse";
    case "TypeError":
      return "camera.unsupported";
    default:
      return "camera.failed";
  }
}

export function stopStream(stream: MediaStream | null | undefined): void {
  stream?.getTracks().forEach((track) => track.stop());
}
