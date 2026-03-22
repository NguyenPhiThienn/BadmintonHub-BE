import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { ApiResponseType, createApiResponse } from '../utils/response.util';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async getProfile(userId: string): Promise<ApiResponseType> {
    const user = await this.userModel.findById(userId).select('-password_hash').exec();
    if (!user) {
      throw new HttpException('Người dùng không tồn tại', HttpStatus.NOT_FOUND);
    }
    return createApiResponse(user, 'Lấy thông tin thành công', HttpStatus.OK);
  }

  async updateProfile(userId: string, dto: UpdateUserDto): Promise<ApiResponseType> {
    const user = await this.userModel.findByIdAndUpdate(userId, { $set: dto }, { new: true }).select('-password_hash').exec();
    if (!user) {
      throw new HttpException('Người dùng không tồn tại', HttpStatus.NOT_FOUND);
    }
    return createApiResponse(user, 'Cập nhật thông tin thành công', HttpStatus.OK);
  }

  async getAllUsers(): Promise<ApiResponseType> {
    const users = await this.userModel.find().select('-password_hash').exec();
    return createApiResponse(users, 'Lấy danh sách người dùng thành công', HttpStatus.OK);
  }
}
