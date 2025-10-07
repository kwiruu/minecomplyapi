import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { SupabaseAuthUser } from '../auth/interfaces/supabase-user.interface';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { CreateComplianceRecordDto } from './dto/create-compliance-record.dto';

const uuidPipe = new ParseUUIDPipe({ version: '4' });

@Controller('compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get('me')
  getCurrentUser(@CurrentUser() user: SupabaseAuthUser) {
    return this.complianceService.getCurrentUserContext(user);
  }

  @Get('projects')
  listProjects(@CurrentUser() user: SupabaseAuthUser) {
    return this.complianceService.listProjects(user);
  }

  @Get('projects/:projectId/conditions')
  getProjectConditions(
    @Param('projectId', uuidPipe) projectId: string,
    @CurrentUser() user: SupabaseAuthUser,
  ) {
    return this.complianceService.getProjectConditions(projectId, user);
  }

  @Get('projects/:projectId/submissions')
  listProjectSubmissions(
    @Param('projectId', uuidPipe) projectId: string,
    @CurrentUser() user: SupabaseAuthUser,
  ) {
    return this.complianceService.listProjectSubmissions(projectId, user);
  }

  @Post('projects/:projectId/submissions')
  createSubmission(
    @Param('projectId', uuidPipe) projectId: string,
    @Body() dto: CreateSubmissionDto,
    @CurrentUser() user: SupabaseAuthUser,
  ) {
    return this.complianceService.createSubmission(projectId, dto, user);
  }

  @Get('submissions/:submissionId')
  getSubmission(
    @Param('submissionId', uuidPipe) submissionId: string,
    @CurrentUser() user: SupabaseAuthUser,
  ) {
    return this.complianceService.getSubmission(submissionId, user);
  }

  @Get('submissions/:submissionId/records')
  listSubmissionRecords(
    @Param('submissionId', uuidPipe) submissionId: string,
    @CurrentUser() user: SupabaseAuthUser,
  ) {
    return this.complianceService.listSubmissionRecords(submissionId, user);
  }

  @Post('submissions/:submissionId/records')
  addComplianceRecord(
    @Param('submissionId', uuidPipe) submissionId: string,
    @Body() dto: CreateComplianceRecordDto,
    @CurrentUser() user: SupabaseAuthUser,
  ) {
    return this.complianceService.addComplianceRecord(submissionId, dto, user);
  }
}
