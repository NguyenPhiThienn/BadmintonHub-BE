import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CourtsController } from './courts.controller';
import { CourtsService } from './courts.service';
import { Court, CourtSchema } from './schemas/court.schema';
import { Venue, VenueSchema } from '../venues/schemas/venue.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Court.name, schema: CourtSchema },
      { name: Venue.name, schema: VenueSchema },
    ]),
  ],
  controllers: [CourtsController],
  providers: [CourtsService],
  exports: [CourtsService, MongooseModule],
})
export class CourtsModule {}
