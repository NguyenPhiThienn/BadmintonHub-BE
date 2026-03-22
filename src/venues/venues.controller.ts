import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { VenuesService } from './venues.service';
import { CreateVenueDto, UpdateVenueDto } from './dto/venue.dto';
import { AddVenueImageDto } from './dto/venue-image.dto';
import { ApiResponseType } from '../utils/response.util';
import { JwtGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles, Public } from '../auth/decorators/auth.decorators';
import { UserRole } from '../users/schemas/user.schema';

@ApiTags('Venues Module (Quản lý Cơ sở sân cầu lông)')
@Controller('venues')
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @ApiOperation({ summary: 'Tìm kiếm, lọc danh sách cơ sở sân' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  @ApiQuery({ name: 'keyword', required: false })
  @Public()
  @Get()
  async findAll(@Query() query: any): Promise<ApiResponseType> {
    return await this.venuesService.findAll(query);
  }

  @ApiOperation({ summary: 'Xem chi tiết một cơ sở sân' })
  @ApiResponse({ status: 200, description: 'Lấy chi tiết thành công' })
  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponseType> {
    return await this.venuesService.findOne(id);
  }

  @ApiOperation({ summary: 'Đăng ký thông tin cơ sở mới (Chủ sân)' })
  @ApiResponse({ status: 201, description: 'Đăng ký thành công' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.COURT_OWNER)
  @Post()
  async create(@Req() req: any, @Body() dto: CreateVenueDto): Promise<ApiResponseType> {
    return await this.venuesService.create(req.user.id, dto);
  }

  @ApiOperation({ summary: 'Cập nhật thông tin cơ sở (Chủ sân)' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.COURT_OWNER, UserRole.ADMIN)
  @Put(':id')
  async update(@Param('id') id: string, @Req() req: any, @Body() dto: UpdateVenueDto): Promise<ApiResponseType> {
    return await this.venuesService.update(id, req.user.id, dto);
  }

  @ApiOperation({ summary: 'Thêm hình ảnh cho cơ sở (Chủ sân)' })
  @ApiResponse({ status: 201, description: 'Thêm hình ảnh thành công' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.COURT_OWNER, UserRole.ADMIN)
  @Post(':id/images')
  async addImage(@Param('id') id: string, @Req() req: any, @Body() dto: AddVenueImageDto): Promise<ApiResponseType> {
    return await this.venuesService.addImage(id, req.user.id, dto);
  }
}
