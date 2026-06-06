import { describe, expect, it } from 'vitest'
import { messageBelongsToThread, upsertMessage } from './message-utils'
import type { Message } from './message-utils'

const message: Message = {
  id: 'message-1',
  content: 'hello',
  senderId: 'viewer-1',
  receiverId: 'participant-1',
  sender: { id: 'viewer-1', username: 'viewer', avatarUrl: null },
  receiver: { id: 'participant-1', username: 'participant', avatarUrl: null },
  createdAt: '2026-06-06T12:00:00.000Z',
}

describe('message helpers', () => {
  it('matches only the selected two-person thread', () => {
    expect(messageBelongsToThread(message, 'viewer-1', 'participant-1')).toBe(true)
    expect(messageBelongsToThread(message, 'viewer-1', 'participant-2')).toBe(false)
  })

  it('adds new messages and replaces confirmed duplicates', () => {
    expect(upsertMessage([], message)).toEqual([message])
    const confirmed = { ...message, content: 'confirmed' }
    expect(upsertMessage([message], confirmed)).toEqual([confirmed])
  })
})
