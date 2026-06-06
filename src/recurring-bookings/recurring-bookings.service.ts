import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RecurringBooking, RecurringBookingDocument, RecurringType, RecurringStatus, PaymentScheduleType } from './schemas/recurring-booking.schema';
import { Booking, BookingDocument, BookingStatus } from '../bookings/schemas/booking.schema';
import { BookingDetail, BookingDetailDocument } from '../bookings/schemas/booking-detail.schema';
import { Payment, PaymentDocument, PaymentStatus, PaymentMethod } from '../payments/schemas/payment.schema';
import { Court, CourtDocument } from '../courts/schemas/court.schema';
import { Venue, VenueDocument } from '../venues/schemas/venue.schema';
import { Pricing, PricingDocument } from '../pricings/schemas/pricing.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Coupon, CouponDocument, CouponStatus } from '../coupons/schemas/coupon.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';
import { ApiResponseType, createApiResponse } from '../utils/response.util';
import { CreateRecurringBookingDto, PreviewRecurringBookingDto } from './dto/recurring-booking.dto';

interface ScheduleItem {
  occurrence: number;
  date: string;
  dayOfWeek: string;
  dayOfWeekNum: number;
  startTime: string;
  endTime: string;
  price: number;
}

@Injectable()
export class RecurringBookingsService {
  constructor(
    @InjectModel(RecurringBooking.name) private recurringModel: Model<RecurringBookingDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(BookingDetail.name) private bookingDetailModel: Model<BookingDetailDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Court.name) private courtModel: Model<CourtDocument>,
    @InjectModel(Venue.name) private venueModel: Model<VenueDocument>,
    @InjectModel(Pricing.name) private pricingModel: Model<PricingDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Coupon.name) private couponModel: Model<CouponDocument>,
    private notificationsService: NotificationsService,
  ) {}

  async preview(playerId: string, dto: PreviewRecurringBookingDto): Promise<ApiResponseType> {
    const { venueId, courtId, type, occurrences, startDate, startTime, endTime } = dto;

    const venue = await this.venueModel.findById(venueId).exec();
    if (!venue) {
      throw new HttpException('Không tìm thấy cơ sở', HttpStatus.NOT_FOUND);
    }

    const court = await this.courtModel.findById(courtId).exec();
    if (!court) {
      throw new HttpException('Không tìm thấy sân', HttpStatus.NOT_FOUND);
    }

    const start = new Date(startDate);
    const schedule = this.generateSchedule(start, type, occurrences, startTime, endTime);
    
    // Calculate prices for each slot
    let totalPrice = 0;
    for (const slot of schedule) {
      slot.price = await this.calculateSlotPrice(venueId, slot.date, startTime, endTime);
      totalPrice += slot.price;
    }
    
    return createApiResponse({
      schedule: schedule.map(s => ({
        occurrence: s.occurrence,
        date: s.date,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        price: s.price,
      })),
      totalAmount: totalPrice,
      perOccurrenceAmount: Math.round(totalPrice / occurrences),
      totalOccurrences: occurrences,
    }, 'Preview thành công', HttpStatus.OK);
  }

  async create(playerId: string, dto: CreateRecurringBookingDto): Promise<ApiResponseType> {
    const { venueId, courtId, type, occurrences, startDate, startTime, endTime, paymentSchedule, couponCode, customerName, customerPhone, customerEmail } = dto;

    // Validate user not blocked
    const player = await this.userModel.findById(playerId).exec();
    if (player && player.status === 'BLOCKED') {
      throw new HttpException('Tài khoản của bạn đã bị khóa. Không thể đặt sân.', HttpStatus.FORBIDDEN);
    }

    const venue = await this.venueModel.findById(venueId).exec();
    if (!venue) {
      throw new HttpException('Không tìm thấy cơ sở', HttpStatus.NOT_FOUND);
    }

    const court = await this.courtModel.findById(courtId).exec();
    if (!court) {
      throw new HttpException('Không tìm thấy sân', HttpStatus.NOT_FOUND);
    }

    const start = new Date(startDate);
    const schedule = this.generateSchedule(start, type, occurrences, startTime, endTime);

    // Calculate prices for each slot
    for (const slot of schedule) {
      slot.price = await this.calculateSlotPrice(venueId, slot.date, startTime, endTime);
    }

    // Validate all slots are available
    for (const slot of schedule) {
      const isBooked = await this.checkSlotAvailability(courtId, slot.date, startTime, endTime);
      if (isBooked) {
        throw new HttpException(`Sân đã có người đặt vào ngày ${slot.dayOfWeek} ${slot.date}. Vui lòng chọn ngày hoặc sân khác.`, HttpStatus.CONFLICT);
      }
    }

    // Calculate total price
    const totalPrice = schedule.reduce((sum, s) => sum + s.price, 0);
    const perOccurrencePrice = Math.round(totalPrice / occurrences);

    // Apply coupon if provided
    let finalTotal = totalPrice;
    let coupon: any = null;
    if (couponCode) {
      const couponResult = await this.applyCoupon(venueId, couponCode, totalPrice);
      finalTotal = couponResult.finalAmount;
      coupon = couponResult.coupon;
    }

    // Validate payment schedule
    if (type !== RecurringType.MONTHLY && paymentSchedule === PaymentScheduleType.MONTHLY) {
      throw new HttpException('Thanh toán theo tháng chỉ áp dụng cho đặt theo tháng', HttpStatus.BAD_REQUEST);
    }

    // Create recurring booking record
    const lastScheduleItem = schedule[schedule.length - 1];
    const endDate = new Date(lastScheduleItem.date);

    const recurringBooking = await this.recurringModel.create({
      playerId: new Types.ObjectId(playerId),
      venueId: new Types.ObjectId(venueId),
      courtId: new Types.ObjectId(courtId),
      type,
      occurrences,
      startDate: start,
      endDate,
      startTime,
      endTime,
      paymentSchedule,
      totalAmount: finalTotal,
      totalPerOccurrence: Math.round(finalTotal / occurrences),
      couponId: coupon?._id,
      customerName,
      customerPhone,
      customerEmail,
      status: RecurringStatus.ACTIVE,
      metadata: {
        dayOfWeek: start.getDay(),
        note: `Đặt sân cố định ${type} - ${occurrences} lần`,
      },
    });

    // Create bookings for all occurrences
    const bookingIds: Types.ObjectId[] = [];
    for (const slot of schedule) {
      const booking = await this.createSingleBooking(
        recurringBooking._id.toString(),
        playerId,
        venueId,
        courtId,
        slot.date,
        startTime,
        endTime,
        slot.price,
        customerName,
        customerPhone,
        customerEmail,
        type === RecurringType.WEEKLY || type === RecurringType.BIWEEKLY,
      );
      bookingIds.push(booking._id as Types.ObjectId);
    }

    // Update recurring booking with booking IDs
    recurringBooking.bookingIds = bookingIds;
    await recurringBooking.save();

    // Update coupon usage count
    if (coupon) {
      coupon.usedCount += 1;
      await coupon.save();
    }

    // Create payment based on schedule
    if (paymentSchedule === PaymentScheduleType.FULL) {
      // Pay all at once
      const payment = await this.paymentModel.create({
        bookingId: bookingIds[0],
        amount: finalTotal,
        method: PaymentMethod.VNPAY,
        status: PaymentStatus.PENDING,
      });
      return createApiResponse({
        recurringBookingId: recurringBooking._id,
        schedule: schedule.map(s => ({
          occurrence: s.occurrence,
          date: s.date,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          price: s.price,
        })),
        totalAmount: finalTotal,
        perOccurrenceAmount: Math.round(finalTotal / occurrences),
        paymentSchedule,
        bookingIds: bookingIds.map(id => id.toString()),
        paymentId: payment._id,
        firstBookingId: bookingIds[0].toString(),
      }, 'Tạo đặt sân cố định thành công', HttpStatus.CREATED);
    } else {
      // Pay per month - create first payment immediately
      const payment = await this.paymentModel.create({
        bookingId: bookingIds[0],
        amount: perOccurrencePrice,
        method: PaymentMethod.VNPAY,
        status: PaymentStatus.PENDING,
      });
      return createApiResponse({
        recurringBookingId: recurringBooking._id,
        schedule: schedule.map(s => ({
          occurrence: s.occurrence,
          date: s.date,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          price: s.price,
        })),
        totalAmount: finalTotal,
        perOccurrenceAmount: perOccurrencePrice,
        paymentSchedule,
        bookingIds: bookingIds.map(id => id.toString()),
        paymentId: payment._id,
        firstBookingId: bookingIds[0].toString(),
      }, 'Tạo đặt sân cố định thành công', HttpStatus.CREATED);
    }
  }

  private generateSchedule(startDate: Date, type: RecurringType, occurrences: number, startTime: string, endTime: string): ScheduleItem[] {
    const schedule: ScheduleItem[] = [];
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    
    let currentDate = new Date(startDate);
    
    for (let i = 0; i < occurrences; i++) {
      const dayOfWeekNum = currentDate.getDay();
      schedule.push({
        occurrence: i + 1,
        date: currentDate.toISOString().split('T')[0],
        dayOfWeek: days[dayOfWeekNum],
        dayOfWeekNum,
        startTime,
        endTime,
        price: 0,
      });

      // Move to next occurrence
      if (type === RecurringType.WEEKLY) {
        currentDate.setDate(currentDate.getDate() + 7);
      } else if (type === RecurringType.BIWEEKLY) {
        currentDate.setDate(currentDate.getDate() + 14);
      } else if (type === RecurringType.MONTHLY) {
        // Handle month overflow (e.g., Jan 31 -> Feb 28)
        const nextMonth = new Date(currentDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        // If the day changed, it means we overflowed, so use last day of next month
        if (nextMonth.getDate() !== currentDate.getDate()) {
          nextMonth.setDate(0); // Go to last day of previous month
        }
        currentDate = nextMonth;
      }
    }

    return schedule;
  }

  private async calculateSlotPrice(venueId: string, dateStr: string, startTime: string, endTime: string): Promise<number> {
    const pricingDay = new Date(dateStr).getDay() === 0 ? 6 : new Date(dateStr).getDay() - 1;

    const pricing = await this.pricingModel.findOne({
      venueId: new Types.ObjectId(venueId),
      dayOfWeek: pricingDay,
      startTime: { $lte: startTime },
      endTime: { $gte: endTime }
    }).exec() || await this.pricingModel.findOne({
      venueId: new Types.ObjectId(venueId),
      dayOfWeek: null,
      startTime: { $lte: startTime },
      endTime: { $gte: endTime }
    }).exec();

    const startH = parseInt(startTime.split(':')[0]);
    const startM = parseInt(startTime.split(':')[1]);
    const endH = parseInt(endTime.split(':')[0]);
    const endM = parseInt(endTime.split(':')[1]);
    const durationHours = (endH + endM / 60) - (startH + startM / 60);

    const venue = await this.venueModel.findById(venueId).exec();
    const rate = pricing ? pricing.pricePerHour : (venue?.pricePerHour || 60000);
    return Math.round(durationHours * rate);
  }

  private async checkSlotAvailability(courtId: string, dateStr: string, startTime: string, endTime: string): Promise<boolean> {
    const checkDate = new Date(dateStr);
    checkDate.setUTCHours(0, 0, 0, 0);

    const existingBookings = await this.bookingDetailModel.find({
      courtId: new Types.ObjectId(courtId),
      bookingDate: checkDate,
    }).populate('bookingId').exec();

    return existingBookings.some((b: any) => {
      if (!b.bookingId || b.bookingId.status === BookingStatus.CANCELLED) return false;
      return startTime < b.endTime && endTime > b.startTime;
    });
  }

  private async createSingleBooking(
    recurringId: string,
    playerId: string,
    venueId: string,
    courtId: string,
    dateStr: string,
    startTime: string,
    endTime: string,
    price: number,
    customerName?: string,
    customerPhone?: string,
    customerEmail?: string,
    isWeekly: boolean = false,
  ): Promise<BookingDocument> {
    const booking = await this.bookingModel.create({
      playerId: new Types.ObjectId(playerId),
      venueId: new Types.ObjectId(venueId),
      totalPrice: price,
      finalPrice: price,
      status: BookingStatus.PENDING,
      isWeekly,
      customerName,
      customerPhone,
      customerEmail,
    });

    const checkDate = new Date(dateStr);
    checkDate.setUTCHours(0, 0, 0, 0);

    await this.bookingDetailModel.create({
      bookingId: booking._id,
      courtId: new Types.ObjectId(courtId),
      bookingDate: checkDate,
      startTime,
      endTime,
      price,
    });

    return booking;
  }

  private async applyCoupon(venueId: string, couponCode: string, totalAmount: number): Promise<{ finalAmount: number; coupon: any }> {
    const coupon = await this.couponModel.findOne({
      code: couponCode.toUpperCase(),
      status: CouponStatus.ACTIVE
    }).exec();

    if (!coupon) {
      throw new HttpException('Mã khuyến mãi không tồn tại hoặc không hợp lệ', HttpStatus.BAD_REQUEST);
    }

    const now = new Date();
    if (now < coupon.startDate || now > coupon.endDate) {
      throw new HttpException('Mã khuyến mãi không nằm trong thời gian hiệu lực', HttpStatus.BAD_REQUEST);
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      throw new HttpException('Mã khuyến mãi đã hết lượt sử dụng', HttpStatus.BAD_REQUEST);
    }

    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = (totalAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    if (discountAmount > totalAmount) {
      discountAmount = totalAmount;
    }

    const finalAmount = totalAmount - discountAmount;
    return { finalAmount, coupon };
  }

  async getMyRecurringBookings(playerId: string, page: number = 1, limit: number = 10): Promise<ApiResponseType> {
    const skip = (page - 1) * limit;

    const [recurringBookings, total] = await Promise.all([
      this.recurringModel.find({ playerId: new Types.ObjectId(playerId) })
        .populate('venueId', 'name address')
        .populate('courtId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.recurringModel.countDocuments({ playerId: new Types.ObjectId(playerId) }),
    ]);

    const result = await Promise.all(recurringBookings.map(async (rb: any) => {
      const bookings = await this.bookingModel.find({ _id: { $in: rb.bookingIds } })
        .populate('venueId', 'name')
        .exec();
      const payments = await this.paymentModel.find({ bookingId: { $in: rb.bookingIds } })
        .sort({ createdAt: -1 })
        .exec();
      return { ...rb.toObject(), bookings, payments };
    }));

    return createApiResponse({
      recurringBookings: result,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }, 'Lấy danh sách đặt sân cố định thành công', HttpStatus.OK);
  }

  async getOne(playerId: string, id: string): Promise<ApiResponseType> {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException('ID không hợp lệ', HttpStatus.BAD_REQUEST);
    }

    const recurringBooking = await this.recurringModel.findById(id)
      .populate('venueId', 'name address ownerId')
      .populate('courtId', 'name')
      .exec();

    if (!recurringBooking) {
      throw new HttpException('Không tìm thấy đặt sân cố định', HttpStatus.NOT_FOUND);
    }

    if (recurringBooking.playerId.toString() !== playerId) {
      throw new HttpException('Bạn không có quyền xem đơn này', HttpStatus.FORBIDDEN);
    }

    const bookings = await this.bookingModel.find({ _id: { $in: recurringBooking.bookingIds } })
      .populate('venueId', 'name')
      .exec();

    const payments = await this.paymentModel.find({ bookingId: { $in: recurringBooking.bookingIds } })
      .sort({ createdAt: -1 })
      .exec();

    return createApiResponse({
      ...recurringBooking.toObject(),
      bookings,
      payments,
    }, 'Lấy chi tiết đặt sân cố định thành công', HttpStatus.OK);
  }

  async cancel(playerId: string, id: string): Promise<ApiResponseType> {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException('ID không hợp lệ', HttpStatus.BAD_REQUEST);
    }

    const recurringBooking = await this.recurringModel.findById(id).exec();
    if (!recurringBooking) {
      throw new HttpException('Không tìm thấy đặt sân cố định', HttpStatus.NOT_FOUND);
    }

    if (recurringBooking.playerId.toString() !== playerId) {
      throw new HttpException('Bạn không có quyền hủy đơn này', HttpStatus.FORBIDDEN);
    }

    // Cancel all pending/future bookings
    for (const bookingId of recurringBooking.bookingIds) {
      const booking = await this.bookingModel.findById(bookingId).exec();
      if (booking && [BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.status)) {
        booking.status = BookingStatus.CANCELLED;
        booking.cancelReason = 'Hủy đặt sân cố định';
        booking.cancelledBy = 'CUSTOMER';
        await booking.save();
      }
    }

    // Update recurring booking status
    recurringBooking.status = RecurringStatus.CANCELLED;
    recurringBooking.isActive = false;
    await recurringBooking.save();

    // Handle refund for paid bookings
    if (recurringBooking.paymentSchedule === PaymentScheduleType.FULL) {
      const paidPayments = await this.paymentModel.find({
        bookingId: { $in: recurringBooking.bookingIds },
        status: PaymentStatus.SUCCESS,
      }).exec();

      for (const payment of paidPayments) {
        payment.status = PaymentStatus.REFUNDING;
        payment.refundInfo = { reason: 'Hủy đặt sân cố định' } as any;
        await payment.save();
      }
    }

    return createApiResponse(null, 'Hủy đặt sân cố định thành công', HttpStatus.OK);
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleMonthlyPayments() {
    console.log('[RecurringBookings] Checking monthly payment schedules...');
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const recurringBookings = await this.recurringModel.find({
      paymentSchedule: PaymentScheduleType.MONTHLY,
      status: RecurringStatus.ACTIVE,
    }).populate('venueId', 'name ownerId').exec();

    for (const rb of recurringBookings) {
      // Count successful payments
      const paidPayments = await this.paymentModel.find({
        bookingId: { $in: rb.bookingIds },
        status: PaymentStatus.SUCCESS,
      }).exec();
      
      const paidCount = paidPayments.length;
      
      // If all occurrences are paid, mark as completed
      if (paidCount >= rb.occurrences) {
        rb.status = RecurringStatus.COMPLETED;
        await rb.save();
        continue;
      }

      // Get unpaid bookings sorted by date
      const paidBookingIds = paidPayments.map(p => p.bookingId.toString());
      const unpaidBookings = await this.bookingModel.find({
        _id: { $in: rb.bookingIds, $nin: paidBookingIds },
        status: BookingStatus.PENDING,
      }).sort({ createdAt: 1 }).exec();

      if (unpaidBookings.length === 0) continue;

      // Get the next unpaid booking date
      const nextBookingDetail = await this.bookingDetailModel.findOne({ 
        bookingId: unpaidBookings[0]._id 
      }).exec();
      
      if (!nextBookingDetail) continue;

      const bookingDate = new Date(nextBookingDetail.bookingDate);
      bookingDate.setHours(0, 0, 0, 0);
      
      const daysUntilBooking = Math.ceil((bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const venueName = (rb.venueId as any)?.name || 'Cơ sở';

      // Send reminder if within 7 days
      if (daysUntilBooking <= 7 && daysUntilBooking > 0) {
        this.notificationsService.sendAndSaveNotification(
          rb.playerId.toString(),
          'Nhắc thanh toán đặt sân cố định',
          `Đơn đặt sân cố định tháng tới tại ${venueName} cần được thanh toán trước ngày ${bookingDate.toLocaleDateString('vi-VN')}.`,
          NotificationType.BOOKING_REMINDER,
          { recurringBookingId: rb._id.toString(), bookingId: unpaidBookings[0]._id.toString() }
        ).catch(console.error);
      }

      // Auto-cancel if past booking date + 3 days
      if (daysUntilBooking < -3) {
        // Cancel unpaid bookings
        for (const ub of unpaidBookings) {
          ub.status = BookingStatus.CANCELLED;
          ub.cancelReason = 'Quá hạn thanh toán';
          await ub.save();
        }

        // Mark recurring as cancelled
        rb.status = RecurringStatus.CANCELLED;
        rb.isActive = false;
        await rb.save();

        // Refund paid bookings
        for (const payment of paidPayments) {
          payment.status = PaymentStatus.REFUNDING;
          payment.refundInfo = { reason: 'Hủy đặt sân cố định do không thanh toán kịp thời' } as any;
          await payment.save();
        }

        // Notify player
        this.notificationsService.sendAndSaveNotification(
          rb.playerId.toString(),
          'Đặt sân cố định đã bị hủy',
          `Đơn đặt sân cố định của bạn đã bị hủy do không thanh toán kịp thời. Tiền đã thanh toán sẽ được hoàn trong 3-5 ngày làm việc.`,
          NotificationType.BOOKING_CANCELLED,
          { recurringBookingId: rb._id.toString() }
        ).catch(console.error);
      }
    }
  }
}
