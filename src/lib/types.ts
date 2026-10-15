export const LOCALES = ["en", "fr", "ar"] as const;
export type Locale = (typeof LOCALES)[number];

export type Localized = Record<Locale, string>;

export const CATEGORIES = ["men", "women"] as const;
export type Category = (typeof CATEGORIES)[number];

export const LENGTHS = ["short", "medium", "long"] as const;
export type HairLength = (typeof LENGTHS)[number];

export const TEXTURES = ["straight", "wavy", "curly", "coily"] as const;
export type Texture = (typeof TEXTURES)[number];

export const STYLE_TAGS = ["classic", "modern", "professional", "casual", "bold", "natural"] as const;
export type StyleTag = (typeof STYLE_TAGS)[number];

export const MAINTENANCE_LEVELS = ["low", "medium", "high"] as const;
export type Maintenance = (typeof MAINTENANCE_LEVELS)[number];

export const FACE_SHAPES = ["oval", "round", "square", "heart", "oblong"] as const;
export type FaceShape = (typeof FACE_SHAPES)[number];

/** Parameters for the built-in vector illustration of a hairstyle. */
export interface IllustrationSpec {
  /** How far hair falls: 0 = none/scalp, 1 = above ears, 2 = ear/jaw, 3 = chin, 4 = shoulders, 5 = chest. */
  fall: 0 | 1 | 2 | 3 | 4 | 5;
  /** Volume on top of the head, 0–4. */
  volume: 0 | 1 | 2 | 3 | 4;
  fringe?: "none" | "straight" | "curtain" | "side" | "textured" | "swept-back" | "wispy";
  /** Short or faded sides drawn as a gradient. */
  fade?: "none" | "low" | "mid" | "high" | "buzz";
  pattern?: "straight" | "wavy" | "curly" | "coily";
  /** Silhouette modifiers. */
  shape?: "round" | "afro" | "quiff" | "pompadour" | "mullet" | "parted" | "shag" | "bob" | "sleek";
  /** Hair colour used for the illustration only. */
  color?: string;
}

/** A licensed photograph. Only add one when its licence permits use in this app. */
export interface ReferencePhoto {
  src: string;
  alt: Localized;
  credit: string;
  license: string;
  sourceUrl: string;
}

export interface BarberInstructions {
  overall: Localized;
  top?: Localized;
  sides?: Localized;
  back?: Localized;
  fadeOrTaper?: Localized;
}

export interface Hairstyle {
  id: string;
  slug: string;
  category: Category;
  name: Localized;
  description: Localized;
  length: HairLength;
  textures: Texture[];
  tags: StyleTag[];
  maintenance: Maintenance;
  /** Face shapes this cut is commonly suggested for in general styling guidance. Never a guarantee. */
  faceShapes?: FaceShape[];
  styling: Localized[];
  barber: BarberInstructions;
  notes?: Localized;
  tools?: Localized[];
  illustration: IllustrationSpec;
  photo?: ReferencePhoto;
  featured?: boolean;
}
