import { TweetType } from './tweets.types';

export interface UserTweetsPage {
  authorId: string;
  cursor?: string;
  take: number;
}

export abstract class TweetsRepository {
  abstract findById(id: string): Promise<TweetType | null>;
  abstract findUserTweets(input: UserTweetsPage): Promise<TweetType[]>;
  abstract create(authorId: string, content: string): Promise<TweetType>;
  abstract findOwner(id: string): Promise<{ authorId: string } | null>;
  abstract delete(id: string): Promise<void>;
}
