import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

export interface SignedUploadUrl {
  url: string;
  path: string;
  token?: string;
}

@Injectable()
export class SupabaseStorageService {
  private readonly client: ReturnType<typeof createClient>;
  private readonly bucket: string;
  private readonly uploadsPrefix: string;
  private readonly logger = new Logger(SupabaseStorageService.name);

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.getOrThrow<string>('supabase.url');
    const serviceRoleKey = this.configService.getOrThrow<string>(
      'supabase.serviceRoleKey',
    );
    this.bucket = this.configService.getOrThrow<string>(
      'supabase.storageBucket',
    );
    const rawPrefix = this.configService.get<string>(
      'supabase.storageUploadsPath',
    );

    this.uploadsPrefix = normalizePrefix(rawPrefix ?? 'uploads/');

    this.client = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  async createSignedUploadUrl(
    originalFilename: string,
    options?: { upsert?: boolean },
  ): Promise<SignedUploadUrl> {
    const objectPath = this.buildObjectPath(originalFilename);

    this.logger.log(`Creating signed upload URL for path: ${objectPath}`);
    this.logger.log(`Options: ${JSON.stringify(options)}`);
    this.logger.log(`Bucket: ${this.bucket}`);

    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUploadUrl(objectPath, {
        upsert: options?.upsert ?? false,
      });

    this.logger.log(
      `Supabase response - Error: ${error ? JSON.stringify(error) : 'NONE'}`,
    );
    this.logger.log(
      `Supabase response - Data: ${
        data
          ? JSON.stringify({
              hasSignedUrl: !!data.signedUrl,
              signedUrlLength: data.signedUrl?.length,
              token: (data as { token?: string }).token ? 'PRESENT' : 'NONE',
              path: objectPath,
            })
          : 'NONE'
      }`,
    );

    if (error || !data?.signedUrl) {
      this.logger.error(
        `Failed to create signed upload URL for ${objectPath}: ${error?.message}`,
      );
      throw new InternalServerErrorException('Unable to create upload URL');
    }

    return {
      url: data.signedUrl,
      path: objectPath,
      token: (data as { token?: string }).token,
    };
  }

  async createSignedDownloadUrl(path: string, expiresIn = 60): Promise<string> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUrl(path, expiresIn);

    if (error || !data?.signedUrl) {
      this.logger.error(
        `Failed to create signed download URL for ${path}: ${error?.message}`,
      );
      throw new InternalServerErrorException('Unable to create download URL');
    }

    return data.signedUrl;
  }

  getPublicUrl(path: string): string {
    const { data } = this.client.storage.from(this.bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async remove(path: string): Promise<void> {
    const { error } = await this.client.storage
      .from(this.bucket)
      .remove([path]);

    if (error) {
      this.logger.error(`Failed to remove object ${path}: ${error.message}`);
      throw new InternalServerErrorException('Unable to remove storage object');
    }
  }

  private buildObjectPath(filename: string): string {
    const safeName = sanitizeFilename(filename);
    const unique = randomUUID();
    if (!this.uploadsPrefix) {
      return `${unique}-${safeName}`;
    }
    return `${this.uploadsPrefix}/${unique}-${safeName}`;
  }
}

const sanitizeFilename = (filename: string): string => {
  if (!filename) {
    return 'file';
  }
  const normalized = filename.replace(/\\/g, '/');
  const base = normalized.split('/').pop() ?? 'file';
  return base.replace(/[^a-zA-Z0-9._-]/g, '_');
};

const normalizePrefix = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  return trimmed.replace(/^\/+/, '').replace(/\/+$/, '');
};
