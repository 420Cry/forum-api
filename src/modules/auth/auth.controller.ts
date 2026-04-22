import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from '../users';
import { FirebaseService } from './firebase.service';
import type { CookieOptions, Request, Response } from 'express';
import { FirebaseSessionGuard } from './firebase-session.guard';
import { FirebaseSessionAuthGuard } from './firebase-session-auth.guard';
import { Public } from './public.decorator';

type RequestWithUser = Request & {
  user?: { uid: string; email?: string; token: string };
};
type RequestWithToken = Request & { token: string };

const isProduction = process.env.NODE_ENV === 'production';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
    private readonly firebaseService: FirebaseService,
  ) {}

  @UseGuards(FirebaseSessionAuthGuard)
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

  @UseGuards(FirebaseSessionGuard)
  @Post('session')
  async createSession(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    const idToken = (req as unknown as RequestWithToken).token;
    const result = await this.firebaseService.createSessionCookie(idToken);
    if ('error' in result) {
      throw new UnauthorizedException();
    }

    const { sessionCookie } = result;
    const expiresIn = 60 * 60 * 24 * 5 * 1000;

    const cookieOptions: CookieOptions = {
      maxAge: expiresIn,
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
    };

    response.cookie('sessionId', sessionCookie, cookieOptions);
    return {
      message: 'Successfully create user session',
    };
  }

  @Public()
  @Post('logout')
  clearSession(@Res({ passthrough: true }) response: Response) {
    response
      .clearCookie('sessionId', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
      })
      .json({ success: true });
  }
}
