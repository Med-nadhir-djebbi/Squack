import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import {
  BrowserRouter,
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useParams,
  useNavigate,
} from 'react-router-dom'
import { io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import { messageBelongsToThread, upsertMessage } from './message-utils'
import type { Message } from './message-utils'
import './App.css'

const TOKEN_KEY = 'squack_access_token'
const GRAPHQL_URL =
  import.meta.env.VITE_GRAPHQL_URL ?? 'http://localhost:3000/graphql'
const API_URL = (
  import.meta.env.VITE_API_URL ?? GRAPHQL_URL.replace(/\/graphql\/?$/, '')
).replace(/\/$/, '')
type IconName =
  | 'home'
  | 'search'
  | 'bell'
  | 'message'
  | 'bookmark'
  | 'user'
  | 'settings'
  | 'plus'
  | 'image'
  | 'send'
  | 'reply'
  | 'repeat'
  | 'heart'
  | 'chart'
  | 'more'
  | 'edit'
  | 'trash'

type Tone = 'moss' | 'brick' | 'ink' | 'gold'
type AuthMode = 'login' | 'register'
type ReactionKind = 'LIKE' | 'LOVE' | 'LAUGH' | 'WOW' | 'SAD'

type User = {
  id: string
  username: string
  bio?: string | null
  avatarUrl?: string | null
  createdAt: string
  updatedAt: string
}

type TweetAuthor = {
  id: string
  username: string
  avatarUrl?: string | null
}

type TweetReactionCount = {
  kind: ReactionKind
  count: number
}

type Tweet = {
  id: string
  content: string
  authorId: string
  author: TweetAuthor
  createdAt: string
  updatedAt: string
  reactionCount: number
  reactionCounts: TweetReactionCount[]
}

type NotificationType = 'FOLLOW' | 'MESSAGE' | 'TWEET'

type Notification = {
  id: string
  type: NotificationType
  message: string
  isRead: boolean
  userId: string
  actorId?: string | null
  createdAt: string
}

type AuthPayload = {
  accessToken: string
  user: User
}

type PageMeta = {
  label: string
  path: string
  icon: IconName
  eyebrow: string
  title: string
  documentTitle: string
}

type GraphQLError = {
  message: string
}

type GraphQLResponse<T> = {
  data?: T
  errors?: GraphQLError[]
}

type AuthRequestOptions = {
  method?: 'GET' | 'POST'
  body?: unknown
  token?: string | null
}

const navigation: PageMeta[] = [
  {
    label: 'Home',
    path: '/',
    icon: 'home',
    eyebrow: 'Live feed',
    title: 'Home',
    documentTitle: 'Home - Squack',
  },
  {
    label: 'Explore',
    path: '/explore',
    icon: 'search',
    eyebrow: 'Find people',
    title: 'Explore',
    documentTitle: 'Explore - Squack',
  },
  {
    label: 'Alerts',
    path: '/alerts',
    icon: 'bell',
    eyebrow: 'Recent activity',
    title: 'Alerts',
    documentTitle: 'Alerts - Squack',
  },
  {
    label: 'Messages',
    path: '/messages',
    icon: 'message',
    eyebrow: 'Private threads',
    title: 'Messages',
    documentTitle: 'Messages - Squack',
  },
  {
    label: 'Bookmarks',
    path: '/bookmarks',
    icon: 'bookmark',
    eyebrow: 'Saved posts',
    title: 'Bookmarks',
    documentTitle: 'Bookmarks - Squack',
  },
  {
    label: 'Profile',
    path: '/profile',
    icon: 'user',
    eyebrow: 'Public profile',
    title: 'Profile',
    documentTitle: 'Profile - Squack',
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: 'settings',
    eyebrow: 'Preferences',
    title: 'Settings',
    documentTitle: 'Settings - Squack',
  },
]

const pageByPath = navigation.reduce<Record<string, PageMeta>>((pages, page) => {
  pages[page.path] = page
  return pages
}, {})

const USER_FIELDS = `
  id
  username
  bio
  avatarUrl
  createdAt
  updatedAt
`

const TWEET_FIELDS = `
  id
  content
  authorId
  createdAt
  updatedAt
  reactionCount
  reactionCounts {
    kind
    count
  }
  author {
    id
    username
    avatarUrl
  }
`

const MESSAGE_FIELDS = `
  id
  content
  senderId
  receiverId
  createdAt
  sender {
    id
    username
    avatarUrl
  }
  receiver {
    id
    username
    avatarUrl
  }
`

const NOTIFICATION_FIELDS = `
  id
  type
  message
  isRead
  userId
  actorId
  createdAt
`

const USERS_QUERY = `
  query Users {
    users {
      ${USER_FIELDS}
    }
  }
`

const TWEETS_QUERY = `
  query Tweets {
    tweets(limit: 50) {
      nodes {
        ${TWEET_FIELDS}
      }
    }
  }
`

const FEED_QUERY = `
  query Feed {
    feed(limit: 50) {
      nodes {
        ${TWEET_FIELDS}
      }
    }
  }
`

const CREATE_TWEET_MUTATION = `
  mutation CreateTweet($input: CreateTweetInput!) {
    createTweet(input: $input) {
      ${TWEET_FIELDS}
    }
  }
`

const UPDATE_TWEET_MUTATION = `
  mutation UpdateTweet($input: UpdateTweetInput!) {
    updateTweet(input: $input) {
      ${TWEET_FIELDS}
    }
  }
`

const DELETE_TWEET_MUTATION = `
  mutation DeleteTweet($id: ID!) {
    deleteTweet(id: $id)
  }
`

const REACT_TO_TWEET_MUTATION = `
  mutation ReactToTweet($input: ReactToTweetInput!) {
    reactToTweet(input: $input) {
      ${TWEET_FIELDS}
    }
  }
`

const CONVERSATION_QUERY = `
  query Conversation($withUserId: ID!) {
    conversation(withUserId: $withUserId, limit: 50) {
      nodes {
        ${MESSAGE_FIELDS}
      }
    }
  }
`

const SEND_MESSAGE_MUTATION = `
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      ${MESSAGE_FIELDS}
    }
  }
`

const FOLLOW_MUTATION = `
  mutation Follow($userId: ID!) {
    follow(userId: $userId)
  }
`

const UNFOLLOW_MUTATION = `
  mutation Unfollow($userId: ID!) {
    unfollow(userId: $userId)
  }
`

const FOLLOWING_QUERY = `
  query Following($userId: ID!) {
    following(userId: $userId) {
      id
    }
  }
`

const NOTIFICATIONS_QUERY = `
  query Notifications {
    notifications {
      ${NOTIFICATION_FIELDS}
    }
  }
`

const MARK_NOTIFICATIONS_AS_READ_MUTATION = `
  mutation MarkAllNotificationsAsRead {
    markAllNotificationsAsRead
  }
`

const MARK_NOTIFICATION_AS_READ_MUTATION = `
  mutation MarkNotificationAsRead($id: ID!) {
    markNotificationAsRead(id: $id)
  }
`

async function graphqlRequest<T>(
  query: string,
  variables: Record<string, unknown> = {},
  token?: string | null,
): Promise<T> {
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    throw new Error(`GraphQL request failed with ${response.status}`)
  }

  const payload = (await response.json()) as GraphQLResponse<T>

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join('\n'))
  }

  if (!payload.data) {
    throw new Error('GraphQL response did not include data')
  }

  return payload.data
}

function getAuthErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== 'object' || !('message' in payload)) {
    return null
  }

  const message = (payload as { message?: unknown }).message

  if (Array.isArray(message)) {
    return message.join('\n')
  }

  return typeof message === 'string' ? message : null
}

async function authRequest<T>(
  path: string,
  options: AuthRequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body:
      options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  const payload = (await response.json().catch(() => null)) as unknown

  if (!response.ok) {
    throw new Error(
      getAuthErrorMessage(payload) ?? `Auth request failed with ${response.status}`,
    )
  }

  return payload as T
}

type Toast = {
  id: string
  message: string
  type: NotificationType
  title: string
  onClick?: () => void
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast
  onRemove: (id: string) => void
}) {
  return (
    <div
      className="toast"
      onClick={() => {
        toast.onClick?.()
        onRemove(toast.id)
      }}
    >
      <div className="row-icon">
        <Icon
          name={
            toast.type === 'MESSAGE'
              ? 'message'
              : toast.type === 'FOLLOW'
                ? 'user'
                : 'bell'
          }
        />
      </div>
      <div>
        <p>{toast.title}</p>
        <span>{toast.message}</span>
      </div>
    </div>
  )
}

function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[]
  onRemove: (id: string) => void
}) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong'
}

function initials(value: string) {
  return value
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
    .padEnd(2, value[0]?.toUpperCase() ?? 'S')
}

function toneFor(value: string): Tone {
  const tones: Tone[] = ['moss', 'brick', 'ink', 'gold']
  const total = value
    .split('')
    .reduce((sum, character) => sum + character.charCodeAt(0), 0)

  return tones[total % tones.length]
}

function formatTime(value: string) {
  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  if (diffMs < minute) {
    return 'now'
  }

  if (diffMs < hour) {
    return `${Math.floor(diffMs / minute)}m`
  }

  if (diffMs < day) {
    return `${Math.floor(diffMs / hour)}h`
  }

  return `${Math.floor(diffMs / day)}d`
}

function Icon({ name }: { name: IconName }) {
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {name === 'home' && (
        <path d="M4 10.8 12 4l8 6.8V20h-5v-6H9v6H4z" />
      )}
      {name === 'search' && (
        <>
          <circle cx="10.8" cy="10.8" r="6.3" />
          <path d="m16 16 4 4" />
        </>
      )}
      {name === 'bell' && (
        <path d="M18 9.8c0-3.4-2.3-5.8-6-5.8s-6 2.4-6 5.8c0 5-2 5.5-2 7.2h16c0-1.7-2-2.2-2-7.2ZM9.6 20a2.7 2.7 0 0 0 4.8 0" />
      )}
      {name === 'message' && <path d="M5 5h14v10H8.5L5 19z" />}
      {name === 'bookmark' && <path d="M7 4h10v16l-5-3-5 3z" />}
      {name === 'user' && (
        <>
          <circle cx="12" cy="8" r="4" />
          <path d="M4.5 20c1.4-4 13.6-4 15 0" />
        </>
      )}
      {name === 'settings' && (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v3M12 18v3M4.2 7.5l2.6 1.5M17.2 15l2.6 1.5M19.8 7.5 17.2 9M6.8 15l-2.6 1.5" />
        </>
      )}
      {name === 'plus' && <path d="M12 5v14M5 12h14" />}
      {name === 'image' && (
        <>
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <path d="m4 16 4.5-4 3 3 2-2 6.5 6" />
          <circle cx="15.5" cy="9.5" r="1.5" />
        </>
      )}
      {name === 'send' && <path d="M4 12 20 5l-5 15-3-6z" />}
      {name === 'reply' && <path d="M9 8 5 12l4 4M6 12h7a6 6 0 0 1 6 6" />}
      {name === 'repeat' && (
        <path d="M7 7h9l-2-2M17 17H8l2 2M17 17v-4M7 7v4" />
      )}
      {name === 'heart' && (
        <path d="M12 20s-7-4.2-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.8-7 10-7 10Z" />
      )}
      {name === 'chart' && <path d="M5 19V9M12 19V5M19 19v-7" />}
      {name === 'more' && (
        <>
          <circle cx="6" cy="12" r="1" />
          <circle cx="12" cy="12" r="1" />
          <circle cx="18" cy="12" r="1" />
        </>
      )}
      {name === 'edit' && (
        <>
          <path d="m5 19 4.2-1 9.4-9.4-3.2-3.2L6 14.8 5 19Z" />
          <path d="m14.8 5.4 3.2 3.2" />
        </>
      )}
      {name === 'trash' && (
        <>
          <path d="M5 7h14" />
          <path d="M10 11v6M14 11v6" />
          <path d="m8 7 1-3h6l1 3M7 7l1 13h8l1-13" />
        </>
      )}
    </svg>
  )
}

