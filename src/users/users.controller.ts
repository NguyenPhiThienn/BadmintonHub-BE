import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiResponseType } from '../utils/response.util';
import { JwtGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/auth.decorators';
import { UserRole } from './schemas/user.schema';

@ApiTags('Users Module (Quản lý hồ sơ người dùng)')
@Controller('users')
@ApiBearerAuth('access-token')
@UseGuards(JwtGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Lấy thông tin cá nhân' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thành công' })
  @Get('profile')
  async getProfile(@Req() req: any): Promise<ApiResponseType> {
    return await this.usersService.getProfile(req.user.id);
  }

  @ApiOperation({ summary: 'Cập nhật thông tin cá nhân' })
  @ApiResponse({ status: 200, description: 'Cập nhật thông tin thành công' })
  @Put('profile')
  async updateProfile(@Req() req: any, @Body() dto: UpdateUserDto): Promise<ApiResponseType> {
    return await this.usersService.updateProfile(req.user.id, dto);
  }

  @ApiOperation({ summary: 'Quản lý danh sách người dùng (Admin)' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách người dùng thành công' })
  @Roles(UserRole.ADMIN)
  @Get()
  async getAllUsers(): Promise<ApiResponseType> {
    return await this.usersService.getAllUsers();
  }
}
