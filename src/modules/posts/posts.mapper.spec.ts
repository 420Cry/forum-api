import type { AccountSummary } from '../profiles/profiles.mapper'
import type { Posts } from './entities/posts.entity'
import {
  emptyReactionCounts,
  toPostResponse,
  toReactionInfo,
} from './posts.mapper'

describe('posts.mapper', () => {
  describe('emptyReactionCounts', () => {
    it('returns every reaction type at zero', () => {
      expect(emptyReactionCounts()).toEqual({
        back: 0,
        watch: 0,
        signal: 0,
        celebrate: 0,
        insight: 0,
      })
    })
  })

  describe('toReactionInfo', () => {
    it('layers grouped counts onto the zero object and sums the total', () => {
      const info = toReactionInfo(
        [
          { type: 'back', count: 3 },
          { type: 'insight', count: '1' },
        ],
        'back',
      )
      expect(info.counts).toEqual({
        back: 3,
        watch: 0,
        signal: 0,
        celebrate: 0,
        insight: 1,
      })
      expect(info.total).toBe(4)
      expect(info.viewerReaction).toBe('back')
    })

    it('is all-zero with a null viewer reaction when nothing occurred', () => {
      const info = toReactionInfo([], null)
      expect(info.total).toBe(0)
      expect(info.viewerReaction).toBeNull()
      expect(info.counts).toEqual(emptyReactionCounts())
    })
  })

  describe('toPostResponse', () => {
    const author: AccountSummary = {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Alex Morgan',
      headline: 'Founder / Personal Account',
      location: null,
      avatarUrl: null,
      href: '/u/alex-morgan',
      accountType: 'user',
    }

    const basePost = {
      id: '22222222-2222-2222-2222-222222222222',
      profile_id: author.id,
      content: 'hello world',
      visibility: 'public',
      image_url: 'https://cdn.example.com/a.jpg',
      createdAt: new Date('2026-09-01T10:30:00.000Z'),
      updatedAt: new Date('2026-09-02T08:00:00.000Z'),
    } as Posts

    it('maps image_url -> imageUrl, dates -> ISO strings, and passes author through', () => {
      const res = toPostResponse(basePost, author, toReactionInfo([], null))
      expect(res).toEqual({
        id: basePost.id,
        content: 'hello world',
        visibility: 'public',
        imageUrl: 'https://cdn.example.com/a.jpg',
        createdAt: '2026-09-01T10:30:00.000Z',
        updatedAt: '2026-09-02T08:00:00.000Z',
        author,
        reactionInfo: {
          total: 0,
          counts: emptyReactionCounts(),
          viewerReaction: null,
        },
      })
    })

    it('normalises a non-ISO timestamp string to ISO', () => {
      const res = toPostResponse(
        {
          ...basePost,
          createdAt: '2026-09-01T10:30:00.000Z' as unknown as Date,
        },
        author,
        toReactionInfo([], null),
      )
      expect(res.createdAt).toBe('2026-09-01T10:30:00.000Z')
    })

    it('yields imageUrl null when the column is empty', () => {
      const res = toPostResponse(
        { ...basePost, image_url: undefined },
        author,
        toReactionInfo([], null),
      )
      expect(res.imageUrl).toBeNull()
    })
  })
})
