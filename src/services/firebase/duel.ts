import { get, onValue, push, ref, remove, serverTimestamp, set, update, type Unsubscribe } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { getDb } from './client';
import { getRtdb } from './rtdb';

/**
 * Duel Kilat Hitung 1 lawan 1 antar teman, lewat Realtime Database (tanpa Cloud Functions).
 * Bentuk data mengikuti firebase/database.rules.json: rooms/{id}/{meta,allowed,players,state,questions,answers,results}
 * dan notifications/{uid}/{id} untuk undangan. Soal TIDAK menyimpan kunci jawaban; klien menghitung jawaban benar
 * dari soalnya (hitungan sederhana). Jawaban tercatat sekali dengan cap waktu server, jadi skor dihitung dari data itu.
 */
export const DUEL_GAME_ID = 'kilat-duel';
export const DUEL_TOTAL = 10;
export const DUEL_LIMIT = 12; // detik per soal (duel hitung)
export const DUEL_PACK_LIMIT = 20; // detik per soal (duel dari paket kuis: soal teks perlu waktu baca)
export type DuelKind = 'hitung' | 'paket';
/** Paket kuis untuk duel: hanya id, versi, dan urutan indeks soal yang disimpan. Kunci jawaban TIDAK ada di database. */
export interface DuelPack {
  packId: string;
  version: number;
  order: number[];
}

export interface DuelPlayer {
  name: string;
  avatarId: string;
}
export interface DuelQuestion {
  prompt: string;
  options: string[];
}
export interface DuelAnswer {
  choice: number;
  at: number;
}
export type DuelPhase = 'lobby' | 'question' | 'reveal' | 'finished';
export interface DuelRoom {
  kind: DuelKind;
  pack: DuelPack | null;
  hostUid: string;
  status: 'lobby' | 'playing' | 'finished';
  players: Record<string, DuelPlayer>;
  phase: DuelPhase;
  index: number;
  startedAt: number;
  questions: (DuelQuestion | null)[];
  /** answers[soal][uid] */
  answers: Record<string, DuelAnswer>[];
}
export interface DuelInvite {
  id: string;
  from: string;
  roomId: string;
  expiresAt: number;
  /** Ada bila ajakan untuk duel dari paket kuis. */
  packId?: string;
}

/** Selisih jam server dan jam perangkat (ms). Dipakai agar hitung mundur sama di kedua pemain. */
let offsetPromise: Promise<number> | null = null;
export function serverOffset(): Promise<number> {
  offsetPromise ??= new Promise<number>((resolve) => {
    onValue(ref(getRtdb(), '.info/serverTimeOffset'), (s) => resolve(Number(s.val()) || 0), () => resolve(0), { onlyOnce: true });
  });
  return offsetPromise;
}

/** Izin orang tua (dokumen anak di Firestore). Ditegakkan di klien: RTDB tidak bisa membaca Firestore. */
export async function multiplayerFlags(parentUid: string, childUid: string): Promise<{ friends: boolean; multiplayer: boolean }> {
  const snap = await getDoc(doc(getDb(), 'parent_accounts', parentUid, 'children', childUid));
  const d = snap.exists() ? snap.data() : {};
  return { friends: d.friendsEnabled === true, multiplayer: d.multiplayerEnabled === true };
}

// ───────── Undangan ─────────

export function subscribeInvites(me: string, cb: (list: DuelInvite[]) => void): Unsubscribe {
  return onValue(
    ref(getRtdb(), `notifications/${me}`),
    (snap) => {
      const val = (snap.val() ?? {}) as Record<string, Record<string, unknown>>;
      const list: DuelInvite[] = [];
      for (const [id, v] of Object.entries(val)) {
        if (v && v.type === 'game_invite' && v.gameId === DUEL_GAME_ID && typeof v.from === 'string' && typeof v.roomId === 'string' && typeof v.expiresAt === 'number') {
          list.push({ id, from: v.from, roomId: v.roomId, expiresAt: v.expiresAt, ...(typeof v.packId === 'string' ? { packId: v.packId } : {}) });
        }
      }
      cb(list.sort((a, b) => b.expiresAt - a.expiresAt));
    },
    () => cb([]),
  );
}

