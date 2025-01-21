import {Injectable} from '@nestjs/common';
import {S3} from '@aws-sdk/client-s3';
import {ConfigService} from '@nestjs/config';

@Injectable()
export class StorageService {
    private readonly s3Client: S3;
    private readonly bucketName: string;

    constructor(private configService: ConfigService) {
        this.s3Client = new S3({
            region: this.configService.get('AWS_REGION'),
        });
        this.bucketName = this.configService.get('WA_SOURCE_DOCS_S3_BUCKET');
    }

    async uploadFile(fileContent: string, fileName: string): Promise<string> {
        const key = `uploads/${fileName}`;

        await this.s3Client.putObject({
            Bucket: this.bucketName,
            Key: key,
            Body: fileContent,
            Metadata: {
                uploadTime: new Date().toISOString()
            }
        });

        return fileName;
    }

    async getFileContent(fileName: string): Promise<string> {
        const key = `uploads/${fileName}`;

        console.log(`Searching for ${key} in Bucket ${this.bucketName}`)

        const response = await this.s3Client.getObject({
            Bucket: this.bucketName,
            Key: key
        });

        return response.Body.transformToString();
    }

    async deleteExpiredFiles(): Promise<void> {
        const response = await this.s3Client.listObjects({
            Bucket: this.bucketName,
            Prefix: 'uploads/'
        });

        const now = new Date();
        const objects = response.Contents || [];

        for (const object of objects) {
            const metadata = await this.s3Client.headObject({
                Bucket: this.bucketName,
                Key: object.Key
            });

            const uploadTime = new Date(metadata.Metadata.uploadTime);
            const hoursSinceUpload = (now.getTime() - uploadTime.getTime()) / (1000 * 60 * 60);

            if (hoursSinceUpload >= 48) {
                await this.s3Client.deleteObject({
                    Bucket: this.bucketName,
                    Key: object.Key
                });
            }
        }
    }
}