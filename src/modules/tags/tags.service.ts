import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import type { TagKind } from './catalog.seeds'
import { Tag } from './entities/tags.entities'

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepo: Repository<Tag>,
  ) {}

  async findAllTags() {
    return await this.tagRepo.find({ order: { name: 'ASC' } })
  }

  async findByKind(kind: TagKind) {
    return await this.tagRepo.find({
      where: { kind },
      order: { name: 'ASC' },
    })
  }

  async findByKeys(keys: string[]) {
    if (keys.length === 0) return []
    return await this.tagRepo.find({ where: { key: In(keys) } })
  }

  async findByKeysAndKind(keys: string[], kind: TagKind) {
    if (keys.length === 0) return []
    return await this.tagRepo.find({ where: { key: In(keys), kind } })
  }

  async findOneByKeyAndKind(key: string, kind: TagKind): Promise<Tag | null> {
    return await this.tagRepo.findOne({ where: { key, kind } })
  }

  /** Insert or refresh a location tag (city search picks + fixed seeds). */
  async upsertLocation(key: string, name: string): Promise<Tag> {
    return this.upsertKind(key, name, 'location')
  }

  /** Insert or refresh an occupation tag (catalog + free-text titles). */
  async upsertOccupation(key: string, name: string): Promise<Tag> {
    return this.upsertKind(key, name, 'occupation')
  }

  private async upsertKind(
    key: string,
    name: string,
    kind: TagKind,
  ): Promise<Tag> {
    const existing = await this.tagRepo.findOne({ where: { key, kind } })
    if (existing) {
      if (existing.name !== name) {
        existing.name = name
        return await this.tagRepo.save(existing)
      }
      return existing
    }
    return await this.tagRepo.save(this.tagRepo.create({ key, name, kind }))
  }

  /** Map keys → display names (missing keys omitted). */
  async labelMap(
    keys: Array<string | null | undefined>,
  ): Promise<Map<string, string>> {
    const unique = [...new Set(keys.filter((k): k is string => !!k))]
    if (unique.length === 0) return new Map()
    const tags = await this.findByKeys(unique)
    return new Map(tags.map((tag) => [tag.key, tag.name]))
  }
}
