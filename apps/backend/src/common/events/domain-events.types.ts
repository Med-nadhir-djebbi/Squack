export interface EventUser {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export interface TweetCreatedEvent {
  id: string;
  content: string;
  authorId: string;
  author: EventUser;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageSentEvent {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  sender: EventUser;
  receiver: EventUser;
  createdAt: Date;
}

export interface DomainEventMap {
  'tweet.created': TweetCreatedEvent;
  'message.sent': MessageSentEvent;
}
