/**
 * Ultra-fast, client-side image and PDF raster compression engine for Scribe.
 * Prevents WebKit canvas memory exhaustion (SIGKILL crashes) and IndexedDB QuotaExceededError.
 */

export interface CompressionOptions {
  maxDimension?: number;
  quality?: number;
  format?: 'image/jpeg' | 'image/webp';
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxDimension: 1400,
  quality: 0.82,
  format: 'image/jpeg',
};

/**
 * Compresses an existing data URL (e.g. huge uncompressed PNG) to a lightweight JPEG/WebP.
 */
export async function compressImageDataUrl(
  dataUrl: string,
  options: CompressionOptions = {}
): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return dataUrl;
  }

  // If already a small JPEG/WebP under 120KB, don't re-compress
  if ((dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/webp')) && dataUrl.length < 160000) {
    return dataUrl;
  }

  const { maxDimension, quality, format } = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const { naturalWidth: w, naturalHeight: h } = img;
        if (!w || !h) {
          resolve(dataUrl);
          return;
        }

        let targetW = w;
        let targetH = h;
        const maxCurrent = Math.max(w, h);

        if (maxCurrent > maxDimension) {
          const ratio = maxDimension / maxCurrent;
          targetW = Math.round(w * ratio);
          targetH = Math.round(h * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d', { willReadFrequently: false });

        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        // Fill white background for JPEG compression
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetW, targetH);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetW, targetH);

        const compressed = canvas.toDataURL(format, quality);

        // Only return compressed if it actually saved space or was a huge PNG
        if (compressed.length < dataUrl.length || dataUrl.startsWith('data:image/png')) {
          resolve(compressed);
        } else {
          resolve(dataUrl);
        }
      } catch (err) {
        console.warn('Image compression fallback:', err);
        resolve(dataUrl);
      }
    };

    img.onerror = () => {
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}

/**
 * Compresses an uploaded File or Blob to an optimized data URL and dimension payload.
 */
export async function compressUploadedFile(
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<{ dataUrl: string; width: number; height: number; originalSize: number; compressedSize: number }> {
  const originalSize = file.size;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = async (e) => {
      const rawDataUrl = e.target?.result as string;
      if (!rawDataUrl) {
        reject(new Error('Empty file content'));
        return;
      }

      const img = new Image();
      img.onload = async () => {
        const { naturalWidth: w, naturalHeight: h } = img;
        const { maxDimension, quality, format } = { ...DEFAULT_OPTIONS, ...options };

        let targetW = w;
        let targetH = h;
        const maxCurrent = Math.max(w, h);

        if (maxCurrent > maxDimension) {
          const ratio = maxDimension / maxCurrent;
          targetW = Math.round(w * ratio);
          targetH = Math.round(h * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d', { willReadFrequently: false });

        if (!ctx) {
          resolve({
            dataUrl: rawDataUrl,
            width: targetW,
            height: targetH,
            originalSize,
            compressedSize: rawDataUrl.length,
          });
          return;
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetW, targetH);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetW, targetH);

        const compressedDataUrl = canvas.toDataURL(format, quality);

        resolve({
          dataUrl: compressedDataUrl,
          width: targetW,
          height: targetH,
          originalSize,
          compressedSize: Math.round((compressedDataUrl.length * 3) / 4),
        });
      };

      img.onerror = () => {
        resolve({
          dataUrl: rawDataUrl,
          width: 500,
          height: 500,
          originalSize,
          compressedSize: rawDataUrl.length,
        });
      };

      img.src = rawDataUrl;
    };

    reader.readAsDataURL(file);
  });
}
