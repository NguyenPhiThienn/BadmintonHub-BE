import { PartialType } from '@nestjs/swagger';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber, Matches } from 'class-validator';

export class CreateVenueDto {
  @ApiProperty({ example: 'Sân Cầu Lông A' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: '123 Đường B, Quận C' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiPropertyOptional({ example: 10.8231 })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ example: 106.6297 })
  @IsOptional()
  @IsNumber()
  lng?: number;

  @ApiPropertyOptional({ example: 'Sân đẹp, thoáng mát' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '05:00' })
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):?([0-5]\d)$/, { message: 'open_time must be HH:mm' })
  open_time: string;

  @ApiProperty({ example: '22:00' })
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):?([0-5]\d)$/, { message: 'close_time must be HH:mm' })
  close_time: string;
}

export class UpdateVenueDto extends PartialType(CreateVenueDto) {}
