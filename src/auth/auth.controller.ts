import { Body, Controller, Get, Post, Put, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, ChangePasswordDto, RefreshTokenDto, UpdateProfileDto } from './dto/auth.dto';
import { ApiResponseType } from '../utils/response.util';
import { JwtGuard } from './jwt-auth.guard';

@ApiTags('Authentication & Authorization')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }



  @ApiOperation({
    summary: 'Đăng nhập vào hệ thống',
    description: 'API đăng nhập cho admin và employee. Sử dụng username và password để xác thực. Trả về access token và refresh token.'
  })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công, trả về access token, refresh token và thông tin người dùng'
  })
  @ApiResponse({
    status: 401,
    description: 'Tên đăng nhập không tồn tại hoặc mật khẩu không chính xác'
  })
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<ApiResponseType> {
    return await this.authService.login(loginDto);
  }

  @ApiOperation({
    summary: 'Đăng xuất khỏi hệ thống',
    description: 'API đăng xuất, hủy phiên làm việc hiện tại. Yêu cầu access token hợp lệ.'
  })
  @ApiResponse({
    status: 200,
    description: 'Đăng xuất thành công'
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa đăng nhập hoặc token không hợp lệ'
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Req() req: any): Promise<ApiResponseType> {
    return await this.authService.logout(req.user.id);
  }

  @ApiOperation({
    summary: 'Làm mới access token',
    description: 'API làm mới access token bằng refresh token khi access token hết hạn. Trả về access token mới và refresh token mới.'
  })
  @ApiResponse({
    status: 200,
    description: 'Làm mới token thành công, trả về access token mới và refresh token mới'
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token không hợp lệ hoặc đã hết hạn'
  })
  @HttpCode(HttpStatus.OK)
  @Post('refresh-token')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<ApiResponseType> {
    return await this.authService.refreshToken(refreshTokenDto);
  }

  @ApiOperation({
    summary: 'Lấy thông tin người dùng hiện tại',
    description: 'API lấy thông tin chi tiết của người dùng đang đăng nhập, bao gồm thông tin nhân viên liên kết, quyền hạn và lịch sử đăng nhập. Yêu cầu access token hợp lệ.'
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin người dùng thành công'
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa đăng nhập hoặc token không hợp lệ'
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy người dùng'
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtGuard)
  @Get('me')
  async getMe(@Req() req: any): Promise<ApiResponseType> {
    return await this.authService.getMe(req.user.id);
  }

  @ApiOperation({
    summary: 'Cập nhật thông tin người dùng hiện tại',
    description: 'API cho phép người dùng đang đăng nhập tự cập nhật thông tin cá nhân của mình. Yêu cầu access token hợp lệ.'
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thông tin thành công'
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu không hợp lệ'
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa đăng nhập hoặc token không hợp lệ'
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  @Put('me')
  async updateMe(
    @Req() req: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<ApiResponseType> {
    return await this.authService.updateProfile(req.user.id, updateProfileDto);
  }

  @ApiOperation({
    summary: 'Đổi mật khẩu',
    description: 'API đổi mật khẩu cho người dùng đang đăng nhập. Yêu cầu nhập mật khẩu hiện tại, mật khẩu mới và xác nhận mật khẩu mới. Yêu cầu access token hợp lệ.'
  })
  @ApiResponse({
    status: 200,
    description: 'Đổi mật khẩu thành công'
  })
  @ApiResponse({
    status: 400,
    description: 'Mật khẩu hiện tại không chính xác hoặc mật khẩu mới không hợp lệ'
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa đăng nhập hoặc token không hợp lệ'
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy người dùng'
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  @Put('change-password')
  async changePassword(
    @Req() req: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<ApiResponseType> {
    return await this.authService.changePassword(req.user.id, changePasswordDto);
  }
}
