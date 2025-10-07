import { Body, Controller, Post, UseGuards, Req, Logger } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { SupabaseStorageService } from './supabase-storage.service';
import { CreateSignedUploadUrlDto } from './dto/create-upload-url.dto';
import { CreateSignedDownloadUrlDto } from './dto/create-download-url.dto';

@Controller('storage')
@UseGuards(SupabaseAuthGuard)
export class StorageController {
  private readonly logger = new Logger(StorageController.name);

  constructor(private readonly storageService: SupabaseStorageService) {}

  @Post('upload-url')
  async createSignedUploadUrl(
    @Body() dto: CreateSignedUploadUrlDto,
    @Req() req: any,
  ) {
    this.logger.log(`Creating signed upload URL for: ${dto.filename}`);
    this.logger.log(
      `Request headers: ${JSON.stringify({
        authorization: req.headers.authorization ? 'PRESENT' : 'MISSING',
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent'],
      })}`,
    );
    this.logger.log(`User from request: ${JSON.stringify(req.user)}`);
    this.logger.log(`DTO: ${JSON.stringify(dto)}`);

    try {
      const result = await this.storageService.createSignedUploadUrl(
        dto.filename,
        {
          upsert: dto.upsert,
        },
      );
      this.logger.log(
        `Successfully created signed URL: ${JSON.stringify({
          path: result.path,
          hasUrl: !!result.url,
          hasToken: !!result.token,
        })}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to create signed upload URL: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Post('download-url')
  async createSignedDownloadUrl(@Body() dto: CreateSignedDownloadUrlDto) {
    const url = await this.storageService.createSignedDownloadUrl(
      dto.path,
      dto.expiresIn ?? 60,
    );
    return { url };
  }

  @Post('test-auth')
  async testAuthentication(@Req() req: any) {
    this.logger.log('Testing storage authentication...');
    return {
      message: 'Storage authentication successful',
      user: req.user,
      timestamp: new Date().toISOString(),
    };
  }
}
