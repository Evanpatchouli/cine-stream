import { logger } from '@/common/logger';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MessageService {
  constructor() {}

  async sendMessage(message: string): Promise<string> {
    // TODO: Implement message sending logic
    return Promise.resolve(message);
  }

  async sendPhoneLoginOPT(phone: string, otp: string): Promise<string> {
    // TODO: Implement phone login OTP sending logic
    logger.info(`Sending phone login OTP to ${phone}: ${otp}`);
    return Promise.resolve(phone + otp);
  }
}
