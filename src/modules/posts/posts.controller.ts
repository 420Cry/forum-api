import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import type { AuthUser, RequestWithUser } from '../auth/auth.types'
import { RequiresOnboarded } from '../users/decorators/requires-onboarded.decorator'
import { OnboardingStateGuard } from '../users/guards/onboarding-state.guard'
import { CreatePostDto, UpdatePostDto } from './dto/post.dto'
import { FeedQueryDto } from './dto/feed-query.dto'
import { PostsService } from './posts.service'

@Controller('posts')
@UseGuards(OnboardingStateGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @RequiresOnboarded()
  feed(@Query() query: FeedQueryDto, @Req() req: RequestWithUser) {
    const { id } = req.user as AuthUser
    return this.postsService.getFeed(id, query)
  }

  @Post()
  @RequiresOnboarded()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  async create(@Body() dto: CreatePostDto, @Req() req: RequestWithUser) {
    const { id } = req.user as AuthUser
    const post = await this.postsService.createPost(id, dto)
    return { success: true, post }
  }

  @Patch(':id')
  @RequiresOnboarded()
  async update(
    @Param('id', ParseUUIDPipe) postId: string,
    @Body() dto: UpdatePostDto,
    @Req() req: RequestWithUser,
  ) {
    const { id } = req.user as AuthUser
    const post = await this.postsService.updatePost(id, postId, dto)
    return { success: true, post }
  }

  @Delete(':id')
  @RequiresOnboarded()
  async remove(
    @Param('id', ParseUUIDPipe) postId: string,
    @Req() req: RequestWithUser,
  ) {
    const { id } = req.user as AuthUser
    await this.postsService.deletePost(id, postId)
    return { success: true }
  }
}
