import { IsString, IsNumber, IsEnum, IsOptional, IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { RecurringType, PaymentScheduleType } from '../schemas/recurring-booking.schema';

export class CreateRecurringBookingDto {
  @IsString()
  @IsNotEmpty()
  venueId: string;

  @IsString()
  @IsNotEmpty()
  courtId: string;

  @IsEnum(RecurringType)
  type: RecurringType;

  @IsNumber()
  occurrences: number;

  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsString()
  @IsNotEmpty()
  startTime: string;

  @IsString()
  @IsNotEmpty()
  endTime: string;

  @IsEnum(PaymentScheduleType)
  paymentSchedule: PaymentScheduleType;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsString()
  customerEmail?: string;
}

export class PreviewRecurringBookingDto {
  @IsString()
  @IsNotEmpty()
  venueId: string;

  @IsString()
  @IsNotEmpty()
  courtId: string;

  @IsEnum(RecurringType)
  type: RecurringType;

  @IsNumber()
  occurrences: number;

  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsString()
  @IsNotEmpty()
  startTime: string;

  @IsString()
  @IsNotEmpty()
  endTime: string;
}

export class UpdateRecurringBookingDto {
  @IsOptional()
  @IsEnum(['ACTIVE', 'PAUSED', 'CANCELLED'])
  status?: string;
}
