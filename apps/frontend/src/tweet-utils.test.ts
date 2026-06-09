import { describe, expect, it } from 'vitest'
import { buildTweetThreads, removeTweetThread } from './tweet-utils'

const root = {
  id: 'root',
  parentId: null,
  createdAt: '2026-06-09T10:00:00.000Z',
}
const firstReply = {
  id: 'reply-1',
  parentId: 'root',
  createdAt: '2026-06-09T10:01:00.000Z',
}
const nestedReply = {
  id: 'reply-2',
  parentId: 'reply-1',
  createdAt: '2026-06-09T10:02:00.000Z',
}

describe('tweet thread helpers', () => {
  it('builds nested replies from a flat tweet list', () => {
    expect(buildTweetThreads([root], [nestedReply, firstReply, root])).toEqual([
      {
        ...root,
        replies: [
          {
            ...firstReply,
            replies: [{ ...nestedReply, replies: [] }],
          },
        ],
      },
    ])
  })

  it('removes a deleted tweet and every descendant', () => {
    expect(
      removeTweetThread([root, firstReply, nestedReply], 'reply-1'),
    ).toEqual([root])
  })
})
