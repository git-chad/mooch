"use client";

import { Tooltip } from "@base-ui-components/react";
import { Info, Upload, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "../lib/cn";

const DEFAULT_ACCEPT = "image/png,image/jpeg,image/webp";
const DEFAULT_MAX_SIZE_BYTES = 5 * 1024 * 1024;

export type AssetUploadProps = {
  label?: string;
  value: File | null;
  onValueChange: (file: File | null) => void;
  accept?: string;
  maxSizeBytes?: number;
  helperText?: string;
  infoText?: string;
  previewUrl?: string | null;
  previewAlt?: string;
  disabled?: boolean;
  className?: string;
};

function formatFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (Number.isInteger(mb)) return `${mb} MB`;
  return `${mb.toFixed(1)} MB`;
}

function getAcceptTokens(accept: string): string[] {
  return accept
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
}

function tokenLabel(token: string): string {
  if (token === "image/jpeg") return "JPG";
  if (token === "image/png") return "PNG";
  if (token === "image/webp") return "WEBP";
  if (token.endsWith("/*")) return token.replace("/*", "").toUpperCase();
  if (token.startsWith(".")) return token.slice(1).toUpperCase();
  if (token.includes("/")) return token.split("/")[1]?.toUpperCase() ?? token;
  return token.toUpperCase();
}

function acceptedLabel(tokens: string[]): string {
  return Array.from(new Set(tokens.map(tokenLabel))).join(", ");
}

function matchesAccept(file: File, tokens: string[]): boolean {
  if (tokens.length === 0) return true;

  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  return tokens.some((token) => {
    if (token.startsWith(".")) return fileName.endsWith(token);
    if (token.endsWith("/*")) {
      const prefix = token.slice(0, token.length - 1);
      return fileType.startsWith(prefix);
    }
    if (!fileType) {
      if (token === "image/jpeg") return /\.(jpg|jpeg)$/i.test(fileName);
      if (token === "image/png") return /\.png$/i.test(fileName);
      if (token === "image/webp") return /\.webp$/i.test(fileName);
    }
    return fileType === token;
  });
}

export function AssetUpload({
  label,
  value,
  onValueChange,
  accept = DEFAULT_ACCEPT,
  maxSizeBytes = DEFAULT_MAX_SIZE_BYTES,
  helperText,
  infoText,
  previewUrl = null,
  previewAlt = "Selected file preview",
  disabled,
  className,
}: AssetUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const id = useId();
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [objectPreviewUrl, setObjectPreviewUrl] = useState<string | null>(null);
  const hasSelection = Boolean(value);

  const acceptTokens = useMemo(() => getAcceptTokens(accept), [accept]);
  const maxSizeLabel = useMemo(
    () => formatFileSize(maxSizeBytes),
    [maxSizeBytes],
  );
  const acceptLabel = useMemo(
    () => acceptedLabel(acceptTokens),
    [acceptTokens],
  );

  useEffect(() => {
    if (!value) {
      setObjectPreviewUrl(null);
      return;
    }

    const nextObjectUrl = URL.createObjectURL(value);
    setObjectPreviewUrl(nextObjectUrl);

    return () => {
      URL.revokeObjectURL(nextObjectUrl);
    };
  }, [value]);

  function clearSelection() {
    if (disabled) return;
    onValueChange(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function validateAndSetFile(file: File) {
    if (!matchesAccept(file, acceptTokens)) {
      setError(`Unsupported format. Use ${acceptLabel}.`);
      return;
    }

    if (file.size > maxSizeBytes) {
      setError(`File is too large. Max ${maxSizeLabel}.`);
      return;
    }

    setError(null);
    onValueChange(file);
  }

  function handleFileSelect(file: File | null | undefined) {
    if (!file || disabled) return;
    validateAndSetFile(file);
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <div className="flex items-center gap-1.5">
          <label
            htmlFor={id}
            className="text-xs font-medium text-[#4A3728] font-sans select-none"
          >
            {label}
          </label>
          <Tooltip.Root>
            <Tooltip.Trigger
              render={
                <button
                  type="button"
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#D8C8BC] bg-[#FDFCFB] text-[#8C7463]"
                  aria-label="Upload requirements"
                  disabled={disabled}
                >
                  <Info size={11} />
                </button>
              }
            />
            <Tooltip.Portal>
              <Tooltip.Positioner sideOffset={6}>
                <Tooltip.Popup className="max-w-[240px] rounded-lg border border-[#D8C8BC] bg-[#FFFDF8] px-2.5 py-2 text-[11px] leading-relaxed text-[#5C4A3A] shadow-[0_8px_24px_rgba(64,42,24,0.12)]">
                  {infoText ?? `${acceptLabel} up to ${maxSizeLabel}.`}
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>
      )}

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        onChange={(event) => {
          handleFileSelect(event.target.files?.[0]);
          event.currentTarget.value = "";
        }}
        disabled={disabled}
        className="hidden"
      />

      {!hasSelection && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setDragActive(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setDragActive(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            handleFileSelect(event.dataTransfer.files?.[0]);
          }}
          className={cn(
            "w-full rounded-xl border border-dashed px-4 py-4 text-left transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7FBE44] focus-visible:ring-offset-2",
            disabled
              ? "cursor-not-allowed border-[#E7DDD5] bg-[#F9F6F2] opacity-60"
              : dragActive
                ? "border-[#7FBE44] bg-[#F4FBEF]"
                : "border-[#D8C8BC] bg-[#FDFCFB] hover:border-[#BFAE9E] hover:bg-[#F8F5F1]",
          )}
        >
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#D8C8BC] bg-[#F8F6F1] text-[#8C7463]">
              <Upload size={15} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[#3F2F21] font-sans">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-[#7A6E65] font-sans">
                {acceptLabel} up to {maxSizeLabel}
              </p>
            </div>
          </div>
        </button>
      )}

      {(objectPreviewUrl ?? previewUrl) && (
        <div
          role="img"
          aria-label={previewAlt}
          className="aspect-[3/1] w-full rounded-xl border border-[#E2D4C8] bg-cover bg-center"
          style={{ backgroundImage: `url(${objectPreviewUrl ?? previewUrl})` }}
        />
      )}

      {value && (
        <div className="flex items-center justify-between rounded-lg border border-[#E2D4C8] bg-[#F8F6F1] px-3 py-2">
          <p className="truncate pr-3 text-xs text-[#6F5D50] font-sans">
            {value.name}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1 text-xs text-[#5A9629] font-sans hover:text-[#3D6B1A]"
              disabled={disabled}
            >
              Change
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="inline-flex items-center gap-1 text-xs text-[#7F1D1D] font-sans hover:text-[#9D2B2B]"
              disabled={disabled}
            >
              <X size={12} />
              Remove
            </button>
          </div>
        </div>
      )}

      {(error || helperText) && (
        <p
          className={cn(
            "text-xs leading-snug font-sans",
            error ? "text-[#C0392B]" : "text-[#7A6E65]",
          )}
        >
          {error ?? helperText}
        </p>
      )}
    </div>
  );
}
