import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Cine,
  CineSchema,
  EpisodeVideo,
  EpisodeVideoSchema,
} from './cine.schema';
import { CineController } from './cine.controller';
import { CineService } from './cine.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cine.name, schema: CineSchema },
      { name: EpisodeVideo.name, schema: EpisodeVideoSchema },
    ]),
  ],
  controllers: [CineController],
  providers: [CineService],
  exports: [CineService],
})
export class CineModule {}
