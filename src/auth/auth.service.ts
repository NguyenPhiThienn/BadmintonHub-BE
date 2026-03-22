import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { LoginDto, ChangePasswordDto, RefreshTokenDto, UpdateProfileDto } from './dto/auth.dto';
import { ApiResponseType, createApiResponse } from '../utils/response.util';
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(Employee.name) private employeeModel: Model<Employee>,
    private jwtService: JwtService,
  ) { }



  async updateProfile(userId: string, updateDto: UpdateProfileDto): Promise<ApiResponseType> {
    const employee = await this.employeeModel.findById(userId);

    if (!employee) {
      throw new HttpException(
        'Nhân viên không tồn tại',
        HttpStatus.NOT_FOUND,
      );
    }

    const updatedEmployee = await this.employeeModel.findByIdAndUpdate(
      userId,
      { $set: updateDto },
      { new: true },
    );

    return createApiResponse(updatedEmployee, 'Cập nhật thông tin cá nhân thành công', HttpStatus.OK);
  }

  async login(loginDto: LoginDto): Promise<ApiResponseType> {
    const { identifier, employeeCode, password } = loginDto;
    const loginValue = employeeCode || identifier;

    if (!loginValue) {
      throw new HttpException(
        'Mã nhân viên hoặc số điện thoại không được để trống',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Tìm Employee trực tiếp (qua mã NV hoặc SĐT)
    const employee = await this.employeeModel
      .findOne({
        $or: [
          { employeeCode: loginValue },
          { phoneNumber: loginValue }
        ],
        isActive: true
      })
      .select('+password')
      .exec();

    if (!employee) {
      throw new HttpException(
        'Tài khoản, mã nhân viên hoặc số điện thoại không tồn tại',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const isPasswordMatch = await bcrypt.compare(password, employee.password);
    if (!isPasswordMatch) {
      throw new HttpException(
        'Mật khẩu không chính xác',
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.employeeModel.findByIdAndUpdate(employee._id, {
      lastLogin: new Date(),
    });

    const payload = {
      sub: employee._id.toString(),
      username: employee.employeeCode,
      role: employee.role,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '1d' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return createApiResponse(
      {
        accessToken,
        refreshToken,
        user: {
          id: employee._id,
          username: employee.employeeCode,
          role: employee.role,
          employeeName: employee.fullName,
          employeeCode: employee.employeeCode,
          phoneNumber: employee.phoneNumber,
          permissions: employee.permissions,
          lastLogin: employee.lastLogin,
        },
      },
      'Đăng nhập thành công',
      HttpStatus.OK,
    );
  }

  async logout(userId: string): Promise<ApiResponseType> {
    return createApiResponse(
      null,
      'Đăng xuất thành công',
      HttpStatus.OK,
    );
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<ApiResponseType> {
    const { refreshToken } = refreshTokenDto;

    try {
      const payload = this.jwtService.verify(refreshToken);
      const employee = await this.employeeModel
        .findById(payload.sub)
        .exec();

      if (!employee) {
        throw new HttpException(
          'Nhân viên không tồn tại',
          HttpStatus.UNAUTHORIZED,
        );
      }

      // Tạo tokens mới
      const newPayload = {
        sub: employee._id.toString(),
        username: employee.employeeCode,
        role: employee.role,
      };

      const newAccessToken = this.jwtService.sign(newPayload, { expiresIn: '1d' });
      const newRefreshToken = this.jwtService.sign(newPayload, { expiresIn: '7d' });

      return createApiResponse(
        {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
        'Làm mới token thành công',
        HttpStatus.OK,
      );
    } catch (error) {
      throw new HttpException(
        'Refresh token không hợp lệ hoặc đã hết hạn',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  async getMe(userId: string): Promise<ApiResponseType> {
    const employee = await this.employeeModel
      .findById(userId)
      .exec();

    if (!employee) {
      throw new HttpException(
        'Nhân viên không tồn tại',
        HttpStatus.NOT_FOUND,
      );
    }

    return createApiResponse(
      {
        id: employee._id,
        username: employee.employeeCode,
        role: employee.role,
        employee: employee,
        permissions: employee.permissions,
        lastLogin: employee.lastLogin,
        createdAt: employee['createdAt'],
        updatedAt: employee['updatedAt'],
      },
      'Lấy thông tin người dùng thành công',
      HttpStatus.OK,
    );
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<ApiResponseType> {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

    if (confirmPassword && newPassword !== confirmPassword) {
      throw new HttpException(
        'Mật khẩu mới và xác nhận mật khẩu không khớp',
        HttpStatus.BAD_REQUEST,
      );
    }

    const employee = await this.employeeModel
      .findById(userId)
      .select('+password')
      .exec();

    if (!employee) {
      throw new HttpException(
        'Nhân viên không tồn tại',
        HttpStatus.NOT_FOUND,
      );
    }

    const isOldPasswordMatch = await bcrypt.compare(currentPassword, employee.password);
    if (!isOldPasswordMatch) {
      throw new HttpException(
        'Mật khẩu hiện tại không chính xác',
        HttpStatus.BAD_REQUEST,
      );
    }

    const isSamePassword = await bcrypt.compare(newPassword, employee.password);
    if (isSamePassword) {
      throw new HttpException(
        'Mật khẩu mới không được trùng với mật khẩu hiện tại',
        HttpStatus.BAD_REQUEST,
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.employeeModel.findByIdAndUpdate(userId, {
      password: hashedPassword,
    });

    return createApiResponse(
      null,
      'Đổi mật khẩu thành công',
      HttpStatus.OK,
    );
  }

  async validateUser(payload: any) {
    const employee = await this.employeeModel
      .findById(payload.sub)
      .exec();

    if (!employee) {
      return null;
    }

    return {
      id: employee._id.toString(),
      username: employee.employeeCode,
      role: employee.role,
      permissions: employee.permissions,
    };
  }
}
