import type { FaceDetector, ImageSegmenter } from "@mediapipe/tasks-vision";
import type { FaceKeypoints } from "./geometry";

/** WebAssembly runtime served by this site (copied from node_modules at build time). */
const WASM_BASE = "/mediapipe/wasm";
/** Open-source (Apache-2.0) MediaPipe model files hosted by Google. Only the model is downloaded; no photo is sent. */
export const HAIR_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/image_segmenter/hair_segmenter/float32/latest/hair_segmenter.tflite";
export const FACE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite";

let visionPromise: Promise<typeof import("@mediapipe/tasks-vision")> | null = null;
let filesetPromise: Promise<Awaited<ReturnType<typeof import("@mediapipe/tasks-vision")["FilesetResolver"]["forVisionTasks"]>>> | null = null;
let segmenterPromise: Promise<ImageSegmenter> | null = null;
let detectorPromise: Promise<FaceDetector> | null = null;

function vision() {
  visionPromise ??= import("@mediapipe/tasks-vision");
  return visionPromise;
}

function fileset() {
  filesetPromise ??= vision().then((v) => v.FilesetResolver.forVisionTasks(WASM_BASE));
  return filesetPromise;
}

/** Resets a cached promise when it fails so the user can retry (e.g. after reconnecting). */
function retryable<T>(promise: Promise<T>, reset: () => void): Promise<T> {
  return promise.catch((error) => {
    reset();
    throw error;
  });
}

export function getHairSegmenter(): Promise<ImageSegmenter> {
  segmenterPromise ??= retryable(
    Promise.all([vision(), fileset()]).then(([v, files]) =>
      v.ImageSegmenter.createFromOptions(files, {
        baseOptions: { modelAssetPath: HAIR_MODEL_URL, delegate: "CPU" },
        runningMode: "IMAGE",
        outputConfidenceMasks: true,
        outputCategoryMask: false,
      }),
    ),
    () => {
      segmenterPromise = null;
      filesetPromise = null;
    },
  );
  return segmenterPromise;
}

export function getFaceDetector(): Promise<FaceDetector> {
  detectorPromise ??= retryable(
    Promise.all([vision(), fileset()]).then(([v, files]) =>
      v.FaceDetector.createFromOptions(files, {
        baseOptions: { modelAssetPath: FACE_MODEL_URL, delegate: "CPU" },
        runningMode: "IMAGE",
        minDetectionConfidence: 0.5,
      }),
    ),
    () => {
      detectorPromise = null;
      filesetPromise = null;
    },
  );
  return detectorPromise;
}

/** Detects the most confident face and returns its keypoints in pixel coordinates. */
export async function detectFace(canvas: HTMLCanvasElement): Promise<FaceKeypoints | null> {
  const detector = await getFaceDetector();
  const result = detector.detect(canvas);
  const best = [...result.detections].sort((a, b) => (b.categories[0]?.score ?? 0) - (a.categories[0]?.score ?? 0))[0];
  if (!best || best.keypoints.length < 6) return null;
  const p = (i: number) => ({ x: best.keypoints[i].x * canvas.width, y: best.keypoints[i].y * canvas.height });
  return { rightEye: p(0), leftEye: p(1), nose: p(2), mouth: p(3), rightEar: p(4), leftEar: p(5) };
}

/** Returns per-pixel hair confidence resized to the canvas size. */
export async function segmentHair(canvas: HTMLCanvasElement): Promise<Float32Array> {
  const segmenter = await getHairSegmenter();
  const result = segmenter.segment(canvas);
  try {
    const masks = result.confidenceMasks ?? [];
    const hairMask = masks[masks.length > 1 ? 1 : 0];
    if (!hairMask) throw new Error("no mask");
    const data = hairMask.getAsFloat32Array();
    if (hairMask.width === canvas.width && hairMask.height === canvas.height) return new Float32Array(data);
    // Nearest-neighbour resample to the photo size.
    const out = new Float32Array(canvas.width * canvas.height);
    const sx = hairMask.width / canvas.width;
    const sy = hairMask.height / canvas.height;
    for (let y = 0; y < canvas.height; y += 1) {
      const row = Math.min(hairMask.height - 1, Math.floor(y * sy)) * hairMask.width;
      for (let x = 0; x < canvas.width; x += 1) {
        out[y * canvas.width + x] = data[row + Math.min(hairMask.width - 1, Math.floor(x * sx))];
      }
    }
    return out;
  } finally {
    result.close();
  }
}
