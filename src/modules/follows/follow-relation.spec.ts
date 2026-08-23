import {
  classifyUserFollowRelations,
  followRelationRank,
} from './follow-relation'

describe('classifyUserFollowRelations', () => {
  it('marks mutual, following, and follower correctly', () => {
    const map = classifyUserFollowRelations(['a', 'b'], ['a', 'c'])
    expect(map.get('a')).toBe('mutual')
    expect(map.get('b')).toBe('following')
    expect(map.get('c')).toBe('follower')
  })

  it('ignores empty ids', () => {
    const map = classifyUserFollowRelations(['', 'x'], [''])
    expect(map.size).toBe(1)
    expect(map.get('x')).toBe('following')
  })
})

describe('followRelationRank', () => {
  it('orders mutual before one-sided', () => {
    expect(followRelationRank('mutual')).toBeLessThan(
      followRelationRank('following'),
    )
    expect(followRelationRank('following')).toBeLessThan(
      followRelationRank('follower'),
    )
  })
})
