import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findOrCreate(supabaseUid: string, email: string): Promise<User> {
    let user = await this.userRepo.findOne({ where: { supabaseUid } });
    if (user) {
      user.email = email;
      return this.userRepo.save(user);
    }
    user = this.userRepo.create({ supabaseUid, email });
    return this.userRepo.save(user);
  }

  async findBySupabaseUid(supabaseUid: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { supabaseUid } });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }
}
