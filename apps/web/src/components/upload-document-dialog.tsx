import { BlockBlobClient } from "@azure/storage-blob";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@agent-platform/ui/components/button";
import { FileText } from "@agent-platform/ui/components/icons";
import { Label } from "@agent-platform/ui/components/label";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { formatFileSize } from "../lib/case-presentation";
import { trpc } from "../lib/trpc";
import { FileDropzone } from "./file-dropzone";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const MAX_FILES = 10;
const BATCH_CONCURRENCY = 2;
const FILE_BLOCK_SIZE = 4 * 1024 * 1024;
const FILE_BLOCK_CONCURRENCY = 2;

const uploadFormSchema = z.object({
  files: z
    .array(z.instanceof(File))
    .min(1, "Select at least one PDF file")
    .max(MAX_FILES, `Select up to ${MAX_FILES} files`)
    .superRefine((files, context) => {
      files.forEach((file, index) => {
        if (!file.name.toLowerCase().endsWith(".pdf")) {
          context.addIssue({
            code: "custom",
            message: "Only PDF files are supported",
            path: [index],
          });
        }

        if (file.type !== "application/pdf") {
          context.addIssue({
            code: "custom",
            message: "PDF files must use the application/pdf content type",
            path: [index],
          });
        }

        if (file.size === 0) {
          context.addIssue({
            code: "custom",
            message: "PDF files cannot be empty",
            path: [index],
          });
        }

        if (file.size > MAX_FILE_SIZE) {
          context.addIssue({
            code: "custom",
            message: `PDF files must be at most ${formatFileSize(MAX_FILE_SIZE)}`,
            path: [index],
          });
        }
      });
    }),
  category: z.enum(["CASE_EVIDENCE", "GOVERNING_POLICY"]),
});

type UploadForm = z.infer<typeof uploadFormSchema>;
type UploadState =
  | "PENDING"
  | "PREPARING"
  | "UPLOADING"
  | "FINALIZING"
  | "DONE"
  | "ERROR";

type UploadItem = {
  key: string;
  file: File;
  category: UploadForm["category"];
  state: UploadState;
  documentId?: string;
  error?: string;
};

type UploadDocumentDialogProps = {
  caseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const uploadStateLabel: Record<UploadState, string> = {
  PENDING: "Pending",
  PREPARING: "Preparing...",
  UPLOADING: "Uploading...",
  FINALIZING: "Finalizing...",
  DONE: "Uploaded",
  ERROR: "Failed",
};

function uploadErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Upload failed. Try again.";
}

