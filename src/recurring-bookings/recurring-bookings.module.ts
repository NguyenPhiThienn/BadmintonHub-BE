import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecurringBookingsController } from './recurring-bookings.controller';
import { RecurringBookingsService } from './recurring-bookings.service';
import { RecurringBooking, RecurringBookingSchema } from './schemas/recurring-booking.schema';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { BookingDetail, BookingDetailSchema } from '../bookings/schemas/booking-detail.schema';
import { Payment, PaymentSchema } from '../payments/schemas/payment.schema';
import { Court, CourtSchema } from '../courts/schemas/court.schema';
import { Venue, VenueSchema } from '../venues/schemas/venue.schema';
import { Pricing, PricingSchema } from '../pricings/schemas/pricing.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Coupon, CouponSchema } from '../coupons/schemas/coupon.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RecurringBooking.name, schema: RecurringBookingSchema },
      { name: Booking.name, schema: BookingSchema },
      { name: BookingDetail.name, schema: BookingDetailSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Court.name, schema: CourtSchema },
      { name: Venue.name, schema: VenueSchema },
      { name: Pricing.name, schema: PricingSchema },
      { name: User.name, schema: UserSchema },
      { name: Coupon.name, schema: CouponSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [RecurringBookingsController],
  providers: [RecurringBookingsService],
  exports: [RecurringBookingsService],
})
export class RecurringBookingsModule {}
