export interface ValidationResult {
  valid: boolean;
  errorKey?: string;
  errorMessage?: string;
}

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

export function validateImageFile(file: File | Blob): ValidationResult {
  if (!file) {
    return { valid: false, errorKey: "errors.noFile", errorMessage: "No file provided" };
  }

  const type = file.type.toLowerCase();
  // If type is empty, allow if filename ends with image extension
  const name = (file as File).name || "";
  const validExtension = /\.(jpe?g|png|webp|bmp)$/i.test(name);

  if (type && !ALLOWED_MIME_TYPES.includes(type) && !validExtension) {
    return {
      valid: false,
      errorKey: "errors.unsupportedFile",
      errorMessage: "Only JPEG, PNG, or WebP images are supported.",
    };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      valid: false,
      errorKey: "errors.fileTooLarge",
      errorMessage: "Image file exceeds 10 MB limit.",
    };
  }

  return { valid: true };
}

/**
 * Resize and compress an image file client-side down to max dimension 1280px.
 * Keeps EXIF orientation upright, reduces upload payload, and speeds up inference.
 */
export async function compressImage(
  file: File | Blob,
  maxDimension: number = 1280,
  quality: number = 0.88
): Promise<Blob> {
  // If running in environment without Image or DOM (e.g. Node tests), return original
  if (typeof window === "undefined" || typeof document === "undefined") {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve(file);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(file);
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width <= maxDimension && height <= maxDimension && file.size < 1_500_000) {
          // Already within bounds & small enough
          resolve(file);
          return;
        }

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              resolve(blob);
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          quality
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

