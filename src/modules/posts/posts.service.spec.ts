import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { UsersService } from '../users/users.service'
import { Reactions } from '../reactions/entities/reactions.entity'
import { Posts } from './entities/posts.entity'
import { decodeCursor, encodeCursor } from './posts.cursor'
import { PostsService } from './posts.service'

const VIEWER = '11111111-1111-1111-1111-111111111111'
const OTHER = '22222222-2222-2222-2222-222222222222'
const POST_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const POST_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

type Chain = Record<string, jest.Mock>

function makePostsQb(rows: Partial<Posts>[]): Chain {
  const qb: Chain = {}
  for (const m of ['where', 'andWhere', 'orderBy', 'addOrderBy', 'take']) {
    qb[m] = jest.fn(() => qb)
  }
  qb.getMany = jest.fn().mockResolvedValue(rows)
  return qb
}

function makeReactionsQb(raw: unknown[]): Chain {
  const qb: Chain = {}
  for (const m of [
    'select',
    'addSelect',
    'where',
    'andWhere',
    'groupBy',
    'addGroupBy',
  ]) {
    qb[m] = jest.fn(() => qb)
  }
  qb.getRawMany = jest.fn().mockResolvedValue(raw)
  return qb
}

function makeUser(id: string) {
  return {
    supabaseUid: id,
    url_key: `user-${id.slice(0, 4)}`,
    name: 'Alex Morgan',
    role: 'Founder',
    location: null,
    avatar_url: null,
    onboarded_at: new Date(),
  }
}

function makePost(over: Partial<Posts>): Posts {
  return {
    id: POST_A,
    profile_id: VIEWER,
    content: 'hello',
    visibility: 'public',
    image_url: null,
    createdAt: new Date('2026-09-01T10:00:00.000Z'),
    updatedAt: new Date('2026-09-01T10:00:00.000Z'),
    deletedAt: null as unknown as Date,
    ...over,
  } as Posts
}

