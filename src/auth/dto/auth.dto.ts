import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class LoginDto {
  @ApiPropertyOptional({
    example: 'NV001',
    description: 'Mã nhân viên hoặc số điện thoại để đăng nhập',
  })
  @IsOptional()
  @IsString()
  identifier?: string;

  @ApiPropertyOptional({
    example: 'NV001',
    description: 'Mã nhân viên (alias cho identifier)',
  })
  @IsOptional()
  @IsString()
  employeeCode?: string;

  @ApiProperty({
    example: 'Admin@123',
    description: 'Mật khẩu của tài khoản, tối thiểu 6 ký tự'
  })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;
}

export class ChangePasswordDto {
  @ApiProperty({
    example: 'OldPassword@123',
    description: 'Mật khẩu hiện tại'
  })
  @IsNotEmpty({ message: 'Mật khẩu hiện tại không được để trống' })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    example: 'NewPassword@123',
    description: 'Mật khẩu mới, tối thiểu 6 ký tự'
  })
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
  newPassword: string;

  @ApiPropertyOptional({
    example: 'NewPassword@123',
    description: 'Xác nhận mật khẩu mới'
  })
  @IsOptional()
  @IsString()
  confirmPassword?: string;
}


export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Refresh token để lấy access token mới'
  })
  @IsNotEmpty({ message: 'Refresh token không được để trống' })
  @IsString()
  refreshToken: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Nguyễn Văn A' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ example: '1990-01-15' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'Hà Nội' })
  @IsOptional()
  @IsString()
  hometown?: string;

  @ApiPropertyOptional({ example: '0901234567' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: '03343434' })
  @IsOptional()
  @IsString()
  identityCard?: string;

  @ApiPropertyOptional({ example: 'Kỹ sư' })
  @IsOptional()
  @IsString()
  qualification?: string;

  @ApiPropertyOptional({ example: 'data:image/png;base64,...' })
  @IsOptional()
  @IsString()
  digitalSignature?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
  @IsOptional()
  @IsString()
  avatar?: string;
}

export class RequestOtpDto {
  @ApiProperty({
    example: 'NV001',
    description: 'Mã nhân viên để yêu cầu OTP',
  })
  @IsNotEmpty({ message: 'Mã nhân viên không được để trống' })
  @IsString()
  employeeCode: string;
}

export class VerifyOtpDto {
  @ApiProperty({
    example: 'NV001',
    description: 'Mã nhân viên',
  })
  @IsNotEmpty({ message: 'Mã nhân viên không được để trống' })
  @IsString()
  employeeCode: string;

  @ApiProperty({
    example: '123456',
    description: 'Mã OTP gồm 6 chữ số',
  })
  @IsNotEmpty({ message: 'Mã OTP không được để trống' })
  @IsString()
  @MinLength(6, { message: 'Mã OTP phải có 6 chữ số' })
  otpCode: string;
}
