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
