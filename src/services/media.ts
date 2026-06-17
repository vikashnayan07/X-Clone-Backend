import {
  BlobSASPermissions,
  BlobServiceClient,
  generateBlobSASQueryParameters,
  SASProtocol,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";

const supportedMediaTypes: Record<string, string> = {
  "image/jpg": "jpg",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function getAzureConfig() {
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
  const publicBaseUrl = process.env.AZURE_STORAGE_PUBLIC_BASE_URL;

  if (!accountName || !accountKey || !containerName || !publicBaseUrl) {
    throw new Error("Azure storage is not configured");
  }

  return {
    accountName,
    containerName,
    credential: new StorageSharedKeyCredential(accountName, accountKey),
    publicBaseUrl: publicBaseUrl.replace(/\/$/, ""),
  };
}

function getSafeFileName(fileName: string) {
  return fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

class MediaServices {
  public static getExtensionForMediaType(mediaType: string) {
    return supportedMediaTypes[mediaType];
  }

  public static getBlobName(userId: string, fileName: string, mediaType: string) {
    const fileExtension = this.getExtensionForMediaType(mediaType);
    if (!fileExtension) throw new Error("Invalid media type");

    return `users/${userId}/tweets/${Date.now()}-${getSafeFileName(
      fileName
    )}.${fileExtension}`;
  }

  public static getSignedUploadUrl(blobName: string, mediaType: string) {
    const { containerName, credential, publicBaseUrl } = getAzureConfig();

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName,
        blobName,
        permissions: BlobSASPermissions.parse("cw"),
        protocol: SASProtocol.Https,
        startsOn: new Date(Date.now() - 60 * 1000),
        expiresOn: new Date(Date.now() + 10 * 60 * 1000),
        contentType: mediaType,
      },
      credential
    ).toString();

    return `${publicBaseUrl}/${blobName}?${sasToken}`;
  }

  public static async uploadTweetMedia(data: {
    userId: string;
    fileName: string;
    mediaType: string;
    buffer: Buffer;
  }) {
    const { accountName, containerName, credential } = getAzureConfig();
    const blobName = this.getBlobName(
      data.userId,
      data.fileName,
      data.mediaType
    );
    const blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      credential
    );
    const blockBlobClient = blobServiceClient
      .getContainerClient(containerName)
      .getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(data.buffer, {
      blobHTTPHeaders: {
        blobContentType: data.mediaType,
      },
    });

    const mediaBaseUrl =
      process.env.MEDIA_PUBLIC_BASE_URL || "http://localhost:8000/media";

    return `${mediaBaseUrl.replace(/\/$/, "")}/${blobName}`;
  }

  public static async downloadMedia(blobName: string) {
    if (!blobName || blobName.includes("..")) {
      throw new Error("Invalid media path");
    }

    const { accountName, containerName, credential } = getAzureConfig();
    const blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      credential
    );
    const blockBlobClient = blobServiceClient
      .getContainerClient(containerName)
      .getBlockBlobClient(blobName);

    return blockBlobClient.download();
  }
}

export default MediaServices;
