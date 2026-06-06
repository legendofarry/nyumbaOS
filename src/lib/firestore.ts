import type { DocumentData, QueryDocumentSnapshot, QuerySnapshot } from "firebase/firestore";

export type FirestoreRecord<T extends object> = T & { id: string };

export function fromDoc<T extends object>(snapshot: QueryDocumentSnapshot<DocumentData>): FirestoreRecord<T> {
  return {
    id: snapshot.id,
    ...(snapshot.data() as T),
  };
}

export function fromCollection<T extends object>(snapshot: QuerySnapshot<DocumentData>): Array<FirestoreRecord<T>> {
  return snapshot.docs.map((doc) => fromDoc<T>(doc));
}

export function nowIso() {
  return new Date().toISOString();
}

export function sortByCreatedAtDesc<T extends { created_at?: string | null }>(items: readonly T[]) {
  return [...items].sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime());
}

export function sortByName<T extends { full_name?: string | null }>(items: readonly T[]) {
  return [...items].sort((a, b) => (a.full_name ?? "").localeCompare(b.full_name ?? ""));
}

export function uniqueById<T extends { id: string }>(items: readonly T[]) {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}
