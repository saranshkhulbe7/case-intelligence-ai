import { DefaultAzureCredential } from "@azure/identity";
import {
  BlobSASPermissions,
  BlobServiceClient,
  generateBlobSASQueryParameters,
  SASProtocol,
} from "@azure/storage-blob";
import { env } from "../../env";
import { AppError } from "../utils/app-error";

const SAS_START_SKEW_MS = 5 * 60 * 1000;
const SAS_LIFETIME_MS = 10 * 60 * 1000;

const credential = new DefaultAzureCredential();
const serviceClient = new BlobServiceClient(
  `https://${env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
  credential,
);
const containerClient = serviceClient.getContainerClient(
  env.AZURE_STORAGE_CONTAINER_NAME,
);

type BlobProperties = {
  contentLength: number | undefined;
  contentType: string | undefined;
};

function getStatusCode(error: unknown) {
  if (typeof error !== "object" || error === null || !("statusCode" in error)) {
    return undefined;
  }

  const { statusCode } = error;
  return typeof statusCode === "number" ? statusCode : undefined;
}

export async function createBlobUploadUrl(blobName: string) {
  const now = Date.now();
  const startsOn = new Date(now - SAS_START_SKEW_MS);
  const expiresOn = new Date(now + SAS_LIFETIME_MS);

  try {
    const userDelegationKey = await serviceClient.getUserDelegationKey(
      startsOn,
      expiresOn,
    );
    const sas = generateBlobSASQueryParameters(
      {
        containerName: env.AZURE_STORAGE_CONTAINER_NAME,
        blobName,
        permissions: BlobSASPermissions.parse("cw"),
        startsOn,
        expiresOn,
        protocol: SASProtocol.Https,
      },
      userDelegationKey,
      env.AZURE_STORAGE_ACCOUNT_NAME,
    ).toString();

    return {
      uploadUrl: `${containerClient.getBlockBlobClient(blobName).url}?${sas}`,
      expiresAt: expiresOn.toISOString(),
    };
  } catch {
    throw new AppError(503, "Unable to prepare the document upload");
  }
}

export async function getBlobProperties(
  blobName: string,
): Promise<BlobProperties> {
  try {
    const properties = await containerClient
      .getBlockBlobClient(blobName)
      .getProperties();

    return {
      contentLength: properties.contentLength,
      contentType: properties.contentType,
    };
  } catch (error) {
    if (getStatusCode(error) === 404) {
      throw new AppError(400, "Uploaded blob was not found");
    }

    throw new AppError(503, "Unable to verify the uploaded document");
  }
}
