import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Cine,
  CineSchema,
  EpisodeVideo,
  EpisodeVideoSchema,
} from '../cine-module/cine.schema';
import { WatchController } from './watch.controller';
import { WatchService } from './watch.service';
import {
  CineCollection,
  CineCollectionSchema,
  WatchHistory,
  WatchHistorySchema,
} from './watch.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WatchHistory.name, schema: WatchHistorySchema },
      { name: CineCollection.name, schema: CineCollectionSchema },
      { name: Cine.name, schema: CineSchema },
      { name: EpisodeVideo.name, schema: EpisodeVideoSchema },
    ]),
  ],
  controllers: [WatchController],
  providers: [WatchService],
})
export class WatchModule {}