export function UploadDocumentDialog({
  caseId,
  open,
  onOpenChange,
}: UploadDocumentDialogProps) {
  const utils = trpc.useUtils();
  const requestUpload = trpc.documentRouter.requestUpload.useMutation();
  const refreshUploadUrl = trpc.documentRouter.refreshUploadUrl.useMutation();
  const completeUpload = trpc.documentRouter.completeUpload.useMutation();
  const form = useForm<UploadForm>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      files: [],
      category: "CASE_EVIDENCE",
    },
  });
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const files = form.watch("files");
  const hasActiveUpload = uploadItems.some((item) =>
    ["PENDING", "PREPARING", "UPLOADING", "FINALIZING"].includes(item.state),
  );

  function updateUploadItem(key: string, update: Partial<UploadItem>) {
    setUploadItems((current) =>
      current.map((item) => (item.key === key ? { ...item, ...update } : item)),
    );
  }

  async function finishSuccessfulBatch() {
    await utils.documentRouter.list.invalidate({ caseId });
    form.reset();
    setUploadItems([]);
    onOpenChange(false);
  }

  async function uploadItem(item: UploadItem) {
    try {
      updateUploadItem(item.key, { state: "PREPARING", error: undefined });

      let documentId = item.documentId;
      let uploadUrl: string;

      if (documentId) {
        const refreshed = await refreshUploadUrl.mutateAsync({ documentId });
        uploadUrl = refreshed.uploadUrl;
      } else {
        const requested = await requestUpload.mutateAsync({
          caseId,
          fileName: item.file.name,
          contentType: "application/pdf",
          sizeBytes: item.file.size,
          category: item.category,
        });
        documentId = requested.document.id;
        uploadUrl = requested.uploadUrl;
        updateUploadItem(item.key, { documentId });
      }

      updateUploadItem(item.key, { state: "UPLOADING" });
      const blockBlobClient = new BlockBlobClient(uploadUrl);
      await blockBlobClient.uploadBrowserData(item.file, {
        blockSize: FILE_BLOCK_SIZE,
        concurrency: FILE_BLOCK_CONCURRENCY,
        blobHTTPHeaders: {
          blobContentType: "application/pdf",
        },
      });

      updateUploadItem(item.key, { state: "FINALIZING" });
      await completeUpload.mutateAsync({ documentId });
      updateUploadItem(item.key, { state: "DONE" });
      return true;
    } catch (error) {
      updateUploadItem(item.key, {
        state: "ERROR",
        error: uploadErrorMessage(error),
      });
      return false;
    }
  }

  async function uploadQueue(items: UploadItem[]) {
    const outcomes: boolean[] = [];
    let nextIndex = 0;
    const workers = Array.from(
      { length: Math.min(BATCH_CONCURRENCY, items.length) },
      async () => {
        while (nextIndex < items.length) {
          const item = items[nextIndex];
          nextIndex += 1;
          outcomes.push(await uploadItem(item));
        }
      },
    );

    await Promise.all(workers);
    return outcomes;
  }

  async function submit(values: UploadForm) {
    const items = values.files.map((file) => ({
      key: crypto.randomUUID(),
      file,
      category: values.category,
      state: "PENDING" as const,
    }));

    setUploadItems(items);
    const outcomes = await uploadQueue(items);

    if (outcomes.every(Boolean)) {
      await finishSuccessfulBatch();
    }
  }

  async function retryUpload(item: UploadItem) {
    const succeeded = await uploadItem(item);
    const otherItemsSucceeded = uploadItems
      .filter((current) => current.key !== item.key)
      .every((current) => current.state === "DONE");

    if (succeeded && otherItemsSucceeded) {
      await finishSuccessfulBatch();
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && hasActiveUpload) {
      return;
    }

    if (!nextOpen) {
      form.reset();
      setUploadItems([]);
    }

    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Upload documents</DialogTitle>
          <DialogDescription>
            PDFs upload directly to private case storage. Each file is verified before it is added to this case.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={form.handleSubmit(submit)}>
          <FileDropzone
            value={files}
            onChange={(nextFiles) =>
              form.setValue("files", nextFiles, { shouldValidate: true })
            }
            maxSize={MAX_FILE_SIZE}
            maxFiles={MAX_FILES}
            disabled={uploadItems.length > 0}
          />
          {form.formState.errors.files?.message && (
            <p role="alert" className="text-[12px] leading-4 text-danger">
              {form.formState.errors.files.message}
            </p>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="document-category">Category</Label>
            <select
              id="document-category"
              disabled={uploadItems.length > 0}
              className="h-8 rounded-md border border-input bg-surface px-2.5 text-[13px] text-foreground transition-colors hover:border-border-strong focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-55"
              {...form.register("category")}
            >
              <option value="CASE_EVIDENCE">Case evidence</option>
              <option value="GOVERNING_POLICY">Governing policy</option>
            </select>
          </div>

          {uploadItems.length > 0 && (
            <section className="grid gap-2 border-y border-border py-3">
              <div>
                <p className="ui-subsection-title">Upload progress</p>
                <p className="ui-meta mt-0.5">
                  Retry uses a fresh upload URL. Uploads do not continue after a page reload.
                </p>
              </div>
              <ul className="divide-y divide-border border-y border-border">
                {uploadItems.map((item) => (
                  <li key={item.key} className="flex items-center gap-2.5 px-2 py-2">
                    <FileText
                      aria-hidden="true"
                      className="shrink-0 text-muted-foreground"
                      size={15}
                      strokeWidth={1.7}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium leading-5">
                        {item.file.name}
                      </p>
                      <p className={item.state === "ERROR" ? "text-[12px] leading-4 text-danger" : "ui-meta"}>
                        {item.state === "ERROR" ? item.error : uploadStateLabel[item.state]}
                      </p>
                    </div>
                    <span className="ui-meta shrink-0">
                      {formatFileSize(item.file.size)}
                    </span>
                    {item.state === "ERROR" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void retryUpload(item)}
                      >
                        Retry
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={hasActiveUpload}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={hasActiveUpload || uploadItems.length > 0 || files.length === 0}
            >
              Upload {files.length === 1 ? "document" : "documents"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
