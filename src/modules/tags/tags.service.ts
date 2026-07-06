import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Tag } from './entities/tags.entities'
import { In, Repository } from 'typeorm'

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepo: Repository<Tag>,
  ) {}

  async findAllTags() {
    return await this.tagRepo.find()
  }

  async findByKeys(keys: string[]) {
    if (keys.length === 0) return []
    return await this.tagRepo.find({ where: { key: In(keys) } })
  }
}
