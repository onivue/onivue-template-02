import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import type { ObjectStorage, StoredObject } from '@/lib/storage/object-storage';

import { SERVER_CONFIG } from '@/config/env';

export type S3StorageConfig = {
	accessKeyId: string;
	bucket: string;
	endpoint: string;
	region: string;
	secretAccessKey: string;
};

// neon object storage speaks s3 with a custom endpoint, which requires path-style addressing
export class S3ObjectStorage implements ObjectStorage {
	private readonly client: S3Client;

	public constructor(private readonly config: S3StorageConfig) {
		this.client = new S3Client({
			credentials: {
				accessKeyId: config.accessKeyId,
				secretAccessKey: config.secretAccessKey,
			},
			endpoint: config.endpoint,
			forcePathStyle: true,
			region: config.region,
		});
	}

	public async upload(object: StoredObject): Promise<void> {
		await this.client.send(
			new PutObjectCommand({
				Body: object.body,
				Bucket: this.config.bucket,
				ContentType: object.contentType,
				Key: object.key,
			})
		);
	}

	public async readUrl(key: string, expiresInSeconds: number): Promise<string> {
		return await getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.config.bucket, Key: key }), {
			expiresIn: expiresInSeconds,
		});
	}

	public async remove(key: string): Promise<void> {
		await this.client.send(new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key }));
	}
}

// storage is optional. without credentials the app keeps working and the upload ui says why.
export const objectStorage: null | ObjectStorage = SERVER_CONFIG.storage
	? new S3ObjectStorage(SERVER_CONFIG.storage)
	: null;

export const isStorageConfigured = objectStorage !== null;
