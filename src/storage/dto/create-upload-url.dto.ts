import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSignedUploadUrlDto {
  @IsString()
  @MaxLength(255)
  filename!: string;

  @IsOptional()
  @IsBoolean()
  upsert?: boolean;
}