function SquackLogo() {
  return (
    <svg
      className="squack-logo"
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      <path
        className="logo-shadow"
        d="M17 13h30c6.1 0 10 3.8 10 9.7v16.6c0 5.9-3.9 9.7-10 9.7h-9.5L27.8 58v-9H17c-6.1 0-10-3.8-10-9.7V22.7C7 16.8 10.9 13 17 13Z"
      />
      <path
        className="logo-bubble"
        d="M16 9h30c6.1 0 10 3.8 10 9.7v16.6c0 5.9-3.9 9.7-10 9.7h-9.5L26.8 54v-9H16C9.9 45 6 41.2 6 35.3V18.7C6 12.8 9.9 9 16 9Z"
      />
      <path
        className="logo-neck"
        d="M20 32.4c3.2 2.3 7.2 3.5 12 3.5 6.1 0 10.1-2.5 10.1-6.4 0-3.5-2.9-5.3-8.8-6l-3.8-.5c-2.2-.3-3.2-.9-3.2-1.8 0-1.2 1.6-2 4.2-2 3 0 6.1.8 9.2 2.3l2.9-5.7C39.3 14 35.3 13 30.7 13 24 13 19.9 16.2 19.9 21.3c0 4.1 2.9 6.5 8.8 7.2l3.6.4c2.3.3 3.2.8 3.2 1.7 0 1.1-1.4 1.7-3.8 1.7-3.2 0-6.2-1-8.8-2.8L20 32.4Z"
      />
      <path className="logo-beak" d="m47 23 8-3.2-5.2 7.6Z" />
      <circle className="logo-eye" cx="42.2" cy="20.1" r="2.1" />
    </svg>
  )
}

function Avatar({
  label,
  tone,
  size = 'regular',
}: {
  label: string
  tone: Tone
  size?: 'small' | 'regular' | 'large'
}) {
  return <span className={`avatar avatar-${tone} avatar-${size}`}>{label}</span>
}

function TitleManager({ users }: { users: User[] }) {
  const { pathname } = useLocation()

  useEffect(() => {
    if (pathname.startsWith('/messages/')) {
      const userId = pathname.split('/').at(-1)
      const user = users.find((item) => item.id === userId)
      document.title = user
        ? `${user.username} - Messages - Squack`
        : 'Messages - Squack'
      return
    }

    document.title = pageByPath[pathname]?.documentTitle ?? 'Squack'
  }, [pathname, users])

  return null
}

function PageHeader({ meta, action }: { meta: PageMeta; action?: ReactNode }) {
  return (
    <header className="feed-header">
      <div>
        <p className="eyebrow">{meta.eyebrow}</p>
        <h1>{meta.title}</h1>
      </div>
      {action}
    </header>
  )
}

function EmptyState({
  icon,
  title,
  body,
}: {
  icon: IconName
  title: string
  body: string
}) {
  return (
    <section className="empty-state">
      <span className="row-icon">
        <Icon name={icon} />
      </span>
      <strong>{title}</strong>
      <p>{body}</p>
    </section>
  )
}

function AuthPage({ onAuthenticated }: { onAuthenticated: (payload: AuthPayload) => void }) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    document.title =
      mode === 'login' ? 'Sign in - Squack' : 'Create account - Squack'
  }, [mode])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      if (mode === 'login') {
        const data = await authRequest<AuthPayload>('/auth/login', {
          method: 'POST',
          body: { email, password },
        })
        onAuthenticated(data)
      } else {
        const data = await authRequest<AuthPayload>('/auth/register', {
          method: 'POST',
          body: { username, email, password },
        })
        onAuthenticated(data)
      }
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-brand">
        <SquackLogo />
        <div>
          <p className="eyebrow">Squack</p>
          <h1>Small posts, real conversations.</h1>
          <p>
            Create an account, sign in from another browser as a second user,
            then post, react, and message between both accounts.
          </p>
        </div>
      </section>

      <form className="auth-card" onSubmit={submit}>
        <div className="auth-tabs">
          <button
            className={mode === 'login' ? 'active' : ''}
            onClick={() => setMode('login')}
            type="button"
          >
            Sign in
          </button>
          <button
            className={mode === 'register' ? 'active' : ''}
            onClick={() => setMode('register')}
            type="button"
          >
            Register
          </button>
        </div>

        {mode === 'register' && (
          <label>
            Username
            <input
              autoComplete="username"
              onChange={(event) => setUsername(event.target.value)}
              required
              value={username}
            />
          </label>
        )}

        <label>
          Email
          <input
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>

        <label>
          Password
          <input
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            minLength={mode === 'register' ? 8 : 1}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>

        {error && <p className="error-banner">{error}</p>}

        <button className="primary-action" disabled={isSubmitting} type="submit">
          {isSubmitting
            ? 'Working...'
            : mode === 'login'
              ? 'Sign in'
              : 'Create account'}
        </button>
      </form>
    </main>
  )
}

function AppLoading() {
  return (
    <main className="auth-screen">
      <section className="auth-brand">
        <SquackLogo />
        <div>
          <p className="eyebrow">Squack</p>
          <h1>Loading your feed...</h1>
          <p>Connecting to the backend and restoring your session.</p>
        </div>
      </section>
    </main>
  )
}

