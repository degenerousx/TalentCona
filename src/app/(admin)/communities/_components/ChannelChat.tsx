"use client";

import { useEffect, useRef, useState } from "react";
import { Hash, MessageCircle, Paperclip, Pin, Search, SendHorizontal, Smile, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { ActionMenu } from "./shared";
import type { Community, Post } from "./data";

const avatarGradient = "bg-linear-135 from-[#ad46ff] to-[#f6339a]";

function Avatar({ text }: { text: string }) {
  return (
    <span
      aria-hidden
      className={`grid size-10 shrink-0 place-items-center rounded-full text-sm text-white ${avatarGradient}`}
    >
      {text}
    </span>
  );
}

function PostItem({
  post,
  onReact,
  onTogglePin,
  onReply,
  onDelete,
}: {
  post: Post;
  onReact: (emoji: string) => void;
  onTogglePin: () => void;
  onReply: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="flex flex-col gap-3">
      {post.pinned && (
        <p className="flex items-center gap-2 pl-1 text-xs leading-4 text-amber-600">
          <Pin aria-hidden className="size-3.5" />
          Pinned by you
        </p>
      )}
      <div className="flex items-start gap-4">
        <Avatar text={post.initials} />
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <p className="flex items-baseline gap-3">
            <span className="text-base leading-6 text-gray-900">{post.author}</span>
            <span className="text-xs leading-4 text-gray-400">{post.time}</span>
          </p>
          <p className="text-base leading-6.5 break-words text-gray-700">{post.text}</p>
          <div className="flex flex-wrap items-center gap-2">
            {post.reactions.map((r) => (
              <button
                key={r.emoji}
                type="button"
                aria-pressed={Boolean(r.mine)}
                aria-label={`${r.emoji} ${r.count}`}
                onClick={() => onReact(r.emoji)}
                className={cn(
                  "flex h-7.5 items-center gap-1.5 rounded-full border px-2.5 text-xs text-gray-600",
                  r.mine ? "border-purple-300 bg-purple-50" : "border-gray-200 bg-gray-50 hover:bg-gray-100",
                )}
              >
                <span className="text-sm">{r.emoji}</span>
                {r.count}
              </button>
            ))}
            <button
              type="button"
              aria-label="Add reaction"
              onClick={() => onReact("👍")}
              className="grid size-7 place-items-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50"
            >
              <Smile aria-hidden className="size-4" />
            </button>
          </div>
          {post.replies > 0 && (
            <button
              type="button"
              onClick={onReply}
              className="flex w-fit items-center gap-2 text-sm leading-5 text-purple-600 hover:underline"
            >
              <MessageCircle aria-hidden className="size-4" />
              {post.replies} {post.replies === 1 ? "reply" : "replies"}
            </button>
          )}
        </div>
        <ActionMenu
          label={`Actions for ${post.author}'s message`}
          items={[
            { label: post.pinned ? "Unpin Message" : "Pin Message", onSelect: onTogglePin },
            { label: "Reply", onSelect: onReply },
            { label: "Delete", onSelect: onDelete, danger: true },
          ]}
        />
      </div>
    </li>
  );
}

/**
 * Channel chat (Figma 293:32558): community header, channel list and the
 * message feed of the selected channel. Posts live in the community state.
 */
export function ChannelChat({
  community,
  channelId,
  onBack,
  onSelectChannel,
  onPostsChange,
}: {
  community: Community;
  channelId: string;
  onBack: () => void;
  onSelectChannel: (id: string) => void;
  onPostsChange: (update: (posts: Post[]) => Post[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [attachment, setAttachment] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // The page scroll box lives in the layout; start the chat at its top.
  useEffect(() => {
    document.querySelector("main")?.scrollTo({ top: 0 });
  }, []);

  const channel = community.channels.find((c) => c.id === channelId) ?? community.channels[0];
  if (!channel) return null;

  const q = query.trim().toLowerCase();
  const posts = community.posts
    .filter((p) => p.channelId === channel.id)
    .filter((p) => !q || p.text.toLowerCase().includes(q) || p.author.toLowerCase().includes(q))
    // Pinned messages stay on top, like in the design.
    .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));

  const updatePost = (id: string, fn: (p: Post) => Post) =>
    onPostsChange((all) => all.map((p) => (p.id === id ? fn(p) : p)));

  const react = (id: string, emoji: string) =>
    updatePost(id, (p) => {
      const existing = p.reactions.find((r) => r.emoji === emoji);
      const reactions = existing
        ? p.reactions
            .map((r) => (r.emoji === emoji ? { ...r, mine: !r.mine, count: r.count + (r.mine ? -1 : 1) } : r))
            .filter((r) => r.count > 0)
        : [...p.reactions, { emoji, count: 1, mine: true }];
      return { ...p, reactions };
    });

  const reply = (author: string) => {
    setDraft(`@${author} `);
    inputRef.current?.focus();
  };

  const send = () => {
    const text = [draft.trim(), attachment && `📎 ${attachment}`].filter(Boolean).join("\n");
    if (!text) return;
    onPostsChange((all) => [
      ...all,
      {
        id: `post-${Date.now()}`,
        channelId: channel.id,
        initials: "YO",
        author: "You",
        time: "Just now",
        text,
        reactions: [],
        replies: 0,
      },
    ]);
    setDraft("");
    setAttachment(undefined);
  };

  const canSend = Boolean(draft.trim() || attachment);

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={onBack}
        className="w-fit text-base leading-6 font-semibold text-slate-900 hover:text-primary"
      >
        ← Back
      </button>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <header className="flex items-start gap-4 border-b border-black/10 px-8 pt-6 pb-6">
          <span
            aria-hidden
            className="grid size-16 shrink-0 place-items-center rounded-2xl bg-linear-135 from-[#2b7fff] to-[#00b8db] text-3xl"
          >
            {community.emoji}
          </span>
          <div className="flex min-w-0 flex-col gap-2">
            <h1 className="text-2xl leading-8 text-gray-900">{community.name}</h1>
            <p className="text-base leading-6 text-gray-600">{community.description}</p>
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1 text-sm leading-5 text-gray-500">
                <Users aria-hidden className="size-4" />
                {community.memberCount.toLocaleString()} members
              </span>
              <span className="rounded-lg bg-[#eceef2] px-2 py-0.5 text-xs leading-4 text-[#030213]">
                {community.category}
              </span>
            </div>
          </div>
        </header>

        <div className="flex flex-col md:flex-row">
          <nav
            aria-label="Channels"
            className="flex shrink-0 flex-col gap-3 border-b border-gray-200 px-4 pt-6 pb-4 md:w-56 md:border-r md:border-b-0"
          >
            <h2 className="px-2 text-xs leading-4 tracking-[0.6px] text-gray-500 uppercase">Channels</h2>
            <ul className="flex flex-col gap-0.5">
              {community.channels.map((c) => {
                const current = c.id === channel.id;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      aria-current={current ? "page" : undefined}
                      onClick={() => onSelectChannel(c.id)}
                      className={cn(
                        "flex h-10 w-full items-center justify-between gap-2 rounded-[10px] px-3 text-sm leading-5",
                        current ? "bg-purple-50 text-purple-700" : "text-gray-700 hover:bg-gray-50",
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <Hash aria-hidden className="size-4 shrink-0" />
                        <span className="truncate">{c.name}</span>
                      </span>
                      {!current && c.unread ? (
                        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-red-500 text-xs text-white">
                          {c.unread}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <section aria-label={`#${channel.name}`} className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-8 py-4">
              <div className="flex min-w-0 items-center gap-2">
                <Hash aria-hidden className="size-5 shrink-0 text-gray-400" />
                <h2 className="text-lg leading-7 text-gray-900">{channel.name}</h2>
                <span aria-hidden className="text-gray-400">•</span>
                <p className="truncate text-sm leading-5 text-gray-500">{channel.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {searching && (
                  <input
                    type="search"
                    autoFocus
                    aria-label={`Search #${channel.name}`}
                    placeholder="Search messages"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="h-8 w-44 rounded-lg border border-gray-300 px-3 text-sm focus:border-primary focus:outline-none"
                  />
                )}
                <button
                  type="button"
                  aria-label={searching ? "Close search" : "Search messages"}
                  aria-pressed={searching}
                  onClick={() => {
                    setSearching((s) => !s);
                    setQuery("");
                  }}
                  className="grid h-8 w-9 place-items-center rounded-lg text-gray-500 hover:bg-gray-100"
                >
                  <Search aria-hidden className="size-4" />
                </button>
              </div>
            </div>

            <ul className="flex flex-col gap-8 px-8 py-6">
              {posts.map((p) => (
                <PostItem
                  key={p.id}
                  post={p}
                  onReact={(emoji) => react(p.id, emoji)}
                  onTogglePin={() => updatePost(p.id, (x) => ({ ...x, pinned: !x.pinned }))}
                  onReply={() => reply(p.author)}
                  onDelete={() => onPostsChange((all) => all.filter((x) => x.id !== p.id))}
                />
              ))}
              {posts.length === 0 && (
                <li className="py-10 text-center text-sm text-gray-500">
                  {q ? "No messages match your search." : `No messages in #${channel.name} yet.`}
                </li>
              )}
            </ul>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="mt-auto flex items-center gap-4 border-t border-gray-200 px-8 py-5"
            >
              <Avatar text="YO" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <input
                  ref={inputRef}
                  aria-label={`Message #${channel.name}`}
                  placeholder={`Message #${channel.name}`}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="h-9 w-full rounded-lg border border-[#e0e0e0] px-3 text-sm text-gray-900 placeholder:text-[#717182] focus:border-primary focus:outline-none"
                />
                {attachment && (
                  <p className="flex items-center gap-2 text-xs text-gray-500">
                    <Paperclip aria-hidden className="size-3" />
                    {attachment}
                    <button
                      type="button"
                      onClick={() => setAttachment(undefined)}
                      className="text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  aria-label="Attach file"
                  onClick={() => fileRef.current?.click()}
                  className="grid size-8 place-items-center rounded-lg text-gray-600 hover:bg-gray-100"
                >
                  <Paperclip aria-hidden className="size-4" />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  className="sr-only"
                  tabIndex={-1}
                  onChange={(e) => setAttachment(e.target.files?.[0]?.name)}
                />
                <button
                  type="button"
                  aria-label="Insert emoji"
                  onClick={() => {
                    setDraft((d) => `${d}🙂`);
                    inputRef.current?.focus();
                  }}
                  className="grid size-8 place-items-center rounded-lg text-gray-600 hover:bg-gray-100"
                >
                  <Smile aria-hidden className="size-4" />
                </button>
                <button
                  type="submit"
                  aria-label="Send message"
                  disabled={!canSend}
                  className="grid h-8 w-10 place-items-center rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  <SendHorizontal aria-hidden className="size-4" />
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
