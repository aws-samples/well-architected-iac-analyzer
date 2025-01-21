import { IsString, IsArray, IsOptional } from 'class-validator';
import { IaCTemplateType } from '../../../shared/dto/analysis.dto';

export class IaCGenerationRequestDto {
  @IsString()
  fileId: string;

  @IsString()
  fileName: string;

  @IsString()
  fileType: string;

  @IsArray()
  recommendations: any[];

  @IsOptional()
  @IsString()
  templateType?: IaCTemplateType;
}