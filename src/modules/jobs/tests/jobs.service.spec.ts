import { HttpStatus, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomHttpException } from '@shared/helpers/custom-http-filter';
import UserResponseDTO from '../../user/dto/user-response.dto';
import { User } from '../../user/entities/user.entity';
import { JobApplicationDto } from '../dto/job-application.dto';
import { JobDto, SalaryRange, JobType, JobMode } from '../dto/job.dto';
import { JobApplication } from '../entities/job-application.entity';
import { Job } from '../entities/job.entity';
import { JobsService } from '../jobs.service';
import { jobsMock } from './mocks/jobs.mock';
import { JobSearchDto } from '../dto/jobSearch.dto';

describe('JobsService', () => {
  let service: JobsService;
  let jobRepository: Repository<Job>;
  let userRepository: Repository<User>;
  let userDto: UserResponseDTO;
  let createJobDto: JobDto;

  const mockJob = {
    data: {
      is_deleted: false,
      deadline: new Date(new Date().getTime() + 1000 * 60 * 60 * 24).toISOString(),
    },
  };

  const mockJobApplicationDto: JobApplicationDto = {
    applicant_name: 'John Doe',
    email: 'johndoe@example.com',
    resume: 'resume content',
    cover_letter: 'Cover letter text',
  };

  const mockJobApplicationResponse = {
    status: 'success',
    message: 'Application submitted successfully',
    status_code: HttpStatus.CREATED,
  };

  beforeEach(async () => {
    userDto = {
      id: 'user_id',
      email: 'test@example.com',
    };

    createJobDto = {
      title: 'Software Engineer II',
      description:
        'We are looking for a skilled Software Engineer to join our team. The ideal candidate will have experience in building high-performance applications.',
      location: 'New York, NY',
      deadline: '2024-12-31T23:59:59Z',
      salary_range: '70k_to_100k',
      job_type: 'full-time',
      job_mode: 'remote',
      company_name: 'Tech Innovators Inc.',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: getRepositoryToken(Job),
          useValue: {
            find: jest.fn(),
            findBy: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            findOneBy: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getCount: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockReturnThis(),
            }),
          },
        },
        {
          provide: getRepositoryToken(JobApplication),
          useValue: {
            findBy: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            findOneBy: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findBy: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            findOneBy: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
    userRepository = module.get(getRepositoryToken(User));
    jobRepository = module.get(getRepositoryToken(Job));

    jest.spyOn(userRepository, 'findOne').mockResolvedValue(userDto as User);
    jest.spyOn(jobRepository, 'create').mockReturnValue({ ...createJobDto, user: userDto } as Job);
    jest
      .spyOn(jobRepository, 'findOne')
      .mockResolvedValue({ ...createJobDto, is_deleted: false, user: userDto } as Job);
    jest.spyOn(jobRepository, 'save').mockResolvedValue({ ...createJobDto } as Job);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createNewJob', () => {
    it('should create a new job successfully', async () => {
      const result = await service.create(createJobDto, userDto.id);
      expect(result.status).toEqual('success');
      expect(result.message).toEqual('Job listing created successfully');
      expect(result.data).toEqual(createJobDto);
    });

    it('should throw CustomHttpException if user is not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.create({} as JobDto, 'nonexistent')).rejects.toThrow(CustomHttpException);
    });
  });

  describe('lists all jobs', () => {
    it('should returns all jobs', async () => {
      jest.spyOn(jobRepository, 'find').mockResolvedValue(jobsMock);
      const jobs = await service.getJobs();
      expect(jobs.message).toEqual('Jobs listing fetched successfully');
      expect(jobs.status_code).toEqual(200);
    });
  });

  describe('deleteJob', () => {
    it('should delete the job successfully', async () => {
      const result = await service.delete('job-1');
      expect(result.status).toEqual('success');
      expect(result.message).toEqual('Job details deleted successfully');
    });
  });

  describe('applyForJob', () => {
    it('should throw error if job is deleted', async () => {
      jest.spyOn(service, 'getJob').mockResolvedValue({
        data: { is_deleted: true, deadline: new Date().toISOString() },
      } as any);

      await expect(service.applyForJob('jobId', mockJobApplicationDto)).rejects.toThrow(
        new CustomHttpException('Job deleted', HttpStatus.NOT_FOUND)
      );
    });

    it('should throw error if application deadline has passed', async () => {
      jest.spyOn(service, 'getJob').mockResolvedValue({
        data: { is_deleted: false, deadline: new Date(new Date().getTime() - 1000 * 60 * 60 * 24).toISOString() },
      } as any);

      await expect(service.applyForJob('jobId', mockJobApplicationDto)).rejects.toThrow(
        new CustomHttpException('Job application deadline passed', HttpStatus.UNPROCESSABLE_ENTITY)
      );
    });

    it('should successfully create a job application', async () => {
      jest.spyOn(service, 'getJob').mockResolvedValue(mockJob as any);
      const createMock = jest.fn().mockReturnValue(mockJobApplicationDto);
      const saveMock = jest.fn().mockResolvedValue(mockJobApplicationResponse);

      jest.spyOn(service['jobApplicationRepository'], 'create').mockImplementation(createMock);
      jest.spyOn(service['jobApplicationRepository'], 'save').mockImplementation(saveMock);

      const result = await service.applyForJob('jobId', mockJobApplicationDto);

      expect(result).toEqual(mockJobApplicationResponse);
      expect(createMock).toHaveBeenCalledWith({
        ...mockJobApplicationDto,
        applicant_name: 'John Doe',
        resume: `https://example.com/John_Doe.pdf`,
        ...mockJob,
      });
      expect(saveMock).toHaveBeenCalled();
    });
  });

  describe('searchJobs', () => {
    it('should return jobs based on search criteria', async () => {
      const searchDto: JobSearchDto = {
        location: 'Boston',
        salary_range: '70k_to_100k' as SalaryRange,
        job_type: 'full-time' as JobType,
        job_mode: 'remote' as JobMode,
        page: 1,
        limit: 10,
      };

      jest.spyOn(jobRepository, 'createQueryBuilder').mockImplementation(() => {
        return {
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getCount: jest.fn().mockResolvedValue(1),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([mockJob]),
        } as any;
      });

      const result = await service.searchJobs(searchDto, searchDto.page, searchDto.limit);
      expect(result.status_code).toBe(200);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(mockJob);
    });

    it('should return empty array if no jobs match the criteria', async () => {
      const searchDto: JobSearchDto = {
        location: 'Nowhere',
        salary_range: '100k_to_150k' as SalaryRange,
        job_type: 'part-time' as JobType,
        job_mode: 'onsite' as JobMode,
        page: 1,
        limit: 10,
      };

      jest.spyOn(jobRepository, 'createQueryBuilder').mockImplementation(() => {
        return {
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getCount: jest.fn().mockResolvedValue(0),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([]),
        } as any;
      });

      const result = await service.searchJobs(searchDto, searchDto.page, searchDto.limit);
      expect(result.status_code).toBe(200);
      expect(result.data).toHaveLength(0);
    });

    it('should handle pagination correctly', async () => {
      const searchDto: JobSearchDto = {};
      const page = 2;
      const limit = 5;

      jest.spyOn(jobRepository, 'createQueryBuilder').mockImplementation(() => {
        return {
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getCount: jest.fn().mockResolvedValue(12),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([mockJob, mockJob]),
        } as any;
      });

      const result = await service.searchJobs(searchDto, page, limit);
      expect(result.status_code).toBe(200);
      expect(result.data).toHaveLength(2);
    });
  });
});
