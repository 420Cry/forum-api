import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Not, Repository, SelectQueryBuilder } from 'typeorm'
import { User } from './entities'
import { UpdateUserType } from './users.type'
import {
  allocateUniqueUrlKey,
  isUuid,
  isValidUrlKeyFormat,
  normalizeUrlKey,
  urlKeySourceFromUser,
} from './utils/url-key'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findOrCreate(supabaseUid: string, email: string): Promise<User> {
    let user = await this.userRepo.findOne({ where: { supabaseUid } })
    if (user) {
      user.email = email
      return this.userRepo.save(user)
    }
    user = this.userRepo.create({ supabaseUid, email })
    return this.userRepo.save(user)
  }

  async findBySupabaseUid(supabaseUid: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { supabaseUid } })
  }

  async findBySupabaseUidWithTags(supabaseUid: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { supabaseUid },
      relations: { tags: true },
    })
  }

  async findByUrlKeyWithTags(urlKey: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { url_key: urlKey },
      relations: { tags: true },
    })
  }

  async findOnboardedByUrlKeyOrId(urlKeyOrId: string): Promise<User | null> {
    const key = urlKeyOrId.trim()
    if (!key) return null

    const user = isUuid(key)
      ? await this.findBySupabaseUidWithTags(key)
      : await this.findByUrlKeyWithTags(normalizeUrlKey(key))

    if (!user?.onboarded_at) return null
    return this.ensureUrlKey(user)
  }

  async isUrlKeyTaken(urlKey: string, excludeUid?: string): Promise<boolean> {
    const where = excludeUid
      ? { url_key: urlKey, supabaseUid: Not(excludeUid) }
      : { url_key: urlKey }
    const count = await this.userRepo.count({ where })
    return count > 0
  }

  async allocateUrlKeyForUser(user: {
    supabaseUid: string
    name?: string | null
    email?: string | null
  }): Promise<string> {
    return allocateUniqueUrlKey(urlKeySourceFromUser(user), (candidate) =>
      this.isUrlKeyTaken(candidate, user.supabaseUid),
    )
  }

  /** Guarantee url_key exists (for onboarded users missing one after migration). */
  async ensureUrlKey(user: User): Promise<User> {
    if (user.url_key) return user
    const url_key = await this.allocateUrlKeyForUser(user)
    return this.update(user, { url_key })
  }

  /**
   * Validate a requested url_key change. Returns the normalized key to persist,
   * or null when unchanged.
   */
  async resolveUrlKeyUpdate(
    user: User,
    requested: string,
  ): Promise<string | null> {
    const next = normalizeUrlKey(requested)
    if (!isValidUrlKeyFormat(next)) {
      throw new BadRequestException('Invalid profile URL')
    }
    if (next === user.url_key) return null
    if (await this.isUrlKeyTaken(next, user.supabaseUid)) {
      throw new ConflictException('Profile URL is already taken')
    }
    return next
  }

  /** Query builder for onboarded users (for directory search). */
  createOnboardedQuery(
    sort: 'newest' | 'name' = 'newest',
  ): SelectQueryBuilder<User> {
    const qb = this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.tags', 'tags')
      .where('user.onboarded_at IS NOT NULL')
    if (sort === 'name') {
      qb.orderBy('user.name', 'ASC')
    } else {
      qb.orderBy('user.createdAt', 'DESC')
    }
    return qb
  }

  async save(user: User): Promise<User> {
    return this.userRepo.save(user)
  }

  async update(user: User, userData: UpdateUserType): Promise<User> {
    Object.assign(user, userData)
    return await this.userRepo.save(user)
  }
}
