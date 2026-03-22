import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VenuesController } from './venues.controller';
import { VenuesService } from './venues.service';
import { Venue, VenueSchema } from './schemas/venue.schema';
import { VenueImage, VenueImageSchema } from './schemas/venue-image.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Venue.name, schema: VenueSchema },
      { name: VenueImage.name, schema: VenueImageSchema },
    ]),
  ],
  controllers: [VenuesController],
  providers: [VenuesService],
  exports: [VenuesService, MongooseModule],
})
export class VenuesModule {}
