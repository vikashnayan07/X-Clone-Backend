"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const storage_blob_1 = require("@azure/storage-blob");
const supportedMediaTypes = {
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
        credential: new storage_blob_1.StorageSharedKeyCredential(accountName, accountKey),
        publicBaseUrl: publicBaseUrl.replace(/\/$/, ""),
    };
}
function getSafeFileName(fileName) {
    return fileName
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9-_]/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 80);
}
class MediaServices {
    static getExtensionForMediaType(mediaType) {
        return supportedMediaTypes[mediaType];
    }
    static getBlobName(userId, fileName, mediaType) {
        const fileExtension = this.getExtensionForMediaType(mediaType);
        if (!fileExtension)
            throw new Error("Invalid media type");
        return `users/${userId}/tweets/${Date.now()}-${getSafeFileName(fileName)}.${fileExtension}`;
    }
    static getSignedUploadUrl(blobName, mediaType) {
        const { containerName, credential, publicBaseUrl } = getAzureConfig();
        const sasToken = (0, storage_blob_1.generateBlobSASQueryParameters)({
            containerName,
            blobName,
            permissions: storage_blob_1.BlobSASPermissions.parse("cw"),
            protocol: storage_blob_1.SASProtocol.Https,
            startsOn: new Date(Date.now() - 60 * 1000),
            expiresOn: new Date(Date.now() + 10 * 60 * 1000),
            contentType: mediaType,
        }, credential).toString();
        return `${publicBaseUrl}/${blobName}?${sasToken}`;
    }
    static uploadTweetMedia(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { accountName, containerName, credential } = getAzureConfig();
            const blobName = this.getBlobName(data.userId, data.fileName, data.mediaType);
            const blobServiceClient = new storage_blob_1.BlobServiceClient(`https://${accountName}.blob.core.windows.net`, credential);
            const blockBlobClient = blobServiceClient
                .getContainerClient(containerName)
                .getBlockBlobClient(blobName);
            yield blockBlobClient.uploadData(data.buffer, {
                blobHTTPHeaders: {
                    blobContentType: data.mediaType,
                },
            });
            const mediaBaseUrl = process.env.MEDIA_PUBLIC_BASE_URL || "http://localhost:8000/media";
            return `${mediaBaseUrl.replace(/\/$/, "")}/${blobName}`;
        });
    }
    static downloadMedia(blobName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!blobName || blobName.includes("..")) {
                throw new Error("Invalid media path");
            }
            const { accountName, containerName, credential } = getAzureConfig();
            const blobServiceClient = new storage_blob_1.BlobServiceClient(`https://${accountName}.blob.core.windows.net`, credential);
            const blockBlobClient = blobServiceClient
                .getContainerClient(containerName)
                .getBlockBlobClient(blobName);
            return blockBlobClient.download();
        });
    }
}
exports.default = MediaServices;
