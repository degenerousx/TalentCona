"use client";

import { useState } from "react";
import { Activity, Hash, Search, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TabPanel } from "@/components/ui/Tabs";
import { cn } from "@/lib/cn";
import { ChannelChat } from "./ChannelChat";
import { ChannelsTab } from "./ChannelsTab";
import { ChannelFormModal, CommunityFormModal, ManageMemberModal } from "./CommunityModals";
import { MembersTab } from "./MembersTab";
import { OverviewTab } from "./OverviewTab";
import { ActionMenu, IconTabs, StatusPill, type IconTab } from "./shared";
import { initialCommunities, today, type Channel, type Community } from "./data";

type TabId = "overview" | "channels" | "members";

const ID = "communities";
const tabs: IconTab<TabId>[] = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "channels", label: "Channels", icon: Hash },
  { id: "members", label: "Members", icon: Users },
];

type Dialog =
  | { kind: "create-community" }
  | { kind: "edit-community" }
  | { kind: "create-channel" }
  | { kind: "edit-channel"; channel: Channel }
  | { kind: "manage-member"; memberId: string };

function CommunityListItem({
  community,
  selected,
  onSelect,
}: {
  community: Community;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        aria-current={selected ? "true" : undefined}
        onClick={onSelect}
        className={cn(
          "flex w-full items-start gap-3 border-b border-gray-100 py-4 pr-4 pl-4 text-left transition-colors",
          selected ? "border-l-4 border-b-primary border-l-primary bg-purple-50 pl-3" : "hover:bg-gray-50",
        )}
      >
        <span aria-hidden className="text-2xl leading-8">
          {community.emoji}
        </span>
        <span className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-lg leading-6.75 font-semibold text-gray-900">{community.name}</span>
          <span className="flex items-center gap-3 text-sm leading-5 font-medium text-gray-600">
            <span className="flex items-center gap-1">
              <Users aria-hidden className="size-3.5" />
              {community.memberCount}
            </span>
            <span className="flex items-center gap-1">
              <Hash aria-hidden className="size-3.5" />
              {community.channels.length}
            </span>
          </span>
          <span className="mt-1">
            <StatusPill status={community.status}>
              {community.status === "active" ? "Active" : "Inactive"}
            </StatusPill>
          </span>
        </span>
      </button>
    </li>
  );
}

