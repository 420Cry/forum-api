import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { UsersService } from '../users';

type RequestWithUser = Request & { user?: { uid: string; email?: string } };

@Controller('auth')
@UseGuards(FirebaseAuthGuard)
export class AuthController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@Req() req: RequestWithUser) {
    const firebaseUser = (req as unknown as RequestWithUser).user;
    if (!firebaseUser?.uid) {
      return { uid: null, email: null, user: null };
    }
    const user = await this.usersService.findOrCreate(
      firebaseUser.uid,
      firebaseUser.email ?? '',
    );
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    };
  }
}
