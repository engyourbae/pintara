import { get, ref, remove, set } from 'firebase/database';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import { getDb, getRtdb } from './client';
import { UserFacingError, USERNAME_RE } from './auth';

/**
 * Pertemanan tanpa Cloud Functions. Semua keabsahan ditegakkan firebase/firebase.rules:
 * permintaan butuh persetujuan penerima, pertemanan hanya sah lewat batch "terima",
 * dan izin orang tua dicek di rules. Kode ini hanya menjalankan urutan tulis yang diwajibkan.
 */

export interface PublicProfile {
  uid: string;
  username: string;
  avatarId: string;
}

export interface FriendsData {
  friends: PublicProfile[];
  incoming: PublicProfile[];
  outgoing: PublicProfile[];
  blocked: PublicProfile[];
}

const pairKey = (a: string, b: string) => (a < b ? `${a}_${b}` : `${b}_${a}`);
const quiet = () => undefined;

export async function profileOf(uid: string): Promise<PublicProfile> {
  const snap = await getDoc(doc(getDb(), 'user_profiles', uid)).catch(() => null);
  const d = snap?.exists() ? snap.data() : null;
  return {
    uid,
    username: d && typeof d.username === 'string' ? d.username : '(tidak diketahui)',
    avatarId: d && typeof d.avatarId === 'string' ? d.avatarId : 'bintang',
  };
}

/** Apakah orang tua mengizinkan pertemanan untuk anak ini. */
export async function isFriendsEnabled(parentUid: string, childUid: string): Promise<boolean> {
  const snap = await getDoc(doc(getDb(), 'parent_accounts', parentUid, 'children', childUid));
  return snap.exists() && snap.data().friendsEnabled === true;
}

/** Cermin daftar teman/blokir di Realtime Database (dipakai rules untuk presence & undangan). Sebisanya. */
async function syncMirror(me: string, friendUids: string[], blockedUids: string[]): Promise<void> {
  const rtdb = getRtdb();
  const sync = async (node: 'friends' | 'blocked', want: string[]) => {
    const have = Object.keys((await get(ref(rtdb, `${node}/${me}`))).val() ?? {});
    await Promise.all([
      ...want.filter((u) => !have.includes(u)).map((u) => set(ref(rtdb, `${node}/${me}/${u}`), true)),
      ...have.filter((u) => !want.includes(u)).map((u) => remove(ref(rtdb, `${node}/${me}/${u}`))),
    ]);
  };
  await sync('friends', friendUids);
  await sync('blocked', blockedUids);
}

/** Pastikan cermin teman/blokir di RTDB mutakhir (dibutuhkan rules undangan main). Ringan: tanpa memuat profil. */
export async function ensureMirror(me: string): Promise<void> {
  const db = getDb();
  const [fs, bl] = await Promise.all([
    getDocs(query(collection(db, 'friendships'), where('uids', 'array-contains', me))),
    getDocs(query(collection(db, 'blocked_users'), where('blockerUid', '==', me))),
  ]);
  const friendUids = fs.docs
    .map((d) => (Array.isArray(d.data().uids) ? (d.data().uids as string[]).find((u) => u !== me) : undefined))
    .filter((u): u is string => typeof u === 'string');
  await syncMirror(me, friendUids, bl.docs.map((d) => d.data().blockedUid as string));
}

export async function loadFriends(me: string): Promise<FriendsData> {
  const db = getDb();
  const [fs, inc, out, bl] = await Promise.all([
    getDocs(query(collection(db, 'friendships'), where('uids', 'array-contains', me))),
    getDocs(query(collection(db, 'friend_requests'), where('toUid', '==', me))),
    getDocs(query(collection(db, 'friend_requests'), where('fromUid', '==', me))),
    getDocs(query(collection(db, 'blocked_users'), where('blockerUid', '==', me))),
  ]);

  const friendUids = fs.docs
    .map((d) => (Array.isArray(d.data().uids) ? (d.data().uids as string[]).find((u) => u !== me) : undefined))
    .filter((u): u is string => typeof u === 'string');
  const incomingUids = inc.docs.filter((d) => d.data().status === 'pending').map((d) => d.data().fromUid as string);
  const outgoingUids = out.docs.filter((d) => d.data().status === 'pending').map((d) => d.data().toUid as string);
  const blockedUids = bl.docs.map((d) => d.data().blockedUid as string);

  const [friends, incoming, outgoing, blocked] = await Promise.all(
    [friendUids, incomingUids, outgoingUids, blockedUids].map((list) => Promise.all(list.map(profileOf))),
  );

  void syncMirror(me, friendUids, blockedUids).catch(quiet);
  return { friends, incoming, outgoing, blocked };
}