/** Communities module (Figma section 293:31769). All data is local mock state. */
export function CommunitiesView() {
  const [communities, setCommunities] = useState(initialCommunities);
  const [selectedId, setSelectedId] = useState(initialCommunities[0]!.id);
  const [tab, setTab] = useState<TabId>("overview");
  const [openChannelId, setOpenChannelId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [query, setQuery] = useState("");

  const community = communities.find((c) => c.id === selectedId) ?? communities[0];
  const closeDialog = () => setDialog(null);

  const update = (fn: (c: Community) => Community) =>
    setCommunities((all) => all.map((c) => (c.id === community?.id ? fn(c) : c)));

  const select = (id: string) => {
    setSelectedId(id);
    setOpenChannelId(null);
  };

  const q = query.trim().toLowerCase();
  const listed = communities.filter((c) => !q || c.name.toLowerCase().includes(q));

  const createCommunity = (name: string, description: string) => {
    const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
    const general: Channel = {
      id: `${id}-general`,
      name: "general",
      description: "General discussions",
      members: 0,
      messages: 0,
      status: "active",
    };
    setCommunities((all) => [
      ...all,
      {
        id,
        name,
        emoji: "💬",
        description,
        category: "General",
        status: "active",
        memberCount: 0,
        messagesToday: 0,
        flagged: 0,
        channels: [general],
        members: [],
        pending: [],
        activity: [],
        posts: [],
      },
    ]);
    select(id);
    setTab("overview");
  };

  const communityDialogs = (
    <>
      {dialog?.kind === "create-community" && (
        <CommunityFormModal
          onClose={closeDialog}
          onSave={({ name, description }) => {
            createCommunity(name, description);
            closeDialog();
          }}
        />
      )}
      {dialog?.kind === "edit-community" && community && (
        <CommunityFormModal
          initial={{ name: community.name, description: community.description }}
          onClose={closeDialog}
          onSave={({ name, description }) => {
            update((c) => ({ ...c, name, description }));
            closeDialog();
          }}
        />
      )}
    </>
  );

  if (!community) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg bg-white p-10 text-center">
        <p className="text-gray-600">No communities yet.</p>
        <Button onClick={() => setDialog({ kind: "create-community" })} icon={<UserPlus aria-hidden className="size-4.5" />}>
          Create Communities
        </Button>
        {communityDialogs}
      </div>
    );
  }

  if (openChannelId) {
    return (
      <ChannelChat
        community={community}
        channelId={openChannelId}
        onBack={() => setOpenChannelId(null)}
        onSelectChannel={(id) => {
          setOpenChannelId(id);
          // Opening a channel marks it read.
          update((c) => ({ ...c, channels: c.channels.map((ch) => (ch.id === id ? { ...ch, unread: 0 } : ch)) }));
        }}
        onPostsChange={(fn) => update((c) => ({ ...c, posts: fn(c.posts) }))}
      />
    );
  }

  const manageMember =
    dialog?.kind === "manage-member" ? community.members.find((m) => m.id === dialog.memberId) : undefined;

  const updateMember = (id: string, fn: (m: Community["members"][number]) => Community["members"][number]) =>
    update((c) => ({ ...c, members: c.members.map((m) => (m.id === id ? fn(m) : m)) }));

  const deleteCommunity = () => {
    const rest = communities.filter((c) => c.id !== community.id);
    setCommunities(rest);
    if (rest[0]) select(rest[0].id);
  };

  return (
    <div className="flex min-h-193.25 flex-col overflow-hidden rounded-lg border border-gray-200 bg-neutral-50 lg:flex-row">
      {/* Community list */}
      <aside className="flex shrink-0 flex-col border-b border-gray-200 bg-white lg:w-80 lg:border-r lg:border-b-0">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-6">
          <h2 className="text-xl leading-7 font-bold text-gray-900">Communities</h2>
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-4.5 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              aria-label="Search communities"
              placeholder="Search communities..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10.5 w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 text-base text-gray-900 placeholder:text-[rgba(58,58,58,0.5)] focus:border-primary focus:outline-none"
            />
          </div>
        </div>
        <ul aria-label="Communities" className="max-h-141.5 flex-1 overflow-y-auto lg:max-h-none">
          {listed.map((c) => (
            <CommunityListItem
              key={c.id}
              community={c}
              selected={c.id === community.id}
              onSelect={() => select(c.id)}
            />
          ))}
          {listed.length === 0 && <li className="p-6 text-center text-sm text-gray-500">No communities found.</li>}
        </ul>
        <div className="border-t border-gray-200 px-4 pt-4 pb-4">
          <Button
            onClick={() => setDialog({ kind: "create-community" })}
            size="lg"
            className="h-11 w-full gap-1"
            icon={<UserPlus aria-hidden className="size-4.5" />}
          >
            Create Communities
          </Button>
        </div>
      </aside>

      {/* Selected community */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-gray-200 bg-white px-8 pt-6 pb-6">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-2xl leading-8 font-bold text-gray-900">
              <span aria-hidden>{community.emoji}</span>
              <span className="truncate">{community.name}</span>
            </h1>
            <p className="text-base leading-6 text-gray-600">
              {community.memberCount} members • {community.channels.length} channels
            </p>
          </div>
          <ActionMenu
            label={`Actions for ${community.name}`}
            items={[
              { label: "Edit", onSelect: () => setDialog({ kind: "edit-community" }) },
              {
                label: community.status === "active" ? "Deactivate" : "Activate",
                onSelect: () => update((c) => ({ ...c, status: c.status === "active" ? "inactive" : "active" })),
              },
              { label: "Delete", onSelect: deleteCommunity, danger: true },
            ]}
          />
        </header>

        <IconTabs idBase={ID} tabs={tabs} value={tab} onChange={setTab} />

        <TabPanel idBase={ID} id={tab} className="p-5">
          {tab === "overview" && <OverviewTab community={community} />}
          {tab === "channels" && (
            <ChannelsTab
              channels={community.channels}
              onCreate={() => setDialog({ kind: "create-channel" })}
              onOpen={(ch) => setOpenChannelId(ch.id)}
              onEdit={(channel) => setDialog({ kind: "edit-channel", channel })}
              onToggle={(ch) =>
                update((c) => ({
                  ...c,
                  channels: c.channels.map((x) =>
                    x.id === ch.id ? { ...x, status: x.status === "active" ? "inactive" : "active" } : x,
                  ),
                }))
              }
              onDelete={(ch) =>
                update((c) => ({
                  ...c,
                  channels: c.channels.filter((x) => x.id !== ch.id),
                  posts: c.posts.filter((p) => p.channelId !== ch.id),
                }))
              }
            />
          )}
          {tab === "members" && (
            <MembersTab
              members={community.members}
              pending={community.pending}
              onManage={(m) => setDialog({ kind: "manage-member", memberId: m.id })}
              onReject={(r) => update((c) => ({ ...c, pending: c.pending.filter((x) => x.id !== r.id) }))}
              onApprove={(r) =>
                update((c) => ({
                  ...c,
                  memberCount: c.memberCount + 1,
                  pending: c.pending.filter((x) => x.id !== r.id),
                  members: [
                    ...c.members,
                    { id: `${r.id}-member`, name: r.name, email: r.email, joined: today(), messages: 0, status: "active" },
                  ],
                }))
              }
            />
          )}
        </TabPanel>
      </div>

      {communityDialogs}
      {dialog?.kind === "create-channel" && (
        <ChannelFormModal
          onClose={closeDialog}
          onSave={({ name, description }) => {
            update((c) => ({
              ...c,
              channels: [
                ...c.channels,
                { id: `${c.id}-${name}-${Date.now()}`, name, description, members: 0, messages: 0, status: "active" },
              ],
            }));
            closeDialog();
          }}
        />
      )}
      {dialog?.kind === "edit-channel" && (
        <ChannelFormModal
          initial={{ name: dialog.channel.name, description: dialog.channel.description }}
          onClose={closeDialog}
          onSave={({ name, description }) => {
            update((c) => ({
              ...c,
              channels: c.channels.map((x) => (x.id === dialog.channel.id ? { ...x, name, description } : x)),
            }));
            closeDialog();
          }}
        />
      )}
      {manageMember && (
        <ManageMemberModal
          member={manageMember}
          onClose={closeDialog}
          onToggleMute={() => updateMember(manageMember.id, (m) => ({ ...m, muted: !m.muted }))}
          onToggleSuspend={() =>
            updateMember(manageMember.id, (m) => ({ ...m, status: m.status === "suspended" ? "active" : "suspended" }))
          }
          onRemove={() => {
            update((c) => ({
              ...c,
              memberCount: Math.max(0, c.memberCount - 1),
              members: c.members.filter((m) => m.id !== manageMember.id),
            }));
            closeDialog();
          }}
        />
      )}
    </div>
  );
}
