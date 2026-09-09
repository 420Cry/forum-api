import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { personalAccountSummary } from '../profiles/profiles.mapper'
import type { AccountSummary } from '../profiles/profiles.mapper'
import { Reactions } from '../reactions/entities/reactions.entity'
import type { ReactionType } from '../reactions/reactions.type'
import { UsersService } from '../users/users.service'
import {
  FEED_DEFAULT_LIMIT,
  FEED_MAX_LIMIT,
  FEED_MIN_LIMIT,
} from './posts.constants'
import { CreatePostDto, UpdatePostDto } from './dto/post.dto'
import { FeedQueryDto } from './dto/feed-query.dto'
import { Posts } from './entities/posts.entity'
import { decodeCursor, encodeCursor } from './posts.cursor'
import { toIso, toPostResponse, toReactionInfo } from './posts.mapper'
import type { PostFeedResponse, PostResponse } from './posts.mapper'

type GroupedReactionRow = {
  reactable_id: string
  type: ReactionType
  count: string
}

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Posts)
    private readonly postsRepo: Repository<Posts>,
    @InjectRepository(Reactions)
    private readonly reactionsRepo: Repository<Reactions>,
    private readonly usersService: UsersService,
  ) {}

  /** Newest-first feed of public posts plus the viewer's own, keyset-paginated. */
  async getFeed(viewerId: string, q: FeedQueryDto): Promise<PostFeedResponse> {
    const limit = Math.min(
      Math.max(q.limit ?? FEED_DEFAULT_LIMIT, FEED_MIN_LIMIT),
      FEED_MAX_LIMIT,
    )

    const cursor = q.cursor ? decodeCursor(q.cursor) : null
    if (q.cursor && !cursor) {
      throw new BadRequestException('Invalid cursor')
    }

    // One extra row to detect a next page.
    const rows = await this.runFeedQuery(viewerId, cursor, limit + 1)

    const hasMore = rows.length > limit
    const pageRows = hasMore ? rows.slice(0, limit) : rows
    const last = pageRows[pageRows.length - 1]
    const nextCursor =
      hasMore && last
        ? encodeCursor({ c: toIso(last.createdAt), i: last.id })
        : null

    const items = await this.hydrate(pageRows, viewerId)
    return { items, nextCursor, hasMore }
  }

  /** Keyset page query, newest first, resuming after `cursor` when given. */
  private runFeedQuery(
    viewerId: string,
    cursor: { c: string; i: string } | null,
    take: number,
  ): Promise<Posts[]> {
    const qb = this.postsRepo
      .createQueryBuilder('post')
      .where('post.deletedAt IS NULL')
      .andWhere('(post.visibility = :pub OR post.profile_id = :me)', {
        pub: 'public',
        me: viewerId,
      })

    if (cursor) {
      qb.andWhere(
        '(post.createdAt < :cc OR (post.createdAt = :cc AND post.id < :ci))',
        { cc: new Date(cursor.c), ci: cursor.i },
      )
    }

    return qb
      .orderBy('post.createdAt', 'DESC')
      .addOrderBy('post.id', 'DESC')
      .take(take)
      .getMany()
  }

  async createPost(
    viewerId: string,
    dto: CreatePostDto,
  ): Promise<PostResponse> {
    const post = this.postsRepo.create({
      profile_id: viewerId,
      content: dto.content,
      visibility: dto.visibility,
      image_url: dto.imageUrl ?? null,
    })
    const saved = await this.postsRepo.save(post)
    return this.hydrateOne(saved, viewerId)
  }

  async updatePost(
    viewerId: string,
    postId: string,
    dto: UpdatePostDto,
  ): Promise<PostResponse> {
    const post = await this.loadOwnedPost(viewerId, postId)

    if (dto.content !== undefined) post.content = dto.content
    if (dto.visibility !== undefined) post.visibility = dto.visibility
    if ('imageUrl' in dto) post.image_url = dto.imageUrl ?? null

    const saved = await this.postsRepo.save(post)
    return this.hydrateOne(saved, viewerId)
  }

  async deletePost(viewerId: string, postId: string): Promise<void> {
    const post = await this.loadOwnedPost(viewerId, postId)
    post.deletedAt = new Date()
    await this.postsRepo.save(post)
  }

  /** A live post owned by the viewer, else `NotFoundException`. */
  private async loadOwnedPost(
    viewerId: string,
    postId: string,
  ): Promise<Posts> {
    const post = await this.postsRepo.findOne({ where: { id: postId } })
    if (!post || post.deletedAt) {
      throw new NotFoundException('Post not found')
    }
    if (post.profile_id !== viewerId) {
      throw new NotFoundException('Post not found')
    }
    return post
  }

  /** Single-post hydrate; throws if the author can't be resolved. */
  private async hydrateOne(
    post: Posts,
    viewerId: string,
  ): Promise<PostResponse> {
    const [response] = await this.hydrate([post], viewerId)
    if (!response) {
      throw new NotFoundException('Author profile not found')
    }
    return response
  }

  /** Attach author + reaction info to a batch of posts. */
  private async hydrate(
    posts: Posts[],
    viewerId: string,
  ): Promise<PostResponse[]> {
    if (!posts.length) return []

    const authorById = await this.loadAuthors(posts.map((p) => p.profile_id))
    const postIds = posts.map((p) => p.id)

    const grouped = await this.reactionsRepo
      .createQueryBuilder('r')
      .select('r.reactable_id', 'reactable_id')
      .addSelect('r.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('r.reactable_type = :type', { type: 'post' })
      .andWhere('r.reactable_id IN (:...postIds)', { postIds })
      .groupBy('r.reactable_id')
      .addGroupBy('r.type')
      .getRawMany<GroupedReactionRow>()

    const viewerRows = await this.reactionsRepo.find({
      where: {
        profile_id: viewerId,
        reactable_type: 'post',
        reactable_id: In(postIds),
      },
    })
    const viewerReactionById = new Map<string, ReactionType>(
      viewerRows.map((row) => [row.reactable_id, row.type]),
    )

    const responses: PostResponse[] = []
    for (const post of posts) {
      const author = authorById.get(post.profile_id)
      if (!author) continue

      const rows = grouped
        .filter((row) => row.reactable_id === post.id)
        .map((row) => ({ type: row.type, count: row.count }))
      responses.push(
        toPostResponse(
          post,
          author,
          toReactionInfo(rows, viewerReactionById.get(post.id) ?? null),
        ),
      )
    }
    return responses
  }

  private async loadAuthors(
    profileIds: string[],
  ): Promise<Map<string, AccountSummary>> {
    const uniqueIds = [...new Set(profileIds)]
    const users = await this.usersService.findOnboardedBySupabaseUids(uniqueIds)
    const map = new Map<string, AccountSummary>()
    for (const user of users) {
      const ready = await this.usersService.ensureUrlKey(user)
      map.set(ready.supabaseUid, personalAccountSummary(ready))
    }
    return map
  }
}
