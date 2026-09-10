import {
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import { FileText, FileUp, X } from "@agent-platform/ui/components/icons";
import { cn } from "@agent-platform/ui/lib/utils";
import { formatFileSize } from "../lib/case-presentation";

type FileDropzoneProps = {
  value: File[];
  onChange: (files: File[]) => void;
  accept?: string;
  maxSize?: number;
  maxFiles?: number;
  multiple?: boolean;
  disabled?: boolean;
};

function fileKey(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function acceptsFile(file: File, accept: string) {
  return accept.split(",").some((rule) => {
    const value = rule.trim().toLowerCase();

    if (value.startsWith(".")) {
      return file.name.toLowerCase().endsWith(value);
    }

    if (value.endsWith("/*")) {
      return file.type.toLowerCase().startsWith(value.slice(0, -1));
    }

    return file.type.toLowerCase() === value;
  });
}

export function FileDropzone({
  value,
  onChange,
  accept = ".pdf,application/pdf",
  maxSize = 100 * 1024 * 1024,
  maxFiles = 10,
  multiple = true,
  disabled = false,
}: FileDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);

  function addFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList);
    const existing = new Set(value.map(fileKey));
    const uniqueFiles = incoming.filter((file) => !existing.has(fileKey(file)));
    const nextMessages: string[] = [];

    if (uniqueFiles.length !== incoming.length) {
      nextMessages.push("Duplicate files were not added.");
    }

    const validFiles = uniqueFiles.filter((file) => {
      if (!acceptsFile(file, accept)) {
        nextMessages.push(`${file.name} is not an accepted file type.`);
        return false;
      }

      if (file.size === 0) {
        nextMessages.push(`${file.name} is empty.`);
        return false;
      }

      if (file.size > maxSize) {
        nextMessages.push(`${file.name} exceeds ${formatFileSize(maxSize)}.`);
        return false;
      }

      return true;
    });

    if (value.length + validFiles.length > maxFiles) {
      nextMessages.push(`Select up to ${maxFiles} files in one upload.`);
      setMessages(nextMessages);
      return;
    }

    setMessages(nextMessages);
    onChange([...value, ...validFiles]);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      addFiles(event.target.files);
    }

    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    if (!disabled) {
      addFiles(event.dataTransfer.files);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled || (event.key !== "Enter" && event.key !== " ")) {
      return;
    }

    event.preventDefault();
    inputRef.current?.click();
  }

  return (
    <div className="grid gap-3">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-describedby={`${inputId}-help`}
        aria-disabled={disabled}
        className={cn(
          "grid min-h-36 place-items-center rounded-md border border-dashed px-4 py-5 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isDragging
            ? "border-primary bg-surface-selected"
            : "border-border bg-surface hover:border-border-strong hover:bg-surface-hover",
          disabled && "cursor-not-allowed opacity-55",
        )}
        onClick={() => !disabled && inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) {
            setIsDragging(true);
          }
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (event.currentTarget === event.target) {
            setIsDragging(false);
          }
        }}
        onDrop={handleDrop}
        onKeyDown={handleKeyDown}
      >
        <div className="grid justify-items-center gap-1.5">
          <FileUp
            aria-hidden="true"
            className="text-muted-foreground"
            size={20}
            strokeWidth={1.7}
          />
          <p className="text-[13px] font-medium leading-5 text-foreground">
            Drop PDF files here
          </p>
          <p className="text-[13px] leading-5 text-muted-foreground">
            or click to browse
          </p>
          <p id={`${inputId}-help`} className="ui-meta mt-1">
            PDF · up to {formatFileSize(maxSize)} each · max {maxFiles}
          </p>
        </div>
        <input
          ref={inputRef}
          id={inputId}
          className="sr-only"
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={handleInputChange}
        />
      </div>

      {messages.length > 0 && (
        <ul role="alert" className="grid gap-1 text-[12px] leading-4 text-danger">
          {messages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}

      {value.length > 0 && (
        <ul className="divide-y divide-border border-y border-border">
          {value.map((file) => (
            <li
              key={fileKey(file)}
              className="flex items-center gap-2.5 px-2 py-2"
            >
              <FileText
                aria-hidden="true"
                className="shrink-0 text-muted-foreground"
                size={15}
                strokeWidth={1.7}
              />
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium leading-5">
                {file.name}
              </span>
              <span className="ui-meta shrink-0">{formatFileSize(file.size)}</span>
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                disabled={disabled}
                className="flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-45"
                onClick={(event) => {
                  event.stopPropagation();
                  onChange(value.filter((item) => fileKey(item) !== fileKey(file)));
                }}
              >
                <X aria-hidden="true" size={14} strokeWidth={1.8} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
