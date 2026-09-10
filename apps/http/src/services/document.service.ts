import { randomUUID } from "node:crypto";
import { Prisma } from "@case-intelligence/db/client";
import { AppError } from "../utils/app-error";
import {
  createBlobUploadUrl,
  deleteBlobIfExists,
  getBlobProperties,
} from "./azure-blob.service";
import { db } from "../utils/db";

type DocumentCategoryInput = "CASE_EVIDENCE" | "GOVERNING_POLICY";

type CreateDocumentUploadInput = {
  caseId: string;
  fileName: string;
  contentType: "application/pdf";
  sizeBytes: number;
  category: DocumentCategoryInput;
};

const DOCUMENT_PIPELINE_VERSION = 1;

const documentSelect = {
  id: true,
  originalName: true,
  contentType: true,
  sizeBytes: true,
  category: true,
  status: true,
  uploadedAt: true,
  createdAt: true,
} satisfies Prisma.DocumentSelect;

const uploadDocumentSelect = {
  ...documentSelect,
  blobName: true,
} satisfies Prisma.DocumentSelect;

async function getOwnedCase(userId: string, caseId: string) {
  const caseItem = await db.case.findFirst({
    where: {
      id: caseId,
      createdById: userId,
    },
    select: {
      id: true,
    },
  });

  if (!caseItem) {
    throw new AppError(404, "Case not found");
  }

  return caseItem;
}

async function getOwnedUploadDocument(userId: string, documentId: string) {
  const document = await db.document.findFirst({
    where: {
      id: documentId,
      case: {
        createdById: userId,
      },
    },
    select: uploadDocumentSelect,
  });

  if (!document) {
    throw new AppError(404, "Document not found");
  }

  return document;
}

export async function listDocuments(userId: string, caseId: string) {
  await getOwnedCase(userId, caseId);

  return db.document.findMany({
    where: {
      caseId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: documentSelect,
  });
}

export async function requestDocumentUpload(
  userId: string,
  input: CreateDocumentUploadInput,
) {
  await getOwnedCase(userId, input.caseId);

  const documentId = randomUUID();
  const blobName = `cases/${input.caseId}/documents/${documentId}/original.pdf`;
  const document = await db.document.create({
    data: {
      id: documentId,
      caseId: input.caseId,
      originalName: input.fileName,
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
      blobName,
      category: input.category,
      status: "UPLOADING",
    },
    select: documentSelect,
  });

  try {
    const upload = await createBlobUploadUrl(blobName);

    return {
      document,
      ...upload,
    };
  } catch (error) {
    await db.document.delete({ where: { id: documentId } }).catch(() => undefined);
    throw error;
  }
}

export async function refreshDocumentUploadUrl(userId: string, documentId: string) {
  const document = await getOwnedUploadDocument(userId, documentId);

  if (document.status !== "UPLOADING") {
    throw new AppError(409, "Upload URL can only be refreshed while uploading");
  }

  return createBlobUploadUrl(document.blobName);
}

export async function cancelDocumentUpload(userId: string, documentId: string) {
  const document = await getOwnedUploadDocument(userId, documentId);

  if (document.status !== "UPLOADING") {
    throw new AppError(409, "Upload can only be cancelled while uploading");
  }

  await deleteBlobIfExists(document.blobName);
  await db.document.delete({
    where: {
      id: document.id,
    },
  });

  return { success: true };
}

export async function completeDocumentUpload(userId: string, documentId: string) {
  const document = await getOwnedUploadDocument(userId, documentId);

  if (document.status !== "UPLOADING") {
    if (
      document.status === "UPLOADED" ||
      document.status === "PROCESSING" ||
      document.status === "READY"
    ) {
      return db.document.findUniqueOrThrow({
        where: {
          id: document.id,
        },
        select: documentSelect,
      });
    }

    throw new AppError(409, "Document is not awaiting upload completion");
  }

  const blob = await getBlobProperties(document.blobName);

  if (blob.contentLength !== document.sizeBytes) {
    throw new AppError(400, "Uploaded blob size does not match the document");
  }

  if (blob.contentType && blob.contentType !== document.contentType) {
    throw new AppError(400, "Uploaded blob content type is invalid");
  }

  return db.$transaction(async (tx) => {
    const uploadedAt = new Date();
    const claimedDocument = await tx.document.updateMany({
      where: {
        id: document.id,
        status: "UPLOADING",
      },
      data: {
        status: "UPLOADED",
        uploadedAt,
      },
    });

    if (claimedDocument.count === 0) {
      const existingDocument = await tx.document.findUnique({
        where: {
          id: document.id,
        },
        select: documentSelect,
      });

      if (!existingDocument) {
        throw new AppError(404, "Document not found");
      }

      if (
        existingDocument.status === "UPLOADED" ||
        existingDocument.status === "PROCESSING" ||
        existingDocument.status === "READY"
      ) {
        return existingDocument;
      }

      throw new AppError(409, "Document is not awaiting upload completion");
    }

    const processingJob = await tx.documentProcessingJob.upsert({
      where: {
        documentId_pipelineVersion: {
          documentId: document.id,
          pipelineVersion: DOCUMENT_PIPELINE_VERSION,
        },
      },
      update: {},
      create: {
        documentId: document.id,
        pipelineVersion: DOCUMENT_PIPELINE_VERSION,
        status: "PENDING",
      },
      select: {
        id: true,
      },
    });
    const dedupeKey = `document-processing:${processingJob.id}`;

    await tx.outboxEvent.upsert({
      where: {
        dedupeKey,
      },
      update: {},
      create: {
        type: "ENQUEUE_DOCUMENT_PROCESSING",
        status: "PENDING",
        dedupeKey,
        payload: {
          processingJobId: processingJob.id,
        },
      },
    });

    return tx.document.findUniqueOrThrow({
      where: {
        id: document.id,
      },
      select: documentSelect,
    });
  });
}