/** Buat ruang, izinkan satu teman, masukkan diri sebagai pemain, lalu kirim undangan. Mengembalikan id ruang. */
export async function inviteFriend(me: string, myName: string, myAvatar: string, friendUid: string, pack?: DuelPack): Promise<string> {
  const rtdb = getRtdb();
  const roomId = push(ref(rtdb, 'rooms')).key;
  const nid = push(ref(rtdb, `notifications/${friendUid}`)).key;
  if (!roomId || !nid) throw new Error('ROOM_ID');
  const base = `rooms/${roomId}`;
  await cleanupMyDuel(me).catch(() => undefined); // buang ruang lama milikku (maks. satu ruang per tuan rumah)
  // Urutan berurutan (bukan satu update) karena aturan "allowed" dan "players" membaca meta yang sudah ada.
  const meta: Record<string, unknown> = { hostUid: me, gameId: DUEL_GAME_ID, type: 'friend', status: 'lobby', maxPlayers: 2, createdAt: Date.now(), kind: pack ? 'paket' : 'hitung' };
  if (pack) Object.assign(meta, { packId: pack.packId, ver: pack.version, order: pack.order });
  await set(ref(rtdb, `${base}/meta`), meta);
  await set(ref(rtdb, `duel_active/${me}`), roomId); // penunjuk agar ruang yang ditinggalkan bisa dibersihkan nanti
  await set(ref(rtdb, `${base}/allowed/${friendUid}`), true);
  await set(ref(rtdb, `${base}/players/${me}`), { name: myName.slice(0, 30) || 'Pemain', avatarId: myAvatar.slice(0, 30) || 'bintang', ready: true });
  const offset = await serverOffset();
  try {
    await set(ref(rtdb, `notifications/${friendUid}/${nid}`), {
      type: 'game_invite',
      from: me,
      roomId,
      gameId: DUEL_GAME_ID,
      createdAt: serverTimestamp(),
      expiresAt: Date.now() + offset + 240000, // aturan: maksimal 5 menit dari waktu server
      ...(pack ? { packId: pack.packId } : {}),
    });
  } catch {
    void deleteRoom(roomId, me).catch(() => undefined);
    throw new Error('INVITE_DENIED');
  }
  return roomId;
}

export async function acceptInvite(me: string, name: string, avatarId: string, inv: DuelInvite): Promise<void> {
  const rtdb = getRtdb();
  await set(ref(rtdb, `rooms/${inv.roomId}/players/${me}`), { name: name.slice(0, 30) || 'Pemain', avatarId: avatarId.slice(0, 30) || 'bintang', ready: true });
  await remove(ref(rtdb, `notifications/${me}/${inv.id}`));
}

export const declineInvite = (me: string, id: string) => remove(ref(getRtdb(), `notifications/${me}/${id}`));

// ───────── Ruang ─────────

type Raw = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

function toRoom(v: Raw): DuelRoom {
  const qraw: Raw = v.questions ?? {};
  const araw: Raw = v.answers ?? {};
  const state: Raw = v.state ?? {};
  const orderRaw: unknown[] = Array.isArray(v.meta?.order) ? v.meta.order : Object.values(v.meta?.order ?? {});
  const order = orderRaw.map(Number).filter((n) => Number.isInteger(n) && n >= 0);
  const isPack = v.meta?.kind === 'paket' && typeof v.meta?.packId === 'string' && order.length === DUEL_TOTAL;
  return {
    kind: isPack ? 'paket' : 'hitung',
    pack: isPack ? { packId: String(v.meta.packId), version: Number(v.meta.ver) || 0, order } : null,
    hostUid: String(v.meta?.hostUid ?? ''),
    status: v.meta?.status === 'playing' || v.meta?.status === 'finished' ? v.meta.status : 'lobby',
    players: (v.players ?? {}) as Record<string, DuelPlayer>,
    phase: state.phase === 'question' || state.phase === 'reveal' || state.phase === 'finished' ? state.phase : 'lobby',
    index: Number(state.index) || 0,
    startedAt: Number(state.startedAt) || 0,
    questions: Array.from({ length: DUEL_TOTAL }, (_, i) => {
      const q = qraw[i];
      if (!q || typeof q.prompt !== 'string') return null;
      const options: unknown[] = Array.isArray(q.options) ? q.options : Object.values(q.options ?? {});
      return { prompt: q.prompt, options: options.map(String) };
    }),
    answers: Array.from({ length: DUEL_TOTAL }, (_, i) => (araw[i] ?? {}) as Record<string, DuelAnswer>),
  };
}

