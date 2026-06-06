import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import { useSessionProfile } from "@/lib/use-profile";
import { PageHeader } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/app/messages")({
  component: MessagesList,
});

function MessagesList() {
  const { data: me } = useSessionProfile();

  const people = useQuery({
    queryKey: ["people"],
    queryFn: async () => (await supabase.from("profiles").select("id, full_name, avatar_url, role")).data ?? [],
  });
  const messages = useQuery({
    queryKey: ["my-messages", me?.id],
    enabled: !!me?.id,
    queryFn: async () => (await supabase.from("messages").select("*").or(`sender_id.eq.${me!.id},recipient_id.eq.${me!.id}`).order("created_at", { ascending: false })).data ?? [],
  });

  // group threads by counterpart
  const threads = new Map<string, { other: any; last: any }>();
  for (const m of messages.data ?? []) {
    const otherId = m.sender_id === me?.id ? m.recipient_id : m.sender_id;
    if (!threads.has(otherId)) {
      const other = people.data?.find((p: any) => p.id === otherId);
      threads.set(otherId, { other, last: m });
    }
  }

  const list = Array.from(threads.values());

  return (
    <div>
      <PageHeader title="Messages" subtitle={list.length ? `${list.length} conversations` : "Start a conversation"} />
      <div className="px-5 space-y-2">
        {list.map(({ other, last }) => other && (
          <Link key={other.id} to="/app/messages/$id" params={{ id: other.id }}
            className="glass rounded-2xl p-3 flex items-center gap-3">
            <Avatar name={other.full_name} url={other.avatar_url} size={46} />
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{other.full_name}</div>
              <div className="text-xs text-muted-foreground truncate">{last.sender_id === me?.id ? "You: " : ""}{last.content}</div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}

        <div className="text-xs uppercase tracking-wider text-muted-foreground px-1 mt-4 mb-2">Start a new chat</div>
        {(people.data ?? []).filter((p: any) => p.id !== me?.id && !threads.has(p.id)).map((p: any) => (
          <Link key={p.id} to="/app/messages/$id" params={{ id: p.id }} className="glass rounded-2xl p-3 flex items-center gap-3">
            <Avatar name={p.full_name} url={p.avatar_url} size={40} />
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{p.full_name}</div>
              <div className="text-xs text-muted-foreground capitalize">{p.role}</div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}