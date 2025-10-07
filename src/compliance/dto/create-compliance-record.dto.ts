import { ComplianceCategory } from '@prisma/client';
import {
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateComplianceRecordDto {
  @IsEnum(ComplianceCategory)
  category!: ComplianceCategory;

  @IsString()
  @MaxLength(200)
  parameter!: string;

  @IsOptional()
  @IsUUID()
  conditionId?: string;

  @IsOptional()
  @IsNumber({ allowNaN: false, maxDecimalPlaces: 4 })
  measuredValue?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  unit?: string;

  @IsOptional()
  @IsNumber({ allowNaN: false, maxDecimalPlaces: 4 })
  baselineValue?: number;

  @IsOptional()
  @IsNumber({ allowNaN: false, maxDecimalPlaces: 4 })
  limitValue?: number;

  @IsOptional()
  @IsISO8601()
  recordedAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  locationDescription?: string;

  @IsOptional()
  @IsNumber({ allowNaN: false, maxDecimalPlaces: 7 })
  latitude?: number;

  @IsOptional()
  @IsNumber({ allowNaN: false, maxDecimalPlaces: 7 })
  longitude?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