export async function sendFriendRequest(me: string, username: string): Promise<PublicProfile> {
  const name = username.trim().toLowerCase();
  if (!USERNAME_RE.test(name)) throw new UserFacingError('Nama pengguna tidak valid.');
  const db = getDb();
  const found = await getDoc(doc(db, 'usernames', name));
  if (!found.exists() || typeof found.data().uid !== 'string') throw new UserFacingError('Nama pengguna tidak ditemukan.');
  const toUid = found.data().uid as string;
  if (toUid === me) throw new UserFacingError('Itu nama penggunamu sendiri.');
  try {
    await setDoc(doc(db, 'friend_requests', `${me}_${toUid}`), {
      fromUid: me,
      toUid,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    if (e instanceof FirebaseError && e.code === 'permission-denied') {
      throw new UserFacingError('Permintaan tidak bisa dikirim. Pastikan orang tua kedua anak sudah mengizinkan pertemanan.');
    }
    throw e;
  }
  return profileOf(toUid);
}

/** Terima: satu batch (ubah permintaan + buat pertemanan), lalu bersihkan dokumen permintaan. */
export async function acceptRequest(me: string, fromUid: string): Promise<void> {
  const db = getDb();
  const req = doc(db, 'friend_requests', `${fromUid}_${me}`);
  const uids = [me, fromUid].sort();
  const batch = writeBatch(db);
  batch.update(req, { status: 'accepted' });
  batch.set(doc(db, 'friendships', pairKey(me, fromUid)), { uids, createdAt: serverTimestamp() });
  await batch.commit();
  await deleteDoc(req).catch(quiet); // agar permintaan baru bisa dibuat lagi bila pertemanan dihapus
  await set(ref(getRtdb(), `friends/${me}/${fromUid}`), true).catch(quiet);
}

export const declineRequest = (me: string, fromUid: string) => deleteDoc(doc(getDb(), 'friend_requests', `${fromUid}_${me}`));
export const cancelRequest = (me: string, toUid: string) => deleteDoc(doc(getDb(), 'friend_requests', `${me}_${toUid}`));

export async function removeFriend(me: string, friendUid: string): Promise<void> {
  await deleteDoc(doc(getDb(), 'friendships', pairKey(me, friendUid)));
  await remove(ref(getRtdb(), `friends/${me}/${friendUid}`)).catch(quiet);
}

export async function blockUser(me: string, uid: string): Promise<void> {
  const db = getDb();
  await setDoc(doc(db, 'blocked_users', `${me}_${uid}`), { blockerUid: me, blockedUid: uid, createdAt: serverTimestamp() });
  await deleteDoc(doc(db, 'friendships', pairKey(me, uid))).catch(quiet);
  await deleteDoc(doc(db, 'friend_requests', `${me}_${uid}`)).catch(quiet);
  await deleteDoc(doc(db, 'friend_requests', `${uid}_${me}`)).catch(quiet);
  const rtdb = getRtdb();
  await remove(ref(rtdb, `friends/${me}/${uid}`)).catch(quiet);
  await set(ref(rtdb, `blocked/${me}/${uid}`), true).catch(quiet);
}

export async function unblockUser(me: string, uid: string): Promise<void> {
  await deleteDoc(doc(getDb(), 'blocked_users', `${me}_${uid}`));
  await remove(ref(getRtdb(), `blocked/${me}/${uid}`)).catch(quiet);
}
