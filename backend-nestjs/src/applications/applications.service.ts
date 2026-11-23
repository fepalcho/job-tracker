import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Application } from './application.schema.js';
import { ApplicationDto } from './application.dto.js';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectModel(Application.name) private readonly model: Model<Application>,
  ) {}

  findAll(ownerUid: string) {
    return this.model.find({ ownerUid }).sort({ updatedAt: -1 }).lean();
  }

  async findOne(ownerUid: string, id: string) {
    this.checkId(id);
    const doc = await this.model.findOne({ _id: id, ownerUid }).lean();
    if (!doc) throw new NotFoundException();
    return doc;
  }

  create(ownerUid: string, dto: ApplicationDto) {
    this.checkRules(dto);
    return this.model.create({ ...dto, ownerUid });
  }

  async update(ownerUid: string, id: string, dto: ApplicationDto) {
    this.checkId(id);
    this.checkRules(dto);
    const doc = await this.model
      .findOneAndUpdate({ _id: id, ownerUid }, dto, {
        returnDocument: 'after',
        runValidators: true,
      })
      .lean();
    if (!doc) throw new NotFoundException();
    return doc;
  }

  async remove(ownerUid: string, id: string) {
    this.checkId(id);
    const result = await this.model.deleteOne({ _id: id, ownerUid });
    if (result.deletedCount === 0) throw new NotFoundException();
  }

  private checkId(id: string) {
    if (!isValidObjectId(id)) throw new NotFoundException();
  }

  private checkRules(dto: ApplicationDto) {
    if (dto.status && dto.status !== 'TO_APPLY' && !dto.appliedAt) {
      throw new BadRequestException("La date d'envoi est obligatoire");
    }
  }
}
