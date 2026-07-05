import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from './entities'
import { UpdateUserType } from './users.type'

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

  async save(user: User): Promise<User> {
    return this.userRepo.save(user)
  }

  async update(user: User, userData: UpdateUserType): Promise<User> {
    for (const [key, value] of Object.entries(userData)) {
      user[key] = value
    }
    return await this.userRepo.save(user)
  }
}
