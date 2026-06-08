import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, where } from "firebase/firestore";
import { ChevronRight } from "lucide-react";

import { db } from "@/integrations/client";
import type { Message, Profile } from "@/integrations/types";
import { fromCollection, sortByCreatedAtDesc, sortByName, uniqueById } from "@/lib/firestore";
import { useSessionProfile } from "@/lib/use-profile";
import { Avatar } from "@/components/Avatar";
import { PageHeader } from "@/components/AppShell";

export const Route = createFileRoute("/app/messages")({
  component: MessagesList,
});

function MessagesList() {
  const location = useLocation();
  const { data: me } = useSessionProfile();
  const isThreadRoute = /^\/app\/messages\/[^/]+$/.test(location.pathname);

  const people = useQuery({
    queryKey: ["people"],
    enabled: !isThreadRoute,
    queryFn: async () => sortByName(fromCollection<Profile>(await getDocs(collection(db, "profiles")))),
  });
  const messages = useQuery({
    queryKey: ["my-messages", me?.id],
    enabled: !!me?.id && !isThreadRoute,
    queryFn: async () => {
      if (!me?.id) return [];
      const [sent, received] = await Promise.all([
        getDocs(query(collection(db, "messages"), where("sender_id", "==", me.id))),
        getDocs(query(collection(db, "messages"), where("recipient_id", "==", me.id))),
      ]);

      return sortByCreatedAtDesc(uniqueById<Message>([...fromCollection<Message>(sent), ...fromCollection<Message>(received)]));
    },
  });

  const unread = useQuery({
    queryKey: ["unread-messages", me?.id],
    enabled: !!me?.id && !isThreadRoute,
    queryFn: async () => fromCollection<Message>(await getDocs(query(collection(db, "messages"), where("recipient_id", "==", me.id), where("read_at", "==", null)))),
  });

  const threads = new Map<string, { other: Profile | undefined; last: Message }>();
  for (const message of messages.data ?? []) {
    const otherId = message.sender_id === me?.id ? message.recipient_id : message.sender_id;
    if (!otherId || otherId === me?.id) {
      continue;
    }
    if (!threads.has(otherId)) {
      const other = people.data?.find((person) => person.id === otherId);
      threads.set(otherId, { other, last: message });
    }
  }

  const list = Array.from(threads.values());
  if (isThreadRoute) {
    return <Outlet />;
  }

  return (
    <div>
      <PageHeader title="Messages" subtitle={list.length ? `${list.length} conversations` : "Start a conversation"} />
      <div className="space-y-2 px-5">
        {list.map(({ other, last }) =>
          other ? (
            <Link key={other.id} to="/app/messages/$id" params={{ id: other.id }} className="glass flex items-center gap-3 rounded-2xl p-3">
              <Avatar name={other.full_name} url={other.avatar_url} size={46} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{other.full_name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {last.sender_id === me?.id ? "You: " : ""}
                  {last.content}
                </div>
              </div>
              {(() => {
                const unreadBy = new Map<string, number>();
                for (const m of unread.data ?? []) {
                  if (!m.sender_id) continue;
                  unreadBy.set(m.sender_id, (unreadBy.get(m.sender_id) ?? 0) + 1);
                }
                const count = unreadBy.get(other.id) ?? 0;
                return count ? (
                  <span className="inline-flex h-6 min-w-[20px] items-center justify-center rounded-full bg-teal px-2 text-xs font-semibold text-primary-foreground">{count > 99 ? "99+" : count}</span>
                ) : null;
              })()}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ) : null,
        )}

        <div className="mb-2 mt-4 px-1 text-xs uppercase tracking-wider text-muted-foreground">Start a new chat</div>
        {(people.data ?? [])
          .filter((person) => person.id !== me?.id && !threads.has(person.id))
          .map((person) => (
            <Link key={person.id} to="/app/messages/$id" params={{ id: person.id }} className="glass flex items-center gap-3 rounded-2xl p-3">
              <Avatar name={person.full_name} url={person.avatar_url} size={40} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{person.full_name}</div>
                <div className="text-xs capitalize text-muted-foreground">{person.role}</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
      </div>
    </div>
  );
}
