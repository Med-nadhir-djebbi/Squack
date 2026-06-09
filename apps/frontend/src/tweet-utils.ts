export type ReplyableTweet = {
  id: string
  parentId?: string | null
  createdAt: string
}

export type TweetThread<T extends ReplyableTweet> = T & {
  replies: TweetThread<T>[]
}

export function buildTweetThreads<T extends ReplyableTweet>(
  roots: T[],
  allTweets: T[],
): TweetThread<T>[] {
  const childrenByParent = new Map<string, T[]>()

  for (const tweet of allTweets) {
    if (!tweet.parentId) {
      continue
    }

    const children = childrenByParent.get(tweet.parentId) ?? []
    children.push(tweet)
    childrenByParent.set(tweet.parentId, children)
  }

  for (const children of childrenByParent.values()) {
    children.sort(
      (left, right) =>
        new Date(left.createdAt).getTime() -
        new Date(right.createdAt).getTime(),
    )
  }

  function buildThread(tweet: T, ancestors: Set<string>): TweetThread<T> {
    if (ancestors.has(tweet.id)) {
      return { ...tweet, replies: [] }
    }

    const nextAncestors = new Set(ancestors)
    nextAncestors.add(tweet.id)

    return {
      ...tweet,
      replies: (childrenByParent.get(tweet.id) ?? []).map((reply) =>
        buildThread(reply, nextAncestors),
      ),
    }
  }

  return roots
    .filter((tweet) => !tweet.parentId)
    .map((tweet) => buildThread(tweet, new Set()))
}

export function removeTweetThread<T extends ReplyableTweet>(
  tweets: T[],
  tweetId: string,
): T[] {
  const idsToRemove = new Set([tweetId])
  let foundDescendant = true

  while (foundDescendant) {
    foundDescendant = false

    for (const tweet of tweets) {
      if (
        tweet.parentId &&
        idsToRemove.has(tweet.parentId) &&
        !idsToRemove.has(tweet.id)
      ) {
        idsToRemove.add(tweet.id)
        foundDescendant = true
      }
    }
  }

  return tweets.filter((tweet) => !idsToRemove.has(tweet.id))
}
