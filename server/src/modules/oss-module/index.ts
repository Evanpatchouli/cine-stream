import { Module } from '@nestjs/common';
import { AliOssSdk } from './ali-oss.sdk';

@Module({
  providers: [AliOssSdk],
  exports: [AliOssSdk],
})
export class OssModule {}
