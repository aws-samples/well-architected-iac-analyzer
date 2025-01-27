import {Injectable, Logger} from '@nestjs/common';
import {S3} from '@aws-sdk/client-s3';
import {ConfigService} from '@nestjs/config';

@Injectable()
export class StorageService {
    private readonly s3Client: S3;
    private readonly bucketName: string;
    private readonly logger = new Logger(StorageService.name);

    constructor(private configService: ConfigService) {
        this.s3Client = new S3({
            region: this.configService.get('AWS_REGION'),
        });
        this.bucketName = this.configService.get('WA_SOURCE_DOCS_S3_BUCKET');
    }

    async uploadFile(fileContent: Buffer, fileName: string): Promise<string> {
        const key = `uploads/${fileName}`;

        await this.s3Client.putObject({
            Bucket: this.bucketName,
            Key: key,
            Body: fileContent,
            Metadata: {
                uploadTime: new Date().toISOString()
            }
        });

        this.logger.log("File upload successful");

        return fileName;
    }

    async getFileContent(fileName: string, fileType: string): Promise<string> {
        const key = `uploads/${fileName}`;
        let encoding = "utf-8";

        if (fileType.startsWith("image/")) {
            encoding = "base64";
        }
        
        this.logger.log(`Searching for ${key} in Bucket ${this.bucketName}`)

        const response = await this.s3Client.getObject({
            Bucket: this.bucketName,
            Key: key
        });

        return response.Body.transformToString(encoding);
    }

    async deleteExpiredFiles(): Promise<void> {
        const response = await this.s3Client.listObjects({
            Bucket: this.bucketName,
            Prefix: 'uploads/'
        });

        const now = new Date();
        const objects = response.Contents || [];

        for (const object of objects) {
            // log checking object
            this.logger.log(`Checking ${object.Key} for expiration`);
            const metadata = await this.s3Client.headObject({
                Bucket: this.bucketName,
                Key: object.Key
            });

            const uploadTime = new Date(metadata.Metadata.uploadtime);
            const hoursSinceUpload = (now.getTime() - uploadTime.getTime()) / (1000 * 60 * 60);

            if (hoursSinceUpload >= 8) {
                this.logger.log(`Deleting ${object}`);
                await this.s3Client.deleteObject({
                    Bucket: this.bucketName,
                    Key: object.Key
                });
            }
        }
    }
}