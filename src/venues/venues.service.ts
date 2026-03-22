import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Venue, VenueDocument, VenueStatus } from './schemas/venue.schema';
import { VenueImage, VenueImageDocument } from './schemas/venue-image.schema';
import { ApiResponseType, createApiResponse } from '../utils/response.util';
import { CreateVenueDto, UpdateVenueDto } from './dto/venue.dto';
import { AddVenueImageDto } from './dto/venue-image.dto';

@Injectable()
export class VenuesService {
  constructor(
    @InjectModel(Venue.name) private venueModel: Model<VenueDocument>,
    @InjectModel(VenueImage.name) private venueImageModel: Model<VenueImageDocument>,
  ) {}

  async findAll(query: any): Promise<ApiResponseType> {
    const filter: any = { status: VenueStatus.ACTIVE };
    
    // Basic text search on name or address
    if (query.keyword) {
      filter.$or = [
        { name: { $regex: query.keyword, $options: 'i' } },
        { address: { $regex: query.keyword, $options: 'i' } }
      ];
    }

    const venues = await this.venueModel.find(filter).sort({ createdAt: -1 }).exec();
    
    // Populate primary image if needed, for simplicity we just return venues
    return createApiResponse(venues, 'Lấy danh sách cơ sở sân thành công', HttpStatus.OK);
  }

  async findOne(id: string): Promise<ApiResponseType> {
    if (!Types.ObjectId.isValid(id)) throw new HttpException('ID cơ sở không hợp lệ', HttpStatus.BAD_REQUEST);

    const venue = await this.venueModel.findById(id).exec();
    if (!venue) throw new HttpException('Không tìm thấy cơ sở sân', HttpStatus.NOT_FOUND);

    const images = await this.venueImageModel.find({ venue_id: id }).exec();

    return createApiResponse({ ...venue.toObject(), images }, 'Lấy chi tiết cơ sở thành công', HttpStatus.OK);
  }

  async create(ownerId: string, dto: CreateVenueDto): Promise<ApiResponseType> {
    const { lat, lng, ...rest } = dto;
    const createData: any = { ...rest, owner_id: ownerId };

    if (lat !== undefined && lng !== undefined) {
      createData.coordinates = {
        type: 'Point',
        coordinates: [lng, lat],
      };
    }

    const newVenue = await this.venueModel.create(createData);
    return createApiResponse(newVenue, 'Đăng ký cơ sở sân mới thành công', HttpStatus.CREATED);
  }

  async update(id: string, ownerId: string, dto: UpdateVenueDto): Promise<ApiResponseType> {
    if (!Types.ObjectId.isValid(id)) throw new HttpException('ID cơ sở không hợp lệ', HttpStatus.BAD_REQUEST);

    const venue = await this.venueModel.findOne({ _id: id, owner_id: ownerId }).exec();
    if (!venue) throw new HttpException('Bạn không có quyền cập nhật cơ sở này hoặc cơ sở không tồn tại', HttpStatus.NOT_FOUND);

    const { lat, lng, ...rest } = dto;
    const updateData: any = { ...rest };

    if (lat !== undefined && lng !== undefined) {
      updateData.coordinates = {
        type: 'Point',
        coordinates: [lng, lat],
      };
    }

    const updatedVenue = await this.venueModel.findByIdAndUpdate(id, { $set: updateData }, { new: true }).exec();
    return createApiResponse(updatedVenue, 'Cập nhật thông tin cơ sở thành công', HttpStatus.OK);
  }

  async addImage(id: string, ownerId: string, dto: AddVenueImageDto): Promise<ApiResponseType> {
    if (!Types.ObjectId.isValid(id)) throw new HttpException('ID cơ sở không hợp lệ', HttpStatus.BAD_REQUEST);

    const venue = await this.venueModel.findOne({ _id: id, owner_id: ownerId }).exec();
    if (!venue) throw new HttpException('Bạn không có quyền thêm ảnh cho cơ sở này hoặc cơ sở không tồn tại', HttpStatus.NOT_FOUND);

    if (dto.is_primary) {
      await this.venueImageModel.updateMany({ venue_id: id }, { is_primary: false }).exec();
    }

    const newImage = await this.venueImageModel.create({
      venue_id: id,
      image_url: dto.image_url,
      is_primary: dto.is_primary || false,
    });

    return createApiResponse(newImage, 'Thêm hình ảnh thành công', HttpStatus.CREATED);
  }
}
