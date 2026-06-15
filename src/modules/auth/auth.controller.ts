import { Controller, Get, Req } from '@nestjs/common';
import type { RequestWithUser } from './auth.types';

@Controller('auth')
export class AuthController {
  @Get('me')
  getMe(@Req() req: RequestWithUser) {
    const authUser = req.user;
    if (!authUser?.id) {
      return { id: null, email: null };
    }
    return {
      id: authUser.id,
      email: authUser.email ?? null,
    };
  }
}
