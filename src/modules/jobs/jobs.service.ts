import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as SYS_MSG from '@shared/constants/SystemMessages';
import { FindJobResponseDto } from './dto/find-job-response.dto';
import { JobApplicationResponseDto } from './dto/job-application-response.dto';
import { JobApplicationDto } from './dto/job-application.dto';
import { JobDto } from './dto/job.dto';
import { JobApplication } from './entities/job-application.entity';
import { Job } from './entities/job.entity';
import { isPassed } from './utils/helpers';
import { JobSearchDto } from './dto/jobSearch.dto';
import { User } from '@modules/user/entities/user.entity';
import { CustomHttpException } from '@shared/helpers/custom-http-filter';
import { pick } from '@shared/helpers/pick';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(JobApplication)
    private readonly jobApplicationRepository: Repository<JobApplication>
  ) {}

  async applyForJob(jobId: string, jobApplicationDto: JobApplicationDto): Promise<JobApplicationResponseDto> {
    const job: FindJobResponseDto = await this.getJob(jobId);

    const { is_deleted, deadline } = job.data;

    if (is_deleted) {
      throw new CustomHttpException('Job deleted', HttpStatus.NOT_FOUND);
    }

    if (isPassed(deadline)) {
      throw new CustomHttpException(SYS_MSG.DEADLINE_PASSED, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const { resume, applicant_name, ...others } = jobApplicationDto;

    // TODO: Upload resume to the cloud and grab URL

    const resumeUrl = `https://example.com/${applicant_name.split(' ').join('_')}.pdf`;

    const createJobApplication = this.jobApplicationRepository.create({
      ...others,
      applicant_name,
      resume: resumeUrl,
      ...job,
    });

    await this.jobApplicationRepository.save(createJobApplication);

    return {
      status: 'success',
      message: 'Application submitted successfully',
      status_code: HttpStatus.CREATED,
    };
  }

  async create(createJobDto: JobDto, userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) throw new CustomHttpException(SYS_MSG.USER_NOT_FOUND, HttpStatus.NOT_FOUND);

    const newJob = this.jobRepository.create(Object.assign(new Job(), { ...createJobDto, user }));

    await this.jobRepository.save(newJob);
    return {
      status: 'success',
      status_code: 201,
      message: SYS_MSG.JOB_CREATION_SUCCESSFUL,
      data: pick(
        newJob,
        Object.keys(newJob).filter(x => !['user', 'created_at', 'updated_at', 'is_deleted'].includes(x))
      ),
    };
  }

  async getJobs() {
    const jobs = await this.jobRepository.find({ where: { is_deleted: false } });

    jobs.map(x => delete x.is_deleted);
    return {
      message: SYS_MSG.JOB_LISTING_RETRIEVAL_SUCCESSFUL,
      status_code: 200,
      data: jobs,
    };
  }

  async getJob(id: string) {
    const job = await this.jobRepository.findOne({ where: { id, is_deleted: false } });

    if (!job) throw new CustomHttpException(SYS_MSG.JOB_NOT_FOUND, HttpStatus.NOT_FOUND);

    delete job.is_deleted;
    return {
      message: 'Job fetched successfully',
      status_code: 200,
      data: job,
    };
  }
  async delete(jobId: string) {
    const job = await this.jobRepository.findOne({
      where: { id: jobId },
    });

    job.is_deleted = true;
    const deleteJobEntityInstance = this.jobRepository.create(job);

    await this.jobRepository.save(deleteJobEntityInstance);

    return {
      status: 'success',
      message: SYS_MSG.JOB_DELETION_SUCCESSFUL,
      status_code: 200,
    };
  }

  async searchJobs(searchDto: JobSearchDto, page: number, limit: number) {
    const query = this.jobRepository.createQueryBuilder('job');
    query.where('job.is_deleted = :isDeleted', { isDeleted: false });

    if (searchDto.location) {
      query.andWhere('job.location ILIKE :location', { location: `%${searchDto.location}%` });
    }

    if (searchDto.salary_range) {
      query.andWhere('job.salary_range = :salaryRange', { salaryRange: searchDto.salary_range });
    }

    if (searchDto.job_type) {
      query.andWhere('job.job_type = :jobType', { jobType: searchDto.job_type });
    }

    if (searchDto.job_mode) {
      query.andWhere('job.job_mode = :jobMode', { jobMode: searchDto.job_mode });
    }
    page = Math.max(1, Math.floor(Number(page)));
    limit = Math.max(1, Math.floor(Number(limit)));

    query.skip((page - 1) * limit).take(limit);
    const jobs = await query.getMany();

    return {
      status_code: HttpStatus.OK,
      data: jobs,
    };
  }
}
