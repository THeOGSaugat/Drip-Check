import { useCallback, useRef, useState } from "react";
import { Camera, ImageUp, RefreshCw, X } from "lucide-react";
import { ACCEPTED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from "@/lib/photo-types";
import { cn } from "@/lib/utils";

type Props = {
  preview: string | null;
  onImage: (dataUrl: string) => void;
  onClear: () => void;
  disabled?: boolean;
};

const ACCEPT = ACCEPTED_IMAGE_TYPES.join(",");

/** Downscales the upload so the analysis request stays small. */
function readAndCompress(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That image could not be opened."));
      img.onload = () => {
        const maxW = 1100;
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Image processing is unavailable."));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function UploadPanel({ preview, onImage, onClear, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File | undefined) => {
      setError(null);
      if (!file) return;
      if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
        setError("Use a JPG, JPEG, PNG or WEBP image.");
        return;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        setError("That image is over 10MB. Try a smaller one.");
        return;
      }
      try {
        onImage(await readAndCompress(file));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load that image.");
      }
    },
    [onImage],
  );

  if (preview) {
    return (
      <div className="space-y-4">
        <div className="drip-card overflow-hidden rounded-3xl">
          <img
            src={preview}
            alt="Your uploaded outfit"
            className="max-h-[60vh] w-full object-contain"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="drip-btn-ghost"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
          >
            <RefreshCw className="h-4 w-4" /> Replace image
          </button>
          <button type="button" className="drip-btn-ghost" onClick={onClear} disabled={disabled}>
            <X className="h-4 w-4" /> Remove
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFile(e.dataTransfer.files?.[0]);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        className={cn(
          "drip-card flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-3xl border-dashed text-center transition-colors sm:aspect-[16/9]",
          dragging && "border-accent bg-accent/5",
        )}
      >
        <ImageUp className="h-9 w-9 text-accent" />
        <p className="mt-4 font-display text-2xl font-bold tracking-tight">DROP THE FIT</p>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Upload a mirror selfie, outfit photo or full-body fit.
        </p>
        <p className="mt-4 text-[0.65rem] uppercase tracking-[0.24em] text-muted-foreground">
          JPG · JPEG · PNG · WEBP · max 10MB
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" className="drip-btn-primary" onClick={() => inputRef.current?.click()}>
          <ImageUp className="h-4 w-4" /> Browse photos
        </button>
        <button
          type="button"
          className="drip-btn-ghost sm:hidden"
          onClick={() => cameraRef.current?.click()}
        >
          <Camera className="h-4 w-4" /> Take a photo
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
