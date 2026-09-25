// BIRDEX API (Cloudflare Worker + D1).
// Всё под /api/* обрабатывает этот код, остальное — статические файлы игры.
//
// Авторизация: каждый запрос несёт заголовок  Authorization: tma <initData>
// initData подписана Telegram — сервер проверяет подпись токеном бота (секрет BOT_TOKEN).
//
//   POST /api/auth         — вход; создаёт игрока, записывает реферала (startapp=ref_<id>)
//   GET  /api/state        — сохранённый прогресс
//   PUT  /api/state        — сохранить прогресс
//   GET  /api/leaderboard?by=coins|play — топ-50 по монетам / по рекорду в Play + моё место
//   GET  /api/friends      — кого я пригласил + сколько 12% накопилось
//   POST /api/ref/claim    — забрать накопленные 12%

import { verifyInitData, type TgAuth } from './telegramAuth'
import { ensureSchema, type D1Database, type UserRow } from './db'

interface Env {
  DB: D1Database
  BOT_TOKEN: string
  ASSETS: { fetch(req: Request): Promise<Response> }
}

/** Максимальный размер сохранения (защита от мусора). */
const MAX_STATE_BYTES = 64 * 1024
/** Друг считается активным, когда дорос до этого уровня. */
const ACTIVE_FRIEND_LEVEL = 2
/** Доля с продажи яиц друга, которая идёт пригласившему. */
const REF_SHARE = 0.12

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } })

const fail = (code: string, status = 400) => json({ error: code }, status)

function displayName(u: { first_name: string; username?: string | null }): string {
  return (u.first_name || u.username || 'Фермер').slice(0, 32)
}

async function auth(req: Request, env: Env): Promise<TgAuth | null> {
  const h = req.headers.get('authorization') ?? ''
  if (!h.startsWith('tma ')) return null
  return verifyInitData(h.slice(4), env.BOT_TOKEN)
}

function parseRef(startParam: string | null, selfId: number): number | null {
  const m = /^ref_(\d{1,20})$/.exec(startParam ?? '')
  if (!m) return null
  const id = Number(m[1])
  return Number.isSafeInteger(id) && id !== selfId ? id : null
}

async function handleAuth(a: TgAuth, env: Env): Promise<Response> {
  const now = Date.now()
  const u = a.user
  const existing = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(u.id).first<UserRow>()
  if (existing) {
    await env.DB.prepare('UPDATE users SET username = ?, first_name = ?, updated_at = ? WHERE id = ?')
      .bind(u.username ?? null, displayName(u), now, u.id)
      .run()
  } else {
    // Реферал записывается только при ПЕРВОМ входе и только если пригласивший существует.
    let refBy = parseRef(a.startParam, u.id)
    if (refBy) {
      const inviter = await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(refBy).first()
      if (!inviter) refBy = null
    }
    await env.DB.prepare(
      'INSERT INTO users (id, username, first_name, referred_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    )
      .bind(u.id, u.username ?? null, displayName(u), refBy, now, now)
      .run()
  }
  const row = await env.DB.prepare('SELECT state FROM users WHERE id = ?').bind(u.id).first<{ state: string | null }>()
  return json({
    user: { id: String(u.id), name: displayName(u) },
    state: row?.state ? JSON.parse(row.state) : null,
  })
}

interface SavedState {
  profile?: { farmName?: string; level?: number; xp?: number; avatar?: string }
  balance?: { coins?: number }
  chickens?: unknown[]
  stats?: { soldCoins?: number; bestPlay?: number }
}

/** Целое неотрицательное число из сохранения (мусор → 0). */
const num = (v: unknown, max = 1e15) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)))

async function handleSave(a: TgAuth, req: Request, env: Env): Promise<Response> {
  const text = await req.text()
  if (text.length > MAX_STATE_BYTES) return fail('TOO_LARGE', 413)
  let state: SavedState
  try {
    state = JSON.parse(text) as SavedState
  } catch {
    return fail('BAD_JSON')
  }
  // ⚠️ Экономика пока считается в игре — сервер только хранит и базово проверяет.
  const level = Math.max(1, Math.min(50, num(state.profile?.level) || 1))
  const xp = num(state.profile?.xp)
  const coins = num(state.balance?.coins)
  const chickens = Array.isArray(state.chickens) ? Math.min(36, state.chickens.length) : 1
  const farmName = String(state.profile?.farmName ?? '').slice(0, 24) || null
  const avatar = /^[a-z0-9_]{1,24}$/.test(String(state.profile?.avatar ?? '')) ? String(state.profile!.avatar) : null
  const bestPlay = num(state.stats?.bestPlay)

  // Два сохранения могут прийти одновременно: обновляем только если sold_total не изменился
  // с момента чтения (иначе перечитываем) — так 12% не начислятся дважды.
  for (let attempt = 0; attempt < 3; attempt++) {
    const me = await env.DB.prepare('SELECT sold_total, referred_by FROM users WHERE id = ?')
      .bind(a.user.id)
      .first<Pick<UserRow, 'sold_total' | 'referred_by'>>()
    if (!me) return fail('NO_USER', 404)
    // Продажи считаем по максимуму: если сохранение "откатилось", повторно не начисляем.
    const sold = Math.max(me.sold_total, num(state.stats?.soldCoins))
    const refBonus = me.referred_by ? Math.floor(sold * REF_SHARE) - Math.floor(me.sold_total * REF_SHARE) : 0
    const res = (await env.DB.prepare(
      `UPDATE users SET state = ?, level = ?, xp = ?, coins = ?, chickens = ?, farm_name = ?, avatar = ?,
         best_play = MAX(best_play, ?), sold_total = ?, ref_given = ref_given + ?, updated_at = ?
       WHERE id = ? AND sold_total = ?`,
    )
      .bind(text, level, xp, coins, chickens, farmName, avatar, bestPlay, sold, refBonus, Date.now(), a.user.id, me.sold_total)
      .run()) as { meta?: { changes?: number } }
    if (res?.meta?.changes === 0) continue
    // 12% с продажи яиц друга — пригласившему, он забирает кнопкой в "Друзьях".
    if (me.referred_by && refBonus > 0) {
      await env.DB.prepare('UPDATE users SET ref_pending = ref_pending + ?, ref_total = ref_total + ? WHERE id = ?')
        .bind(refBonus, refBonus, me.referred_by)
        .run()
    }
    return json({ ok: true })
  }
  return fail('BUSY', 409)
}

