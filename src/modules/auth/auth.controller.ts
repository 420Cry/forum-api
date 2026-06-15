import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { UsersService } from '../users';

type RequestWithUser = Request & { user?: { uid: string; email?: string } };

@Controller('auth')
@UseGuards(SupabaseAuthGuard)
export class AuthController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@Req() req: RequestWithUser) {
    const authUser = req.user;
    if (!authUser?.uid) {
      return { uid: null, email: null, user: null };
    }
    const user = await this.usersService.findOrCreate(
      authUser.uid,
      authUser.email ?? '',
    );
    return {
      uid: authUser.uid,
      email: authUser.email,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    };
  }
}
