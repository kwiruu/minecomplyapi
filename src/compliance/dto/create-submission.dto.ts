import { IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSubmissionDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  summary?: string;

  @IsOptional()
  @IsISO8601()
  reportingFrom?: string;

  @IsOptional()
  @IsISO8601()
  reportingTo?: string;
}