/** Рейтинг: by=coins — у кого больше монет, by=play — рекорд яиц за одну игру. */
async function handleLeaderboard(a: TgAuth, env: Env, by: string): Promise<Response> {
  const col = by === 'play' ? 'best_play' : 'coins'
  const top = await env.DB.prepare(
    `SELECT id, first_name, farm_name, level, avatar, ${col} AS value FROM users
     WHERE ${col} > 0 ORDER BY ${col} DESC, created_at ASC LIMIT 50`,
  ).all<Pick<UserRow, 'id' | 'first_name' | 'farm_name' | 'level' | 'avatar'> & { value: number }>()
  const me = await env.DB.prepare(`SELECT ${col} AS value, created_at FROM users WHERE id = ?`)
    .bind(a.user.id)
    .first<{ value: number; created_at: number }>()
  const rank = me && me.value > 0
    ? ((await env.DB.prepare(`SELECT COUNT(*) AS n FROM users WHERE ${col} > ? OR (${col} = ? AND created_at < ?)`)
        .bind(me.value, me.value, me.created_at)
        .first<{ n: number }>())?.n ?? 0) + 1
    : null
  return json({
    top: top.results.map((r, i) => ({
      rank: i + 1,
      name: r.first_name,
      farmName: r.farm_name,
      level: r.level,
      avatar: r.avatar,
      value: r.value,
      isMe: r.id === a.user.id,
    })),
    me: me && rank ? { rank, value: me.value } : null,
  })
}

async function handleFriends(a: TgAuth, env: Env): Promise<Response> {
  const rows = await env.DB.prepare(
    `SELECT id, first_name, farm_name, level, coins, avatar, ref_given FROM users
     WHERE referred_by = ? ORDER BY ref_given DESC, created_at DESC LIMIT 200`,
  )
    .bind(a.user.id)
    .all<Pick<UserRow, 'id' | 'first_name' | 'farm_name' | 'level' | 'coins' | 'avatar' | 'ref_given'>>()
  const me = await env.DB.prepare('SELECT ref_pending, ref_total FROM users WHERE id = ?')
    .bind(a.user.id)
    .first<Pick<UserRow, 'ref_pending' | 'ref_total'>>()
  return json({
    friends: rows.results.map((r) => ({
      id: String(r.id),
      name: r.first_name,
      farmName: r.farm_name,
      level: r.level,
      coins: r.coins,
      avatar: r.avatar,
      earned: r.ref_given,
      active: r.level >= ACTIVE_FRIEND_LEVEL,
    })),
    pending: me?.ref_pending ?? 0,
    total: me?.ref_total ?? 0,
  })
}

/** Забрать накопленные 12% с друзей. Списываем ровно то, что отдали (новое не теряется). */
async function handleRefClaim(a: TgAuth, env: Env): Promise<Response> {
  const me = await env.DB.prepare('SELECT ref_pending FROM users WHERE id = ?')
    .bind(a.user.id)
    .first<Pick<UserRow, 'ref_pending'>>()
  const coins = me?.ref_pending ?? 0
  if (coins > 0) {
    await env.DB.prepare('UPDATE users SET ref_pending = ref_pending - ? WHERE id = ? AND ref_pending >= ?')
      .bind(coins, a.user.id, coins)
      .run()
  }
  return json({ coins })
}

async function handleApi(req: Request, env: Env, path: string): Promise<Response> {
  if (!env.DB) return fail('NO_DB', 503)
  if (!env.BOT_TOKEN) return fail('NO_BOT_TOKEN', 503)
  const a = await auth(req, env)
  if (!a) return fail('UNAUTHORIZED', 401)
  await ensureSchema(env.DB)
  const m = req.method
  if (path === '/api/auth' && m === 'POST') return handleAuth(a, env)
  if (path === '/api/state' && m === 'PUT') return handleSave(a, req, env)
  if (path === '/api/leaderboard' && m === 'GET') return handleLeaderboard(a, env, new URL(req.url).searchParams.get('by') ?? 'coins')
  if (path === '/api/friends' && m === 'GET') return handleFriends(a, env)
  if (path === '/api/ref/claim' && m === 'POST') return handleRefClaim(a, env)
  return fail('NOT_FOUND', 404)
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url)
    if (url.pathname.startsWith('/api/')) {
      try {
        return await handleApi(req, env, url.pathname)
      } catch (e) {
        console.error(e)
        return fail('SERVER_ERROR', 500)
      }
    }
    return env.ASSETS.fetch(req)
  },
}
