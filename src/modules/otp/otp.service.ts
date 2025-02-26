import { HttpStatus, Injectable, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Otp } from './entities/otp.entity';
import { User } from '@modules/user/entities/user.entity';
import { generateSixDigitToken } from '@utils/generate-token';
import { CustomHttpException } from '@shared/helpers/custom-http-filter';

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(Otp)
    private otpRepository: Repository<Otp>,
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  async createOtp(userId: string): Promise<Otp | null> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const token = generateSixDigitToken();
      const expiry = new Date(Date.now() + 5 * 60 * 1000);

      const otp = this.otpRepository.create({ token, expiry, user, user_id: userId });
      await this.otpRepository.save(otp);

      return otp;
    } catch (error) {
      console.log('OtpServiceError ~ createOtpError ~', error);
      return null;
    }
  }

  async verifyOtp(userId: string, token: string): Promise<boolean> {
    try {
      const otp = await this.otpRepository.findOne({ where: { token, user_id: userId } });

      if (!otp) {
        throw new NotFoundException('Invalid OTP');
      }

      if (otp.expiry < new Date()) {
        throw new NotAcceptableException('OTP expired');
      }

      return true;
    } catch (error) {
      console.log('OtpServiceError ~ verifyOtpError ~', error);
      return false;
    }
  }

  async findOtp(userId: string): Promise<Otp | null> {
    const otp = await this.otpRepository.findOne({ where: { user_id: userId } });

    if (!otp) {
      throw new NotFoundException('OTP is invalid');
    }
    return otp;
  }

  async retrieveUserAndOtp(user_id: string, token: string): Promise<User | null> {
    const otp = await this.otpRepository.findOne({ where: { token, user_id }, relations: ['user'] });

    if (!otp) throw new CustomHttpException('OTP is invalid', HttpStatus.BAD_REQUEST);

    return otp.user;
  }

  async deleteOtp(userId: string) {
    return await this.otpRepository.delete({ user_id: userId });
  }
}
