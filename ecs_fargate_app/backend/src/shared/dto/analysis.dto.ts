import { IsString, IsArray, IsNotEmpty } from 'class-validator';

export class AnalyzeRequestDto {
  @IsString()
  @IsNotEmpty()
  workloadId: string;

  @IsArray()
  @IsString({ each: true })
  selectedPillars: string[];

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  fileType: string;

  templateType?: IaCTemplateType;
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