export function subscribeRoom(roomId: string, cb: (room: DuelRoom | null) => void, onError: () => void): Unsubscribe {
  return onValue(
    ref(getRtdb(), `rooms/${roomId}`),
    (snap) => cb(snap.exists() ? toRoom(snap.val() as Raw) : null),
    () => onError(),
  );
}

/** `questions` null = duel paket: soal berasal dari paket di bundel kedua klien, tidak ditulis ke database. */
export async function hostStart(roomId: string, questions: DuelQuestion[] | null): Promise<void> {
  const rtdb = getRtdb();
  const base = `rooms/${roomId}`;
  if (questions) await Promise.all(questions.map((q, i) => set(ref(rtdb, `${base}/questions/${i}`), q)));
  await update(ref(rtdb, `${base}/meta`), { status: 'playing' });
  await set(ref(rtdb, `${base}/state`), { phase: 'question', index: 0, startedAt: serverTimestamp() });
}

export function setPhase(roomId: string, phase: DuelPhase, index: number, startedAt: number | 'now'): Promise<void> {
  return set(ref(getRtdb(), `rooms/${roomId}/state`), { phase, index, startedAt: startedAt === 'now' ? serverTimestamp() : startedAt });
}

export async function finishRoom(roomId: string, index: number, startedAt: number): Promise<void> {
  await setPhase(roomId, 'finished', index, startedAt);
  await closeRoom(roomId);
}

export const closeRoom = (roomId: string) => update(ref(getRtdb(), `rooms/${roomId}/meta`), { status: 'finished' });

export function sendAnswer(roomId: string, index: number, me: string, choice: number): Promise<void> {
  return set(ref(getRtdb(), `rooms/${roomId}/answers/${index}/${me}`), { choice, at: serverTimestamp() });
}

/**
 * Ruang hanya "numpang lewat": dihapus seluruhnya (oleh tuan rumah atau pemain) begitu duel selesai/ditutup.
 * Tidak ada riwayat duel yang disimpan; hanya skor terbaik lokal + XP yang ikut sinkronisasi progres.
 */
export async function deleteRoom(roomId: string, me: string): Promise<void> {
  const rtdb = getRtdb();
  await remove(ref(rtdb, `rooms/${roomId}`)).catch(() => undefined);
  const pointer = ref(rtdb, `duel_active/${me}`);
  const cur = await get(pointer).catch(() => null);
  if (cur && cur.val() === roomId) await remove(pointer).catch(() => undefined);
}

const STALE_ROOM_MS = 30 * 60 * 1000;

/** Bersihkan ruang lama yang ditinggalkan (aplikasi ditutup di tengah duel). Dipanggil saat aplikasi dibuka. */
export async function cleanupMyDuel(me: string): Promise<void> {
  const rtdb = getRtdb();
  const pointer = ref(rtdb, `duel_active/${me}`);
  const id = (await get(pointer)).val();
  if (typeof id !== 'string') return;
  const meta = (await get(ref(rtdb, `rooms/${id}/meta`)).catch(() => null))?.val() as { status?: string; createdAt?: number } | null | undefined;
  const old = !meta || meta.status === 'finished' || Date.now() - (meta.createdAt ?? 0) > STALE_ROOM_MS;
  if (!old) return;
  await remove(ref(rtdb, `rooms/${id}`)).catch(() => undefined);
  await remove(pointer);
}
