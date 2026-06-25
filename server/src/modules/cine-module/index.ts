import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Cine,
  CineSchema,
  EpisodeVideo,
  EpisodeVideoSchema,
} from './cine.schema';
import { CineController } from './cine.controller';
import { MediaHlsController } from './media-hls.controller';
import { MediaController } from './media.controller';
import { EpisodeHlsJobService } from './episode-hls.job.service';
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
  controllers: [CineController, MediaController, MediaHlsController],
  providers: [CineService, EpisodeHlsJobService],
  exports: [CineService, EpisodeHlsJobService],
})
export class CineModule {}
