import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findOrCreate(firebaseUid: string, email: string): Promise<User> {
    let user = await this.userRepo.findOne({ where: { firebaseUid } });
    if (user) {
      user.email = email;
      return this.userRepo.save(user);
    }
    user = this.userRepo.create({ firebaseUid, email });
    return this.userRepo.save(user);
  }

  async findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { firebaseUid } });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }
}
