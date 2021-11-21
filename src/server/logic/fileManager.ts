import S3 from 'aws-sdk/clients/s3';
import {Readable} from 'stream';
import {ReadStream} from 'fs';

class FileManager {
	private s3: S3;

	private readonly bucket: string;

	constructor() {
		this.s3 = new S3({
			region: process.env.AWS_BUCKET_REGION!,
			accessKeyId: process.env.AWS_ACCESS_KEY!,
			secretAccessKey: process.env.AWS_SECRET_KEY!
		});
		this.bucket = process.env.AWS_BUCKET_NAME!;
	}

	public uploadFile = async (file: string | ReadStream, key: string): Promise<boolean> => {
		try {
			await this.s3.upload({Key: key, Body: file, Bucket: this.bucket}).promise();
			return true;
		} catch (error) {
			return false;
		}
	};

	public getFileAsString = async (key: string): Promise<string | undefined> => {
		const file = (await this.s3.getObject({Key: key, Bucket: this.bucket}).promise()).Body;
		if (file !== undefined) return file.toString();
	};

	public getFileStream = (key: string): Readable =>
		this.s3.getObject({Key: key, Bucket: this.bucket}).createReadStream();

	public deleteFile = async (key: string): Promise<boolean> => {
		try {
			await this.s3.deleteObject({Key: key, Bucket: this.bucket}).promise();
			return true;
		} catch (error) {
			return false;
		}
	};

	public setup = async () => {
		try {
			await this.s3.headObject({Key: 'state.json', Bucket: this.bucket}).promise();
			if (process.env.NODE_ENV === 'testing')
				await this.uploadFile(JSON.stringify({lastBeatmapset: 0, lastDate: 0}), 'state.json');
		} catch (error) {
			await this.uploadFile(JSON.stringify({lastBeatmapset: 0, lastDate: 0}), 'state.json');
		}
	};
}

export default new FileManager();