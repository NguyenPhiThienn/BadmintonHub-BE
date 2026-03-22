import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../users/schemas/user.schema';
import { RegisterDto, LoginDto, ChangePasswordDto, RefreshTokenDto, ForgotPasswordDto } from './dto/auth.dto';
import { ApiResponseType, createApiResponse } from '../utils/response.util';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) { }

  async register(dto: RegisterDto): Promise<ApiResponseType> {
    const existingUser = await this.userModel.findOne({
      $or: [{ email: dto.email }, { phone: dto.phone }]
    }).exec();

    if (existingUser) {
      throw new HttpException('Email hoặc số điện thoại đã tồn tại', HttpStatus.BAD_REQUEST);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const newUser = await this.userModel.create({
      full_name: dto.full_name,
      email: dto.email,
      phone: dto.phone,
      password_hash: hashedPassword,
      role: dto.role || UserRole.PLAYER,
    });

    const userObj = newUser.toObject();
    delete userObj.password_hash;

    return createApiResponse(userObj, 'Đăng ký tài khoản thành công', HttpStatus.CREATED);
  }

  async login(dto: LoginDto): Promise<ApiResponseType> {
    const user = await this.userModel.findOne({
      $or: [{ email: dto.identifier }, { phone: dto.identifier }],
    }).exec();

    if (!user) {
      throw new HttpException('Tài khoản không tồn tại', HttpStatus.UNAUTHORIZED);
    }

    const isPasswordMatch = await bcrypt.compare(dto.password, user.password_hash);
    if (!isPasswordMatch) {
      throw new HttpException('Mật khẩu không chính xác', HttpStatus.UNAUTHORIZED);
    }

    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '1d' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return createApiResponse(
      {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatar_url: user.avatar_url,
        },
      },
      'Đăng nhập thành công',
      HttpStatus.OK,
    );
  }

  async refreshToken(dto: RefreshTokenDto): Promise<ApiResponseType> {
    try {
      const payload = this.jwtService.verify(dto.refreshToken);
      const user = await this.userModel.findById(payload.sub).exec();

      if (!user) throw new Error();

      const newPayload = {
        sub: user._id.toString(),
        email: user.email,
        role: user.role,
      };

      const accessToken = this.jwtService.sign(newPayload, { expiresIn: '1d' });
      const refreshToken = this.jwtService.sign(newPayload, { expiresIn: '7d' });

      return createApiResponse({ accessToken, refreshToken }, 'Làm mới token thành công', HttpStatus.OK);
    } catch (error) {
      throw new HttpException('Refresh token không hợp lệ hoặc đã hết hạn', HttpStatus.UNAUTHORIZED);
    }
  }

  async logout(userId: string): Promise<ApiResponseType> {
    // In a stateless architecture, logout is usually handled by client clearing tokens.
    // If you cache/blacklist tokens, do it here.
    return createApiResponse(null, 'Đăng xuất thành công', HttpStatus.OK);
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<ApiResponseType> {
    const user = await this.userModel.findOne({ email: dto.email }).exec();
    if (!user) {
      // Avoid revealing if an email exists for security
      return createApiResponse(null, 'Nếu email tồn tại, OTP/Link đã được gửi', HttpStatus.OK);
    }

    // Logic to generate password-reset token and send email goes here.
    return createApiResponse(null, 'Vui lòng kiểm tra email để đặt lại mật khẩu', HttpStatus.OK);
  }


  async changePassword(userId: string, dto: ChangePasswordDto): Promise<ApiResponseType> {
    if (dto.confirmPassword && dto.newPassword !== dto.confirmPassword) {
      throw new HttpException('Mật khẩu xác nhận không khớp', HttpStatus.BAD_REQUEST);
    }

    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new HttpException('Người dùng không tồn tại', HttpStatus.NOT_FOUND);

    const isOldPasswordMatch = await bcrypt.compare(dto.currentPassword, user.password_hash);
    if (!isOldPasswordMatch) {
      throw new HttpException('Mật khẩu hiện tại không đúng', HttpStatus.BAD_REQUEST);
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.userModel.findByIdAndUpdate(userId, { password_hash: newHash });

    return createApiResponse(null, 'Đổi mật khẩu thành công', HttpStatus.OK);
  }

  async validateUser(payload: any) {
    const user = await this.userModel.findById(payload.sub).exec();
    if (!user) return null;

    return {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };
  }
}
