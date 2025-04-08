import { IsString, IsArray, IsNotEmpty, IsEnum, IsOptional, IsObject, IsBoolean } from 'class-validator';

export enum FileUploadMode {
  SINGLE_FILE = 'single_file',
  MULTIPLE_FILES = 'multiple_files',
  ZIP_FILE = 'zip_file'
}

export class AnalyzeRequestDto {
  @IsString()
  @IsNotEmpty()
  workloadId: string;

  @IsArray()
  @IsString({ each: true })
  selectedPillars: string[];

  @IsString()
  @IsNotEmpty()
  fileId: string;

  @IsEnum(FileUploadMode)
  @IsOptional()
  uploadMode?: FileUploadMode = FileUploadMode.SINGLE_FILE;

  templateType?: IaCTemplateType;

  @IsString()
  @IsOptional()
  supportingDocumentId?: string;
  
  @IsString()
  @IsOptional()
  supportingDocumentDescription?: string;

  @IsString()
  @IsOptional()
  lensAlias?: string;

  @IsString()
  @IsOptional()
  lensAliasArn?: string;

  @IsString()
  @IsOptional()
  lensName?: string;

  @IsObject()
  @IsOptional()
  lensPillars?: Record<string, string>;

  @IsBoolean()
  @IsOptional()
  isTempWorkload?: boolean;
}

export class UpdateWorkloadDto {
  @IsString()
  @IsNotEmpty()
  workloadId: string;

  @IsArray()
  results: any[];
}

export class GenerateReportDto {
  @IsString()
  @IsNotEmpty()
  workloadId: string;

  @IsString()
  @IsOptional()
  lensAlias?: string;

  @IsString()
  @IsOptional()
  lensAliasArn?: string;
}

export class CreateMilestoneDto {
  @IsString()
  @IsNotEmpty()
  workloadId: string;

  @IsString()
  @IsNotEmpty()
  milestoneName: string;
}

export enum IaCTemplateType {
  CLOUDFORMATION_YAML = 'CloudFormation (.yaml) template',
  CLOUDFORMATION_JSON = 'CloudFormation (.json) template',
  TERRAFORM = 'Terraform (.tf) document'
}

export class MultipleFilesUploadDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsArray()
  files: Array<{
    filename: string;
    buffer: Buffer;
    mimetype: string;
  }>;

  @IsEnum(FileUploadMode)
  mode: FileUploadMode;
}