// Фейковые данные рейтинга и друзей для прототипа.

import type { Friend, LeaderboardEntry } from '@/types/game'

const NAMES = ['Ruslan', 'Olga', 'Max', 'Dima', 'Kate', 'Ivan', 'Anna', 'Petro', 'Lena', 'Oleg']

export function mockLeaderboard(myName: string, myValue: number): LeaderboardEntry[] {
  const list: LeaderboardEntry[] = NAMES.map((name, i) => ({
    rank: 0,
    name,
    farmValue: Math.round(250_000 / (i + 1)),
  }))
  list.push({ rank: 0, name: myName, farmValue: myValue, isMe: true })
  list.sort((a, b) => b.farmValue - a.farmValue)
  return list.map((e, i) => ({ ...e, rank: i + 1 }))
}

export function mockFriends(): Friend[] {
  return [
    { id: 'f1', name: 'Olga', active: true },
    { id: 'f2', name: 'Max', active: true },
    { id: 'f3', name: 'Dima', active: false },
  ]
}
