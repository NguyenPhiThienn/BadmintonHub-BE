import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt-auth.guard';
import { RecurringBookingsService } from './recurring-bookings.service';
import { CreateRecurringBookingDto, PreviewRecurringBookingDto, UpdateRecurringBookingDto } from './dto/recurring-booking.dto';

@Controller('recurring-bookings')
@UseGuards(JwtGuard)
export class RecurringBookingsController {
  constructor(private readonly recurringBookingsService: RecurringBookingsService) {}

  @Post('preview')
  async preview(@Req() req: any, @Body() dto: PreviewRecurringBookingDto) {
    return this.recurringBookingsService.preview(req.user.userId, dto);
  }

  @Post()
  async create(@Req() req: any, @Body() dto: CreateRecurringBookingDto) {
    return this.recurringBookingsService.create(req.user.userId, dto);
  }

  @Get()
  async getMyRecurringBookings(
    @Req() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.recurringBookingsService.getMyRecurringBookings(
      req.user.userId,
      parseInt(page) || 1,
      parseInt(limit) || 10,
    );
  }

  @Get(':id')
  async getOne(@Req() req: any, @Param('id') id: string) {
    return this.recurringBookingsService.getOne(req.user.userId, id);
  }

  @Delete(':id')
  async cancel(@Req() req: any, @Param('id') id: string) {
    return this.recurringBookingsService.cancel(req.user.userId, id);
  }
}
