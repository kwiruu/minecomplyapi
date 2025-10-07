import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { SupabaseAuthUser } from '../auth/interfaces/supabase-user.interface';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { CreateComplianceRecordDto } from './dto/create-compliance-record.dto';

type ProjectWithOrganization = NonNullable<
  Awaited<ReturnType<PrismaService['project']['findUnique']>>
>;

type SubmissionWithProject = NonNullable<
  Awaited<ReturnType<PrismaService['submission']['findUnique']>>
>;

type ResolvedUser = Awaited<ReturnType<UsersService['ensureUser']>>;

@Injectable()
export class ComplianceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async getCurrentUserContext(authUser: SupabaseAuthUser) {
    const user: ResolvedUser = await this.usersService.ensureUser(authUser);

    const [organizations, assignments, projects] = await Promise.all([
      this.prisma.organization.findMany({
        where: { members: { some: { userId: user.id } } },
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.projectAssignment.findMany({
        where: { userId: user.id },
        include: {
          project: {
            include: {
              organization: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.listProjectsForUserId(user.id),
    ]);

    return {
      user,
      organizations,
      assignments,
      projects,
    };
  }

  async listProjects(authUser: SupabaseAuthUser) {
    const user: ResolvedUser = await this.usersService.ensureUser(authUser);
    const projects = await this.prisma.project.findMany({
      where: this.buildProjectAccessFilter(user.id),
      include: {
        organization: true,
        _count: {
          select: {
            submissions: true,
            conditions: true,
          },
        },
      },
      orderBy: [{ name: 'asc' }, { createdAt: 'asc' }],
    });

    return { projects };
  }

  async getProjectConditions(projectId: string, authUser: SupabaseAuthUser) {
    const user: ResolvedUser = await this.usersService.ensureUser(authUser);
    const project = await this.assertProjectAccess(user.id, projectId);

    const conditions = await this.prisma.complianceCondition.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: 'asc' },
    });

    return { project, conditions };
  }

  async listProjectSubmissions(projectId: string, authUser: SupabaseAuthUser) {
    const user: ResolvedUser = await this.usersService.ensureUser(authUser);
    const project = await this.assertProjectAccess(user.id, projectId);

    const submissions = await this.prisma.submission.findMany({
      where: { projectId: project.id },
      include: {
        submittedBy: true,
        _count: {
          select: {
            complianceData: true,
            evidences: true,
            validationSessions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { project, submissions };
  }

  async createSubmission(
    projectId: string,
    dto: CreateSubmissionDto,
    authUser: SupabaseAuthUser,
  ) {
    const user: ResolvedUser = await this.usersService.ensureUser(authUser);
    await this.assertProjectAccess(user.id, projectId);

    const reportingFrom = toDateOrNull(dto.reportingFrom, 'reportingFrom');
    const reportingTo = toDateOrNull(dto.reportingTo, 'reportingTo');

    const submission = await this.prisma.submission.create({
      data: {
        projectId,
        submittedById: user.id,
        status: 'DRAFT',
        title: dto.title,
        summary: dto.summary ?? null,
        reportingFrom,
        reportingTo,
      },
      include: {
        project: {
          include: {
            organization: true,
          },
        },
      },
    });

    return submission;
  }

  async getSubmission(submissionId: string, authUser: SupabaseAuthUser) {
    const user = await this.usersService.ensureUser(authUser);
    await this.assertSubmissionAccess(user.id, submissionId);

    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        project: {
          include: {
            organization: true,
          },
        },
        submittedBy: true,
        complianceData: {
          include: {
            condition: true,
            evidences: true,
            validationEntries: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        evidences: true,
        validationSessions: {
          include: {
            reviewer: true,
            entries: {
              include: {
                complianceRecord: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        reports: true,
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    return submission;
  }

  async listSubmissionRecords(
    submissionId: string,
    authUser: SupabaseAuthUser,
  ) {
    const user = await this.usersService.ensureUser(authUser);
    const submission = await this.assertSubmissionAccess(user.id, submissionId);

    const records = await this.prisma.complianceRecord.findMany({
      where: { submissionId: submission.id },
      include: {
        condition: true,
        evidences: true,
        validationEntries: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { submission, records };
  }

  async addComplianceRecord(
    submissionId: string,
    dto: CreateComplianceRecordDto,
    authUser: SupabaseAuthUser,
  ) {
    const user = await this.usersService.ensureUser(authUser);
    const submission = await this.assertSubmissionAccess(user.id, submissionId);

    if (dto.conditionId) {
      const condition = await this.prisma.complianceCondition.findUnique({
        where: { id: dto.conditionId },
      });

      if (!condition || condition.projectId !== submission.projectId) {
        throw new BadRequestException(
          'The provided conditionId does not belong to this project',
        );
      }
    }

    const recordedAt = toDateOrNull(dto.recordedAt, 'recordedAt');

    const record = await this.prisma.complianceRecord.create({
      data: {
        submissionId: submission.id,
        conditionId: dto.conditionId ?? null,
        category: dto.category,
        parameter: dto.parameter,
        measuredValue: dto.measuredValue ?? null,
        unit: dto.unit ?? null,
        baselineValue: dto.baselineValue ?? null,
        limitValue: dto.limitValue ?? null,
        recordedAt,
        locationDescription: dto.locationDescription ?? null,
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        notes: dto.notes ?? null,
      },
      include: {
        condition: true,
      },
    });

    return record;
  }

  private async listProjectsForUserId(userId: string) {
    return this.prisma.project.findMany({
      where: this.buildProjectAccessFilter(userId),
      include: {
        organization: true,
        assignments: {
          where: { userId },
          include: { user: true },
        },
        _count: {
          select: {
            submissions: true,
            conditions: true,
          },
        },
      },
      orderBy: [{ name: 'asc' }, { createdAt: 'asc' }],
    });
  }

  private buildProjectAccessFilter(userId: string) {
    return {
      OR: [
        { assignments: { some: { userId } } },
        { organization: { members: { some: { userId } } } },
      ],
    };
  }

  private async assertProjectAccess(
    userId: string,
    projectId: string,
  ): Promise<ProjectWithOrganization> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        organization: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const accessibleCount = await this.prisma.project.count({
      where: {
        id: projectId,
        ...this.buildProjectAccessFilter(userId),
      },
    });

    if (accessibleCount === 0) {
      throw new ForbiddenException('You do not have access to this project');
    }

    return project;
  }

  private async assertSubmissionAccess(
    userId: string,
    submissionId: string,
  ): Promise<SubmissionWithProject> {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        project: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    const accessibleCount = await this.prisma.project.count({
      where: {
        id: submission.projectId,
        ...this.buildProjectAccessFilter(userId),
      },
    });

    if (accessibleCount === 0) {
      throw new ForbiddenException('You do not have access to this submission');
    }

    return submission;
  }
}

const toDateOrNull = (
  value: string | undefined,
  label: string,
): Date | null => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(`${label} must be a valid ISO 8601 date`);
  }

  return parsed;
};