describe('PostsService', () => {
  let service: PostsService
  let postsRepo: {
    findOne: jest.Mock
    save: jest.Mock
    create: jest.Mock
    createQueryBuilder: jest.Mock
  }
  let reactionsRepo: { find: jest.Mock; createQueryBuilder: jest.Mock }
  let usersService: {
    findOnboardedBySupabaseUids: jest.Mock
    ensureUrlKey: jest.Mock
  }
  let postsQb: Chain
  let reactionsQb: Chain

  beforeEach(async () => {
    postsQb = makePostsQb([])
    reactionsQb = makeReactionsQb([])

    postsRepo = {
      findOne: jest.fn(),
      save: jest.fn((row: unknown) => Promise.resolve(row)),
      create: jest.fn((row: unknown) => row),
      createQueryBuilder: jest.fn(() => postsQb),
    }
    reactionsRepo = {
      find: jest.fn().mockResolvedValue([]),
      createQueryBuilder: jest.fn(() => reactionsQb),
    }
    usersService = {
      findOnboardedBySupabaseUids: jest
        .fn()
        .mockResolvedValue([makeUser(VIEWER)]),
      ensureUrlKey: jest.fn((user: unknown) => Promise.resolve(user)),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: getRepositoryToken(Posts), useValue: postsRepo },
        { provide: getRepositoryToken(Reactions), useValue: reactionsRepo },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile()

    service = module.get(PostsService)
  })

  describe('getFeed', () => {
    it('defaults the page size to 10 and fetches one extra row', async () => {
      await service.getFeed(VIEWER, {})
      expect(postsQb.take).toHaveBeenCalledWith(11)
    })

    it('clamps an oversized limit to the max (20)', async () => {
      await service.getFeed(VIEWER, { limit: 999 })
      expect(postsQb.take).toHaveBeenCalledWith(21)
    })

    it('always filters soft-deleted rows and scopes visibility to public + own', async () => {
      await service.getFeed(VIEWER, {})
      expect(postsQb.where).toHaveBeenCalledWith('post.deletedAt IS NULL')
      expect(postsQb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('post.visibility = :pub'),
        { pub: 'public', me: VIEWER },
      )
    })

    it('sets hasMore and a resumable nextCursor when an extra row comes back', async () => {
      const rows = Array.from({ length: 11 }, (_, n) =>
        makePost({
          id: `post-${n}`,
          createdAt: new Date(Date.now() - n * 1000),
        }),
      )
      postsQb.getMany.mockResolvedValue(rows)

      const res = await service.getFeed(VIEWER, { limit: 10 })

      expect(res.items).toHaveLength(10)
      expect(res.hasMore).toBe(true)
      expect(decodeCursor(res.nextCursor)).toEqual({
        c: rows[9].createdAt.toISOString(),
        i: 'post-9',
      })
    })

    it('has no nextCursor on the last page', async () => {
      postsQb.getMany.mockResolvedValue([makePost({ id: POST_A })])
      const res = await service.getFeed(VIEWER, { limit: 10 })
      expect(res.hasMore).toBe(false)
      expect(res.nextCursor).toBeNull()
      expect(res.items).toHaveLength(1)
    })

    it('rejects a malformed cursor with 400', async () => {
      await expect(
        service.getFeed(VIEWER, { cursor: '!!!not-valid!!!' }),
      ).rejects.toBeInstanceOf(BadRequestException)
    })

    it('applies the keyset predicate from a valid cursor', async () => {
      const cursor = encodeCursor({
        c: '2026-09-01T10:30:00.000Z',
        i: POST_B,
      })
      await service.getFeed(VIEWER, { cursor })
      expect(postsQb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('post.createdAt < :cc'),
        expect.objectContaining({ ci: POST_B }),
      )
    })

    it('drops posts whose author cannot be resolved', async () => {
      postsQb.getMany.mockResolvedValue([
        makePost({ id: POST_A, profile_id: VIEWER }),
        makePost({ id: POST_B, profile_id: OTHER }),
      ])
      usersService.findOnboardedBySupabaseUids.mockResolvedValue([
        makeUser(VIEWER),
      ])

      const res = await service.getFeed(VIEWER, {})

      expect(res.items).toHaveLength(1)
      expect(res.items[0].author.id).toBe(VIEWER)
    })

    it('merges grouped reaction counts and the viewer reaction', async () => {
      postsQb.getMany.mockResolvedValue([makePost({ id: POST_A })])
      reactionsQb.getRawMany.mockResolvedValue([
        { reactable_id: POST_A, type: 'back', count: '3' },
        { reactable_id: POST_A, type: 'insight', count: '1' },
      ])
      reactionsRepo.find.mockResolvedValue([
        { reactable_id: POST_A, type: 'celebrate' },
      ])

      const { reactionInfo } = (await service.getFeed(VIEWER, {})).items[0]

      expect(reactionInfo.total).toBe(4)
      expect(reactionInfo.counts.back).toBe(3)
      expect(reactionInfo.counts.insight).toBe(1)
      expect(reactionInfo.counts.watch).toBe(0)
      expect(reactionInfo.viewerReaction).toBe('celebrate')
    })
  })

  describe('createPost', () => {
    it('stamps profile_id from the viewer and returns an empty reactionInfo', async () => {
      postsRepo.save.mockImplementation((row: Partial<Posts>) =>
        Promise.resolve(makePost({ ...row, id: POST_A })),
      )
      usersService.findOnboardedBySupabaseUids.mockResolvedValue([
        makeUser(VIEWER),
      ])

      const res = await service.createPost(VIEWER, {
        content: 'gm',
        visibility: 'public',
      })

      expect(postsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ profile_id: VIEWER, content: 'gm' }),
      )
      expect(res.reactionInfo).toEqual({
        total: 0,
        counts: { back: 0, watch: 0, signal: 0, celebrate: 0, insight: 0 },
        viewerReaction: null,
      })
    })
  })

  describe('updatePost', () => {
    it('404s when the post is missing', async () => {
      postsRepo.findOne.mockResolvedValue(null)
      await expect(
        service.updatePost(VIEWER, POST_A, { content: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException)
    })

    it('404s when the post is soft-deleted', async () => {
      postsRepo.findOne.mockResolvedValue(
        makePost({ id: POST_A, deletedAt: new Date() }),
      )
      await expect(
        service.updatePost(VIEWER, POST_A, { content: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException)
    })

    it('404s when the viewer is not the author (no existence leak)', async () => {
      postsRepo.findOne.mockResolvedValue(
        makePost({ id: POST_A, profile_id: OTHER }),
      )
      await expect(
        service.updatePost(VIEWER, POST_A, { content: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException)
    })

    it('applies only the provided fields and keeps the rest', async () => {
      postsRepo.findOne.mockResolvedValue(
        makePost({
          id: POST_A,
          profile_id: VIEWER,
          content: 'old',
          visibility: 'private',
          image_url: 'https://cdn.example.com/x.jpg',
        }),
      )
      usersService.findOnboardedBySupabaseUids.mockResolvedValue([
        makeUser(VIEWER),
      ])

      await service.updatePost(VIEWER, POST_A, { content: 'new' })

      expect(postsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'new',
          visibility: 'private',
          image_url: 'https://cdn.example.com/x.jpg',
        }),
      )
    })

    it('clears image_url when imageUrl is explicitly null', async () => {
      postsRepo.findOne.mockResolvedValue(
        makePost({
          id: POST_A,
          profile_id: VIEWER,
          image_url: 'https://cdn.example.com/x.jpg',
        }),
      )
      usersService.findOnboardedBySupabaseUids.mockResolvedValue([
        makeUser(VIEWER),
      ])

      await service.updatePost(VIEWER, POST_A, { imageUrl: null })

      expect(postsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ image_url: null }),
      )
    })
  })

  describe('deletePost', () => {
    it('soft-deletes an owned post', async () => {
      const post = makePost({ id: POST_A, profile_id: VIEWER })
      postsRepo.findOne.mockResolvedValue(post)

      await service.deletePost(VIEWER, POST_A)

      expect(postsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: POST_A }),
      )
      expect(post.deletedAt).toBeInstanceOf(Date)
    })

    it('404s for a non-author', async () => {
      postsRepo.findOne.mockResolvedValue(
        makePost({ id: POST_A, profile_id: OTHER }),
      )
      await expect(service.deletePost(VIEWER, POST_A)).rejects.toBeInstanceOf(
        NotFoundException,
      )
    })
  })
})
