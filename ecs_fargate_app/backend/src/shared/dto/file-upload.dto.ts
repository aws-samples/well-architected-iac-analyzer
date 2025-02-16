import { IsString, IsNotEmpty } from 'class-validator';

export class FileUploadResponseDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;
}