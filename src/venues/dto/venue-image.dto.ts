import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';

export class AddVenueImageDto {
  @ApiProperty({ example: 'https://example.com/image.jpg' })
  @IsNotEmpty()
  @IsString()
  image_url: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;
}
