import z from "zod";
import {
  cancelDocumentUpload,
  completeDocumentUpload,
  listDocuments,
  refreshDocumentUploadUrl,
  requestDocumentUpload,
} from "../services/document.service";
import { protectedProcedure, router } from "../utils/trpc";

const documentCategorySchema = z.enum(["CASE_EVIDENCE", "GOVERNING_POLICY"]);

const uploadRequestSchema = z
  .object({
    caseId: z.string().uuid(),
    fileName: z
      .string()
      .max(255)
      .refine((value) => value.trim().length > 0, "File name is required"),
    contentType: z.literal("application/pdf"),
    sizeBytes: z.number().int().positive().max(100 * 1024 * 1024),
    category: documentCategorySchema,
  })
  .refine((input) => input.fileName.toLowerCase().endsWith(".pdf"), {
    message: "Only PDF files are supported",
    path: ["fileName"],
  });

export const documentRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        caseId: z.string().uuid(),
      }),
    )
    .query(({ ctx, input }) => {
      return listDocuments(ctx.authUser.id, input.caseId);
    }),
  requestUpload: protectedProcedure
    .input(uploadRequestSchema)
    .mutation(({ ctx, input }) => {
      return requestDocumentUpload(ctx.authUser.id, input);
    }),
  refreshUploadUrl: protectedProcedure
    .input(
      z.object({
        documentId: z.string().uuid(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return refreshDocumentUploadUrl(ctx.authUser.id, input.documentId);
    }),
  cancelUpload: protectedProcedure
    .input(
      z.object({
        documentId: z.string().uuid(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return cancelDocumentUpload(ctx.authUser.id, input.documentId);
    }),
  completeUpload: protectedProcedure
    .input(
      z.object({
        documentId: z.string().uuid(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return completeDocumentUpload(ctx.authUser.id, input.documentId);
    }),
});
