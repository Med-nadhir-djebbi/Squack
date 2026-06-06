export type MessageParticipant = {
  id: string
  username: string
  avatarUrl?: string | null
}

export type Message = {
  id: string
  content: string
  senderId: string
  receiverId: string
  sender: MessageParticipant
  receiver: MessageParticipant
  createdAt: string
}

export function messageBelongsToThread(
  message: Message,
  viewerId: string,
  participantId: string,
) {
  return (
    (message.senderId === viewerId && message.receiverId === participantId) ||
    (message.senderId === participantId && message.receiverId === viewerId)
  )
}

export function upsertMessage(messages: Message[], nextMessage: Message) {
  const existingIndex = messages.findIndex(
    (message) => message.id === nextMessage.id,
  )

  if (existingIndex === -1) {
    return [...messages, nextMessage]
  }

  return messages.map((message, index) =>
    index === existingIndex ? nextMessage : message,
  )
}
