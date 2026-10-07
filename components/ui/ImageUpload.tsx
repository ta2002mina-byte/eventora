"use client";

import * as React from "react";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export interface ImageUploadProps {
  label?: string;
  /** Current image URL, if any (e.g. when editing an existing record). */
  value?: string;
  /** Called with the new public URL once upload succeeds, or "" on remove. */
  onChange: (url: string) => void;
  /** Storage path prefix, e.g. "events", "venues", "vendors". */
  folder: string;
  className?: string;
}

export function ImageUpload({ label, value, onChange, folder, className }: ImageUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<string | undefined>(value);

  React.useEffect(() => {
    setPreview(value);
  }, [value]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please choose a JPG, PNG, or WEBP image.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("Image must be smaller than 5MB.");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Please sign in to upload images.");
      setUploading(false);
      return;
    }

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${folder}/${user.id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      setError("Upload failed. Please try again.");
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from("images").getPublicUrl(path);
    setPreview(publicUrlData.publicUrl);
    onChange(publicUrlData.publicUrl);
    setUploading(false);
  }

  function handleRemove() {
    setPreview(undefined);
    setError(null);
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className={cn("w-full", className)}>
      {label && <p className="mb-1.5 text-sm font-medium text-charcoal">{label}</p>}

      {preview ? (
        <div className="relative h-40 w-full overflow-hidden rounded-card border border-border">
          <Image src={preview} alt="" fill sizes="400px" className="object-cover" />
          <button
            type="button"
            onClick={handleRemove}
            aria-label="Remove image"
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-charcoal/70 text-warmwhite hover:bg-charcoal/90"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-border bg-purple-50/40 text-charcoal-400 transition-colors hover:border-purple-300 hover:bg-purple-50 disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-purple-700" />
          ) : (
            <Upload className="h-6 w-6" />
          )}
          <span className="text-sm">
            {uploading ? "Uploading…" : "Click to upload an image"}
          </span>
          <span className="text-xs text-charcoal-400">JPG, PNG or WEBP, up to 5MB</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
}
