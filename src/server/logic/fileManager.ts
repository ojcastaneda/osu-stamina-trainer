import { readFile, writeFile } from 'fs';
import S3 from 'aws-sdk/clients/s3';
import { Readable } from 'stream';
import { promisify } from 'util';
import { ReadStream } from 'fs';

/**
 * Async/await version of node fs's readFile.
 */
const readFileAsync = promisify(readFile);

/**
 * Async/await version of node fs's writeFile.
 */
const writeFileAsync = promisify(writeFile);

/**
 * AWS API service.
 */
const s3 = new S3({
	region: process.env.AWS_BUCKET_REGION!,
	accessKeyId: process.env.AWS_ACCESS_KEY!,
	secretAccessKey: process.env.AWS_SECRET_KEY!
});

/**
 * Uploads a file with the provided contents to location of the cloud storage.
 *
 * @param content - The contents of the file to upload.
 * @param location - The location of the file to upload.
 * @returns A promise of whether or not the upload was successful.
 */
const uploadFileToCloudStorage = async (content: string | ReadStream, location: string): Promise<boolean> => {
	try {
		await s3.upload({ Key: location, Body: content, Bucket: process.env.AWS_BUCKET_NAME! }).promise();
		return true;
	} catch (error) {
		return false;
	}
};

/**
 * Retrieves a file's content that matches the provided location as a plain string from the cloud storage.
 *
 * @param location - The location of the file to retrieve.
 * @returns A promise of the file's content or undefined if not found.
 */
const retrieveCloudStorageFileAsString = async (location: string): Promise<string | undefined> => {
	const file = (await s3.getObject({ Key: location, Bucket: process.env.AWS_BUCKET_NAME! }).promise()).Body;
	if (file !== undefined) return file.toString();
};

/**
 * Retrieves a file's content that matches the provided location as a read stream from the cloud storage.
 *
 * @param location - The location of the file to retrieve.
 * @returns A read stream of the file's content.
 */
const retrieveCloudStorageFileStream = (location: string): Readable => s3.getObject({ Key: location, Bucket: process.env.AWS_BUCKET_NAME! }).createReadStream();

/**
 * Deletes a file that matches the provided location from the cloud storage.
 *
 * @param location - The location of the file to delete.
 * @returns A promise of whether or not the delete was successful.
 */
const deleteCloudStorageFile = async (location: string): Promise<boolean> => {
	try {
		await s3.deleteObject({ Key: location, Bucket: process.env.AWS_BUCKET_NAME! }).promise();
		return true;
	} catch (error) {
		return false;
	}
};

/**
 * Initializes the cloud storage with the default state if needed. 
 */
const setupCloudStorage = async () => {
	try {
		await s3.headObject({ Key: 'state.json', Bucket: process.env.AWS_BUCKET_NAME! }).promise();
		if (process.env.NODE_ENV === 'testing') await uploadFileToCloudStorage(JSON.stringify({ lastBeatmapset: 0, lastDate: 0 }), 'state.json');
	} catch (error) {
		await uploadFileToCloudStorage(JSON.stringify({ lastBeatmapset: 0, lastDate: 0 }), 'state.json');
	}
};

export {
	readFileAsync,
	writeFileAsync,
	uploadFileToCloudStorage,
	retrieveCloudStorageFileAsString,
	retrieveCloudStorageFileStream,
	deleteCloudStorageFile,
	setupCloudStorage
};