function PostCard({
  post,
  viewerId,
  onReact,
  onUpdate,
  onDelete,
}: {
  post: Tweet
  viewerId: string
  onReact: (tweetId: string, kind: ReactionKind) => void
  onUpdate: (tweetId: string, content: string) => Promise<void>
  onDelete: (tweetId: string) => Promise<void>
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editDraft, setEditDraft] = useState(post.content)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isOwner = post.authorId === viewerId
  const trimmedEdit = editDraft.trim()
  const editRemaining = Math.max(0, 280 - editDraft.length)
  const wasEdited = post.updatedAt !== post.createdAt

  useEffect(() => {
    if (!isEditing) {
      setEditDraft(post.content)
    }
  }, [isEditing, post.content])

  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!trimmedEdit || trimmedEdit === post.content || isSaving) {
      return
    }

    setIsSaving(true)

    try {
      await onUpdate(post.id, trimmedEdit)
      setIsEditing(false)
    } catch {
      return
    } finally {
      setIsSaving(false)
    }
  }

  async function deletePost() {
    if (isDeleting || !window.confirm('Delete this squack?')) {
      return
    }

    setIsDeleting(true)

    try {
      await onDelete(post.id)
    } catch {
      setIsDeleting(false)
    }
  }

  return (
    <article className="post">
      <Avatar
        label={initials(post.author.username)}
        tone={toneFor(post.author.id)}
      />
      <div className="post-body">
        <div className="post-topline">
          <div>
            <strong>{post.author.username}</strong>
            <span>@{post.author.username}</span>
            <span>{formatTime(post.createdAt)}</span>
            {wasEdited && <span>Edited</span>}
          </div>
          {isOwner && !isEditing && (
            <div className="post-owner-actions">
              <button
                className="ghost-icon"
                onClick={() => setIsEditing(true)}
                type="button"
                aria-label="Edit post"
              >
                <Icon name="edit" />
              </button>
              <button
                className="ghost-icon post-delete-button"
                disabled={isDeleting}
                onClick={() => void deletePost()}
                type="button"
                aria-label="Delete post"
              >
                <Icon name="trash" />
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <form className="post-edit-form" onSubmit={submitEdit}>
            <textarea
              aria-label="Edit squack"
              autoFocus
              maxLength={280}
              onChange={(event) => setEditDraft(event.target.value)}
              value={editDraft}
            />
            <div className="post-edit-footer">
              <span>{editRemaining}</span>
              <div className="post-edit-actions">
                <button
                  className="text-link"
                  onClick={() => setIsEditing(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="send-button post-save-button"
                  disabled={!trimmedEdit || trimmedEdit === post.content || isSaving}
                  type="submit"
                >
                  {isSaving ? 'Saving' : 'Save'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <p>{post.content}</p>
        )}

        {!isEditing && (
          <div className="post-actions">
            <button
              type="button"
              aria-label="Like post"
              onClick={() => onReact(post.id, 'LIKE')}
            >
              <Icon name="heart" />
              <span>{post.reactionCount}</span>
            </button>
            <button type="button" aria-label="Views">
              <Icon name="chart" />
              <span>{post.reactionCounts.length}</span>
            </button>
          </div>
        )}
      </div>
    </article>
  )
}

function Composer({
  draft,
  onDraftChange,
  onPublish,
}: {
  draft: string
  onDraftChange: (value: string) => void
  onPublish: (event: FormEvent<HTMLFormElement>) => void
}) {
  const remaining = Math.max(0, 280 - draft.length)

  return (
    <form className="composer" onSubmit={onPublish}>
      <Avatar label="ME" tone="moss" size="large" />
      <div className="composer-body">
        <textarea
          aria-label="Write a new squack"
          maxLength={280}
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder="What is moving today?"
          value={draft}
        />
        <div className="composer-footer">
          <div className="composer-tools">
            <button type="button" aria-label="Attach image">
              <Icon name="image" />
            </button>
            <span>{remaining}</span>
          </div>
          <button className="send-button" disabled={!draft.trim()} type="submit">
            <Icon name="send" />
            <span>Post</span>
          </button>
        </div>
      </div>
    </form>
  )
}

function FeedList({
  posts,
  viewerId,
  onReact,
  onUpdate,
  onDelete,
  label = 'Timeline',
}: {
  posts: Tweet[]
  viewerId: string
  onReact: (tweetId: string, kind: ReactionKind) => void
  onUpdate: (tweetId: string, content: string) => Promise<void>
  onDelete: (tweetId: string) => Promise<void>
  label?: string
}) {
  if (!posts.length) {
    return (
      <EmptyState
        icon="message"
        title="No squacks yet"
        body="Create the first post, then sign in as another user to react to it."
      />
    )
  }

  return (
    <section className="feed-list" aria-label={label}>
      {posts.map((post) => (
        <PostCard
          post={post}
          key={post.id}
          viewerId={viewerId}
          onReact={onReact}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </section>
  )
}

function HomePage({
  posts,
  viewerId,
  draft,
  onDraftChange,
  onPublish,
  onReact,
  onUpdate,
  onDelete,
}: {
  posts: Tweet[]
  viewerId: string
  draft: string
  onDraftChange: (value: string) => void
  onPublish: (event: FormEvent<HTMLFormElement>) => void
  onReact: (tweetId: string, kind: ReactionKind) => void
  onUpdate: (tweetId: string, content: string) => Promise<void>
  onDelete: (tweetId: string) => Promise<void>
}) {
  return (
    <>
      <PageHeader meta={pageByPath['/']} />
      <Composer draft={draft} onDraftChange={onDraftChange} onPublish={onPublish} />
      <FeedList
        posts={posts}
        viewerId={viewerId}
        onReact={onReact}
        onUpdate={onUpdate}
        onDelete={onDelete}
        label="Following timeline"
      />
    </>
  )
}

function ExplorePage({
  users,
  posts,
  viewerId,
  followingIds,
  onFollow,
  onUnfollow,
  onUpdate,
  onDelete,
}: {
  users: User[]
  posts: Tweet[]
  viewerId: string
  followingIds: Set<string>
  onFollow: (id: string) => void
  onUnfollow: (id: string) => void
  onUpdate: (tweetId: string, content: string) => Promise<void>
  onDelete: (tweetId: string) => Promise<void>
}) {
  return (
    <>
      <PageHeader meta={pageByPath['/explore']} />
      <section className="page-stack">
        {users.length ? (
          users.map((user) => (
            <div className="list-row conversation-row" key={user.id}>
              <Avatar label={initials(user.username)} tone={toneFor(user.id)} />
              <div style={{ flex: 1 }}>
                <strong>{user.username}</strong>
                <p>{user.bio || 'Open a private conversation'}</p>
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                  <Link className="text-link" to={`/messages/${user.id}`}>
                    Message
                  </Link>
                  {followingIds.has(user.id) ? (
                    <button
                      className="text-link"
                      onClick={() => onUnfollow(user.id)}
                      style={{ color: 'var(--moss)' }}
                    >
                      Following
                    </button>
                  ) : (
                    <button className="text-link" onClick={() => onFollow(user.id)}>
                      Follow
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            icon="user"
            title="No other users yet"
            body="Register a second account in another browser or after logging out."
          />
        )}
      </section>
      <FeedList
        posts={posts}
        viewerId={viewerId}
        onReact={() => undefined}
        onUpdate={onUpdate}
        onDelete={onDelete}
        label="Explore timeline"
      />
    </>
  )
}

function AlertsPage({
  notifications,
  onMarkAsRead,
}: {
  notifications: Notification[]
  onMarkAsRead: () => void
}) {
  const unreadCount = notifications.filter((n) => !n.isRead).length

  useEffect(() => {
    if (unreadCount > 0) {
      onMarkAsRead()
    }
  }, [unreadCount, onMarkAsRead])

  return (
    <>
      <PageHeader meta={pageByPath['/alerts']} />
      <section className="page-stack">
        {notifications.length ? (
          notifications.map((n) => (
            <div className={`list-row ${n.isRead ? 'read' : 'unread'}`} key={n.id}>
              <span className="row-icon">
                <Icon
                  name={
                    n.type === 'FOLLOW' ? 'user' : n.type === 'MESSAGE' ? 'message' : 'send'
                  }
                />
              </span>
              <div>
                <p>{n.message}</p>
                <small>{formatTime(n.createdAt)}</small>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            icon="bell"
            title="No alerts yet"
            body="Follow people or wait for messages to see activity here."
          />
        )}
      </section>
    </>
  )
}

function MessagesPage({
  users,
  notifications,
}: {
  users: User[]
  notifications: Notification[]
}) {
  return (
    <>
      <PageHeader meta={pageByPath['/messages']} />
      <section className="page-stack">
        {users.length ? (
          users.map((user) => {
            const hasUnread = notifications.some(
              (n) =>
                n.type === 'MESSAGE' &&
                !n.isRead &&
                n.actorId === user.id,
            )
            return (
              <Link
                className={`list-row conversation-row ${hasUnread ? 'unread' : ''}`}
                key={user.id}
                to={`/messages/${user.id}`}
              >
                <Avatar label={initials(user.username)} tone={toneFor(user.id)} />
                <div>
                  <strong>{user.username}</strong>
                  <p style={hasUnread ? { fontWeight: 'bold', color: 'var(--ink)' } : {}}>
                    @{user.username} - {hasUnread ? 'New message received' : 'Start or continue the conversation'}
                  </p>
                </div>
                {hasUnread ? (
                  <span className="notification-badge" style={{ position: 'static' }}>
                    1
                  </span>
                ) : (
                  <small>Open</small>
                )}
              </Link>
            )
          })
        ) : (
          <EmptyState
            icon="message"
            title="No one to message yet"
            body="Create another account, then this page will show that user."
          />
        )}
      </section>
    </>
  )
}

function MessageThreadPage({
  users,
  viewer,
  token,
  notifications,
  onMarkAsRead,
  liveStatus,
}: {
  users: User[]
  viewer: User
  token: string
  notifications: Notification[]
  onMarkAsRead: (id: string) => void
  liveStatus: 'connecting' | 'live' | 'offline'
}) {
  const { userId } = useParams()
  const participant = users.find((user) => user.id === userId)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!participant) return

    const unreadMessageNotifications = notifications.filter(
      (n) =>
        n.type === 'MESSAGE' &&
        !n.isRead &&
        n.actorId === participant.id,
    )

    for (const n of unreadMessageNotifications) {
      onMarkAsRead(n.id)
    }
  }, [participant, notifications, onMarkAsRead])

  useEffect(() => {
    if (!participant) {
      return
    }

    let cancelled = false
    const participantId = participant.id

    async function loadConversation() {
      setIsLoading(true)
      setError('')

      try {
        const data = await graphqlRequest<{
          conversation: { nodes: Message[] }
        }>(CONVERSATION_QUERY, { withUserId: participantId }, token)

        if (!cancelled) {
          setMessages([...data.conversation.nodes].reverse())
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(getErrorMessage(loadError))
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadConversation()

    const handleMessage = (event: Event) => {
      const message = (event as CustomEvent<Message>).detail

      if (messageBelongsToThread(message, viewer.id, participantId)) {
        setMessages((current) => upsertMessage(current, message))
      }
    }

    const handleConfirmed = (event: Event) => {
      const message = (event as CustomEvent<Message>).detail

      if (messageBelongsToThread(message, viewer.id, participantId)) {
        setMessages((current) => upsertMessage(current, message))
      }
    }

    window.addEventListener('squack:message', handleMessage)
    window.addEventListener('squack:message:confirmed', handleConfirmed)

    return () => {
      cancelled = true
      window.removeEventListener('squack:message', handleMessage)
      window.removeEventListener('squack:message:confirmed', handleConfirmed)
    }
  }, [participant, token, viewer.id])

  if (!participant) {
    return <Navigate to="/messages" replace />
  }

  const activeParticipant = participant

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const content = draft.trim()

    if (!content) {
      return
    }

    try {
      const data = await graphqlRequest<{ sendMessage: Message }>(
        SEND_MESSAGE_MUTATION,
        { input: { receiverId: activeParticipant.id, content } },
        token,
      )
      setMessages((currentMessages) =>
        upsertMessage(currentMessages, data.sendMessage),
      )
      setDraft('')
      setError('')
    } catch (sendError) {
      setError(getErrorMessage(sendError))
    }
  }

  return (
    <>
      <PageHeader
        meta={{
          ...pageByPath['/messages'],
          eyebrow: `@${activeParticipant.username}`,
          title: activeParticipant.username,
        }}
        action={
          <div className="thread-actions">
            <span className={`live-pill live-${liveStatus}`}>
              {liveStatus === 'live'
                ? 'Live'
                : liveStatus === 'connecting'
                  ? 'Connecting'
                  : 'Offline'}
            </span>
            <Link className="text-link" to="/messages">
              Back
            </Link>
          </div>
        }
      />

      <section className="thread-intro">
        <Avatar
          label={initials(activeParticipant.username)}
          tone={toneFor(activeParticipant.id)}
          size="large"
        />
        <div>
          <strong>{activeParticipant.username}</strong>
          <p>@{activeParticipant.username}</p>
        </div>
      </section>

      {error && <p className="error-banner inline-error">{error}</p>}

      <section
        className="message-thread"
        aria-label={`Conversation with ${activeParticipant.username}`}
      >
        {isLoading ? (
          <p className="muted-text">Loading conversation...</p>
        ) : messages.length ? (
          messages.map((message) => (
            <div
              className={
                message.senderId === viewer.id
                  ? 'message-bubble mine'
                  : 'message-bubble'
              }
              key={message.id}
            >
              <p>{message.content}</p>
              <span>{formatTime(message.createdAt)}</span>
            </div>
          ))
        ) : (
          <p className="muted-text">No messages yet. Send the first one.</p>
        )}
      </section>

      <form className="message-composer" onSubmit={sendMessage}>
        <input
          aria-label={`Message ${activeParticipant.username}`}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={`Message ${activeParticipant.username}`}
          value={draft}
        />
        <button className="send-button" disabled={!draft.trim()} type="submit">
          <Icon name="send" />
          <span>Send</span>
        </button>
      </form>
    </>
  )
}

function BookmarksPage() {
  return (
    <>
      <PageHeader meta={pageByPath['/bookmarks']} />
      <EmptyState
        icon="bookmark"
        title="Bookmarks are not connected yet"
        body="The backend has tweets and reactions now. Bookmark storage can be added next."
      />
    </>
  )
}

function ProfilePage({
  viewer,
  posts,
  onReact,
  onUpdate,
  onDelete,
}: {
  viewer: User
  posts: Tweet[]
  onReact: (tweetId: string, kind: ReactionKind) => void
  onUpdate: (tweetId: string, content: string) => Promise<void>
  onDelete: (tweetId: string) => Promise<void>
}) {
  const ownPosts = posts.filter((post) => post.authorId === viewer.id)

  return (
    <>
      <PageHeader
        meta={{
          ...pageByPath['/profile'],
          title: viewer.username,
          documentTitle: `${viewer.username} - Squack`,
        }}
      />
      <section className="profile-page-cover">
        <div className="profile-cover"></div>
        <div className="profile-page-details">
          <Avatar label={initials(viewer.username)} tone="moss" size="large" />
        </div>
        <h2>{viewer.username}</h2>
        <p>@{viewer.username}</p>
        <p className="profile-bio">
          {viewer.bio || 'This profile is connected to the backend account.'}
        </p>
      </section>
      <FeedList
        posts={ownPosts}
        viewerId={viewer.id}
        onReact={onReact}
        onUpdate={onUpdate}
        onDelete={onDelete}
        label="Profile posts"
      />
    </>
  )
}

function SettingsPage({ onLogout }: { onLogout: () => void }) {
  return (
    <>
      <PageHeader meta={pageByPath['/settings']} />
      <section className="page-stack">
        <article className="settings-row">
          <div>
            <strong>Session</strong>
            <p>Sign out so you can register or use another Squack account.</p>
          </div>
          <button onClick={onLogout} type="button">
            Log out
          </button>
        </article>
      </section>
    </>
  )
}

function Sidebar({
  viewer,
  onLogout,
  notifications,
}: {
  viewer: User
  onLogout: () => void
  notifications: Notification[]
}) {
  const messageUnreadCount = notifications.filter((n) => n.type === 'MESSAGE' && !n.isRead).length
  const otherUnreadCount = notifications.filter((n) => n.type !== 'MESSAGE' && !n.isRead).length

  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <Link className="brand" to="/" aria-label="Squack home">
        <SquackLogo />
        <span>
          <strong>Squack</strong>
          <small>social workspace</small>
        </span>
      </Link>

      <nav className="nav-list">
        {navigation.map((item) => (
          <NavLink
            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
            end={item.path === '/'}
            key={item.path}
            to={item.path}
          >
            <div className="nav-icon-container">
              <Icon name={item.icon} />
              {item.path === '/alerts' && otherUnreadCount > 0 && (
                <span className="notification-badge">{otherUnreadCount}</span>
              )}
              {item.path === '/messages' && messageUnreadCount > 0 && (
                <span className="notification-badge">{messageUnreadCount}</span>
              )}
            </div>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <Link className="primary-action" to="/">
        <Icon name="plus" />
        <span>New squack</span>
      </Link>

      <Link className="account-chip" to="/profile">
        <Avatar label={initials(viewer.username)} tone="moss" />
        <span>
          <strong>{viewer.username}</strong>
          <small>@{viewer.username}</small>
        </span>
      </Link>

      <button className="logout-button" onClick={onLogout} type="button">
        Log out
      </button>
    </aside>
  )
}

function RightRail({
  users,
  posts,
  followingIds,
  onFollow,
  onUnfollow,
}: {
  users: User[]
  posts: Tweet[]
  followingIds: Set<string>
  onFollow: (id: string) => void
  onUnfollow: (id: string) => void
}) {
  const reactionCount = posts.reduce((total, post) => total + post.reactionCount, 0)

  return (
    <aside className="right-rail" aria-label="Sidebar">
      <div className="search-box">
        <Icon name="search" />
        <input aria-label="Search Squack" placeholder="Search Squack" />
      </div>

      <section className="rail-panel profile-panel">
        <div className="profile-cover"></div>
        <Avatar label="SQ" tone="brick" size="large" />
        <h2>Squack Live</h2>
        <p>Real accounts, posts, reactions, and messages from your backend.</p>
        <div className="profile-stats">
          <span>
            <strong>{posts.length}</strong>
            <small>posts</small>
          </span>
          <span>
            <strong>{reactionCount}</strong>
            <small>reactions</small>
          </span>
        </div>
      </section>

      <section className="rail-panel">
        <div className="panel-title">
          <h2>People</h2>
          <Link to="/explore">See all</Link>
        </div>
        <div className="people-list">
          {users.map((user) => (
            <div className="person" key={user.id}>
              <Avatar label={initials(user.username)} tone={toneFor(user.id)} />
              <span>
                <strong>{user.username}</strong>
                <small>@{user.username}</small>
              </span>
              {followingIds.has(user.id) ? (
                <button
                  className="text-link"
                  onClick={() => onUnfollow(user.id)}
                  style={{ color: 'var(--moss)' }}
                >
                  Unfollow
                </button>
              ) : (
                <button className="text-link" onClick={() => onFollow(user.id)}>
                  Follow
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </aside>
  )
}

function MobileNav() {
  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {navigation.slice(0, 5).map((item) => (
        <NavLink
          className={({ isActive }) => (isActive ? 'active' : '')}
          end={item.path === '/'}
          key={`mobile-${item.path}`}
          to={item.path}
          aria-label={item.label}
        >
          <Icon name={item.icon} />
        </NavLink>
      ))}
    </nav>
  )
}

function SquackApp() {
  const navigate = useNavigate()
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) ?? '')
  const [viewer, setViewer] = useState<User | null>(null)
  const [posts, setPosts] = useState<Tweet[]>([])
  const [feedPosts, setFeedPosts] = useState<Tweet[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)))
  const [messageSocketStatus, setMessageSocketStatus] = useState<
    'connecting' | 'live' | 'offline'
  >(() => localStorage.getItem(TOKEN_KEY) ? 'connecting' : 'offline')

  const removeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(
    (title: string, message: string, type: NotificationType, onClick?: () => void) => {
      const id = Math.random().toString(36).substring(7)
      setToasts((current) => [...current, { id, title, message, type, onClick }])
      setTimeout(() => removeToast(id), 6000)
    },
    [removeToast],
  )

  const appReady = Boolean(viewer)

  async function loadAppData(activeToken: string, userId: string) {
    const [tweetData, feedData, userData, followingData, notificationData] = await Promise.all([
      graphqlRequest<{ tweets: { nodes: Tweet[] } }>(TWEETS_QUERY, {}, activeToken),
      graphqlRequest<{ feed: { nodes: Tweet[] } }>(FEED_QUERY, {}, activeToken),
      graphqlRequest<{ users: User[] }>(USERS_QUERY, {}, activeToken),
      graphqlRequest<{ following: { id: string }[] }>(FOLLOWING_QUERY, { userId }, activeToken),
      graphqlRequest<{ notifications: Notification[] }>(NOTIFICATIONS_QUERY, {}, activeToken),
    ])

    setPosts(tweetData.tweets.nodes)
    setFeedPosts(feedData.feed.nodes)
    setUsers(userData.users)
    setFollowingIds(new Set(followingData.following.map((user) => user.id)))
    setNotifications(notificationData.notifications)
  }

  useEffect(() => {
    if (!token) {
      return
    }

    let cancelled = false
    const activeToken = token

    async function restoreSession() {
      setIsLoading(true)
      setError('')

      try {
        const me = await authRequest<User>('/auth/me', { token: activeToken })

        if (cancelled) {
          return
        }

        setViewer(me)
        await loadAppData(activeToken, me.id)
      } catch (restoreError) {
        if (!cancelled) {
          console.error('Session restoration failed:', restoreError)
          localStorage.removeItem(TOKEN_KEY)
          setToken('')
          setViewer(null)
          setPosts([])
          setFeedPosts([])
          setUsers([])
          setFollowingIds(new Set())
          setNotifications([])
          setMessageSocketStatus('offline')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    restoreSession()

    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    if (!token || !viewer) return

    const baseUrl = API_URL
    const options = {
      auth: { token },
      transports: ['websocket'],
    }

    const mSocket: Socket = io(`${baseUrl}/messages`, options)
    const nSocket: Socket = io(`${baseUrl}/notifications`, options)

    mSocket.on('connect', () => setMessageSocketStatus('live'))
    mSocket.on('disconnect', () => setMessageSocketStatus('offline'))
    mSocket.on('connect_error', () => setMessageSocketStatus('offline'))

    mSocket.on('message.received', (message: Message) => {
      window.dispatchEvent(new CustomEvent('squack:message', { detail: message }))
      addToast(
        `Message from @${message.sender.username}`,
        message.content,
        'MESSAGE',
        () => navigate(`/messages/${message.senderId}`),
      )
    })

    mSocket.on('message.sent.confirmed', (message: Message) => {
      window.dispatchEvent(
        new CustomEvent('squack:message:confirmed', { detail: message }),
      )
    })

    nSocket.on('notification.received', (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev])
      if (notification.type !== 'MESSAGE') {
        addToast('Notification', notification.message, notification.type, () =>
          navigate('/alerts'),
        )
      }
    })

    return () => {
      setMessageSocketStatus('offline')
      mSocket.disconnect()
      nSocket.disconnect()
    }
  }, [token, viewer, navigate, addToast])

  function handleAuthenticated(payload: AuthPayload) {
    localStorage.setItem(TOKEN_KEY, payload.accessToken)
    setToken(payload.accessToken)
    setViewer(payload.user)
    setMessageSocketStatus('connecting')
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    setToken('')
    setViewer(null)
    setPosts([])
    setFeedPosts([])
    setUsers([])
    setFollowingIds(new Set())
    setNotifications([])
    setMessageSocketStatus('offline')
  }

  async function publishPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const content = draft.trim()

    if (!content || !token) {
      return
    }

    try {
      const data = await graphqlRequest<{ createTweet: Tweet }>(
        CREATE_TWEET_MUTATION,
        { input: { content } },
        token,
      )
      setPosts((currentPosts) => [data.createTweet, ...currentPosts])
      setFeedPosts((currentFeed) => [data.createTweet, ...currentFeed])
      setDraft('')
      setError('')
    } catch (publishError) {
      setError(getErrorMessage(publishError))
    }
  }

  async function reactToPost(tweetId: string, kind: ReactionKind) {
    if (!token) {
      return
    }

    try {
      const data = await graphqlRequest<{ reactToTweet: Tweet }>(
        REACT_TO_TWEET_MUTATION,
        { input: { tweetId, kind } },
        token,
      )
      const update = (currentPosts: Tweet[]) =>
        currentPosts.map((post) => (post.id === tweetId ? data.reactToTweet : post))

      setPosts(update)
      setFeedPosts(update)
      setError('')
    } catch (reactionError) {
      setError(getErrorMessage(reactionError))
    }
  }

  async function updatePost(tweetId: string, content: string) {
    if (!token) {
      return
    }

    try {
      const data = await graphqlRequest<{ updateTweet: Tweet }>(
        UPDATE_TWEET_MUTATION,
        { input: { id: tweetId, content } },
        token,
      )
      const update = (currentPosts: Tweet[]) =>
        currentPosts.map((post) =>
          post.id === tweetId ? data.updateTweet : post,
        )

      setPosts(update)
      setFeedPosts(update)
      setError('')
    } catch (updateError) {
      setError(getErrorMessage(updateError))
      throw updateError
    }
  }

  async function deletePost(tweetId: string) {
    if (!token) {
      return
    }

    try {
      const data = await graphqlRequest<{ deleteTweet: boolean }>(
        DELETE_TWEET_MUTATION,
        { id: tweetId },
        token,
      )

      if (!data.deleteTweet) {
        throw new Error('Tweet was not deleted')
      }

      const remove = (currentPosts: Tweet[]) =>
        currentPosts.filter((post) => post.id !== tweetId)

      setPosts(remove)
      setFeedPosts(remove)
      setError('')
    } catch (deleteError) {
      setError(getErrorMessage(deleteError))
      throw deleteError
    }
  }

  async function followUser(userId: string) {
    if (!token) return
    try {
      await graphqlRequest(FOLLOW_MUTATION, { userId }, token)
      setFollowingIds((current) => {
        const next = new Set(current)
        next.add(userId)
        return next
      })
      // Refresh feed
      const feedData = await graphqlRequest<{ feed: { nodes: Tweet[] } }>(
        FEED_QUERY,
        {},
        token,
      )
      setFeedPosts(feedData.feed.nodes)
    } catch (e) {
      setError(getErrorMessage(e))
    }
  }

  async function unfollowUser(userId: string) {
    if (!token) return
    try {
      await graphqlRequest(UNFOLLOW_MUTATION, { userId }, token)
      setFollowingIds((current) => {
        const next = new Set(current)
        next.delete(userId)
        return next
      })
      // Refresh feed
      const feedData = await graphqlRequest<{ feed: { nodes: Tweet[] } }>(
        FEED_QUERY,
        {},
        token,
      )
      setFeedPosts(feedData.feed.nodes)
    } catch (e) {
      setError(getErrorMessage(e))
    }
  }

  const markNotificationsAsRead = useCallback(async () => {
    if (!token) return

    try {
      await graphqlRequest(MARK_NOTIFICATIONS_AS_READ_MUTATION, {}, token)
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, isRead: true })),
      )
    } catch (markError) {
      setError(getErrorMessage(markError))
    }
  }, [token])

  const markNotificationAsRead = useCallback(
    async (id: string) => {
      if (!token) return

      try {
        await graphqlRequest(MARK_NOTIFICATION_AS_READ_MUTATION, { id }, token)
        setNotifications((current) =>
          current.map((notification) =>
            notification.id === id
              ? { ...notification, isRead: true }
              : notification,
          ),
        )
      } catch (markError) {
        setError(getErrorMessage(markError))
      }
    },
    [token],
  )

  const profileTitle = useMemo(
    () => (viewer ? `${viewer.username} - Squack` : 'Profile - Squack'),
    [viewer],
  )

  useEffect(() => {
    if (viewer) {
      pageByPath['/profile'].title = viewer.username
      pageByPath['/profile'].documentTitle = profileTitle
    }
  }, [profileTitle, viewer])

  if (isLoading && !appReady) {
    return <AppLoading />
  }

  if (!token || !viewer) {
    return <AuthPage onAuthenticated={handleAuthenticated} />
  }

  return (
    <div className="app-shell">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <TitleManager users={users} />
      <Sidebar viewer={viewer} onLogout={logout} notifications={notifications} />

      <main className="feed-column">
        {error && <p className="error-banner inline-error">{error}</p>}
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                posts={feedPosts}
                viewerId={viewer.id}
                draft={draft}
                onDraftChange={setDraft}
                onPublish={publishPost}
                onReact={reactToPost}
                onUpdate={updatePost}
                onDelete={deletePost}
              />
            }
          />
          <Route
            path="/explore"
            element={
              <ExplorePage
                users={users.filter((u) => u.id !== viewer.id)}
                posts={posts}
                viewerId={viewer.id}
                followingIds={followingIds}
                onFollow={followUser}
                onUnfollow={unfollowUser}
                onUpdate={updatePost}
                onDelete={deletePost}
              />
            }
          />
          <Route
            path="/alerts"
            element={
              <AlertsPage
                notifications={notifications}
                onMarkAsRead={markNotificationsAsRead}
              />
            }
          />
          <Route
            path="/messages"
            element={
              <MessagesPage
                users={users.filter((u) => u.id !== viewer.id)}
                notifications={notifications}
              />
            }
          />
          <Route
           path="/messages/:userId"
           element={
             <MessageThreadPage
               users={users.filter((u) => u.id !== viewer.id)}
               viewer={viewer}
               token={token}
               notifications={notifications}
               onMarkAsRead={markNotificationAsRead}
               liveStatus={messageSocketStatus}
             />
           }
          />

          <Route path="/bookmarks" element={<BookmarksPage />} />
          <Route
            path="/profile"
            element={
              <ProfilePage
                viewer={viewer}
                posts={posts}
                onReact={reactToPost}
                onUpdate={updatePost}
                onDelete={deletePost}
              />
            }
          />
          <Route path="/settings" element={<SettingsPage onLogout={logout} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <RightRail
        users={users.filter((u) => u.id !== viewer.id)}
        posts={posts}
        followingIds={followingIds}
        onFollow={followUser}
        onUnfollow={unfollowUser}
      />
      <MobileNav />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <SquackApp />
    </BrowserRouter>
  )
}

export default App
