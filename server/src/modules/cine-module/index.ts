import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Cine,
  CineSchema,
  EpisodeVideo,
  EpisodeVideoSchema,
} from './cine.schema';
import { CineController } from './cine.controller';
import { MediaController } from './media.controller';
import { CineService } from './cine.service';
import { OssModule } from '../oss-module';

@Module({
  imports: [
    OssModule,
    MongooseModule.forFeature([
      { name: Cine.name, schema: CineSchema },
      { name: EpisodeVideo.name, schema: EpisodeVideoSchema },
    ]),
  ],
  controllers: [CineController, MediaController],
  providers: [CineService],
  exports: [CineService],
})
export class CineModule {}
