import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Tag } from './entities/tags.entities'
import { Repository } from 'typeorm'

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepo: Repository<Tag>,
  ) {}

  async findAllTags() {
    return await this.tagRepo.find()
  }
}
