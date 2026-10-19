/**
 * Mock data for the Communities module (Figma section 293:31769).
 * Swap for API calls once the backend exists; the shapes are what the UI needs.
 */

export type ActiveState = "active" | "inactive";
export type MemberStatus = "active" | "suspended";

export type Channel = {
  id: string;
  name: string;
  description: string;
  members: number;
  messages: number;
  status: ActiveState;
  /** Red badge in the channel list of the chat view. */
  unread?: number;
};

export type Member = {
  id: string;
  name: string;
  email: string;
  joined: string;
  messages: number;
  status: MemberStatus;
  muted?: boolean;
};

export type JoinRequest = {
  id: string;
  name: string;
  email: string;
  requested: string;
  program: string;
};

export type Activity = { id: string; name: string; action: string; time: string };

export type Reaction = { emoji: string; count: number; mine?: boolean };

export type Post = {
  id: string;
  channelId: string;
  initials: string;
  author: string;
  time: string;
  text: string;
  reactions: Reaction[];
  replies: number;
  pinned?: boolean;
};

export type Community = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: string;
  status: ActiveState;
  memberCount: number;
  messagesToday: number;
  flagged: number;
  channels: Channel[];
  members: Member[];
  pending: JoinRequest[];
  activity: Activity[];
  posts: Post[];
};

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

export const today = () => new Date().toISOString().slice(0, 10);

const baseChannels: Omit<Channel, "id">[] = [
  { name: "general", description: "General discussions", members: 342, messages: 1240, status: "active" },
  { name: "announcements", description: "Official announcements only", members: 342, messages: 45, status: "active", unread: 2 },
  { name: "resources", description: "Share learning resources", members: 298, messages: 567, status: "active" },
  { name: "help", description: "Ask for help and support", members: 312, messages: 892, status: "active", unread: 5 },
  { name: "showcase", description: "Show off your projects", members: 256, messages: 234, status: "active" },
  { name: "off-topic", description: "Non-course related chat", members: 189, messages: 456, status: "inactive" },
  { name: "jobs", description: "Job opportunities and career", members: 278, messages: 123, status: "active" },
  { name: "random", description: "Random conversations", members: 156, messages: 678, status: "inactive" },
];

const people = [
  { name: "John Doe", email: "john@email.com", date: "2026-01-15", messages: 234 },
  { name: "Jane Smith", email: "jane@email.com", date: "2026-01-10", messages: 567 },
  { name: "Mike Johnson", email: "mike@email.com", date: "2026-02-01", messages: 89 },
  { name: "Sarah Wilson", email: "sarah@email.com", date: "2026-02-15", messages: 145 },
  { name: "David Brown", email: "david@email.com", date: "2025-12-01", messages: 892 },
];

const basePosts: Omit<Post, "id" | "channelId">[] = [
  {
    initials: "AT",
    author: "Admin Team",
    time: "2 hours ago",
    text: "Welcome to TalentCona Community! 🎉 This is your space to connect, learn, and grow together. Please read our community guidelines and introduce yourself!",
    reactions: [{ emoji: "❤️", count: 24 }, { emoji: "🎉", count: 18 }],
    replies: 12,
    pinned: true,
  },
  {
    initials: "SC",
    author: "Sarah Chen",
    time: "1 hour ago",
    text: "Quick tip for Front-End Development Program beginners: Always use the key prop when rendering lists! It helps Front-End Development Program identify which items have changed.",
    reactions: [{ emoji: "💡", count: 15 }, { emoji: "👍", count: 8 }],
    replies: 6,
  },
  {
    initials: "MR",
    author: "Michael Rodriguez",
    time: "45 min ago",
    text: "Just completed my first full-stack project! Thanks to everyone who helped me along the way. The mentorship here is incredible! 🔥",
    reactions: [{ emoji: "🔥", count: 22 }, { emoji: "🎉", count: 14 }],
    replies: 8,
  },
  {
    initials: "EJ",
    author: "Emily Johnson",
    time: "30 min ago",
    text: "Does anyone have recommendations for CSS Grid resources? I'm struggling with the gallery layout assignment. Any help would be appreciated! 🙏",
    reactions: [{ emoji: "❤️", count: 5 }],
    replies: 4,
  },
  {
    initials: "DK",
    author: "David Kim",
    time: "15 min ago",
    text: "Pro tip: Use Front-End Development Program DevTools to debug your components. It's a game changer for understanding component state and props!",
    reactions: [{ emoji: "💡", count: 10 }, { emoji: "👍", count: 6 }],
    replies: 3,
  },
];

const activity: Omit<Activity, "id">[] = [
  { name: "John Doe", action: "posted in #general", time: "2 minutes ago" },
  { name: "Jane Smith", action: "joined the Communities", time: "15 minutes ago" },
  { name: "Mike Johnson", action: "posted in #help", time: "1 hour ago" },
  { name: "Sarah Wilson", action: "reacted to a message", time: "2 hours ago" },
];

type Seed = Pick<Community, "id" | "name" | "emoji" | "description" | "category" | "memberCount"> & {
  channelCount: number;
  messagesToday: number;
  flagged: number;
};

/** Builds one community with its own copies of the shared sample rows. */
function seed(s: Seed): Community {
  const channels = baseChannels.slice(0, s.channelCount).map((c) => ({ ...c, id: `${s.id}-${c.name}` }));
  return {
    id: s.id,
    name: s.name,
    emoji: s.emoji,
    description: s.description,
    category: s.category,
    status: "active",
    memberCount: s.memberCount,
    messagesToday: s.messagesToday,
    flagged: s.flagged,
    channels,
    members: people.map((p, i) => ({
      id: `${s.id}-m${i}`,
      name: p.name,
      email: p.email,
      joined: p.date,
      messages: p.messages,
      status: p.name === "Mike Johnson" ? "suspended" : "active",
    })),
    pending: people.map((p, i) => ({
      id: `${s.id}-p${i}`,
      name: p.name,
      email: p.email,
      requested: p.date,
      program: "Mobile Dev & UI/UX",
    })),
    activity: activity.map((a, i) => ({ ...a, id: `${s.id}-a${i}` })),
    posts: basePosts.map((p, i) => ({
      ...p,
      reactions: p.reactions.map((r) => ({ ...r })),
      id: `${s.id}-post${i}`,
      channelId: channels[0]!.id,
    })),
  };
}

export const initialCommunities: Community[] = [
  seed({
    id: "frontend-engineering",
    name: "Frontend Engineering",
    emoji: "💻",
    description:
      "A community for Front-End Development Program developers to share knowledge, best practices, and latest updates",
    category: "Programming",
    memberCount: 342,
    channelCount: 8,
    messagesToday: 1240,
    flagged: 3,
  }),
  seed({
    id: "data-science",
    name: "Data Science",
    emoji: "📊",
    description: "Discuss data analysis, machine learning and visualisation projects",
    category: "Data",
    memberCount: 287,
    channelCount: 6,
    messagesToday: 860,
    flagged: 1,
  }),
  seed({
    id: "ux-design",
    name: "UX Design",
    emoji: "🎨",
    description: "Share design critiques, research methods and portfolio work",
    category: "Design",
    memberCount: 198,
    channelCount: 5,
    messagesToday: 412,
    flagged: 0,
  }),
  seed({
    id: "backend-development",
    name: "Backend Development",
    emoji: "⚙️",
    description: "APIs, databases and server-side architecture",
    category: "Programming",
    memberCount: 256,
    channelCount: 7,
    messagesToday: 734,
    flagged: 2,
  }),
  seed({
    id: "mobile-development",
    name: "Mobile Development",
    emoji: "📱",
    description: "Building apps for iOS and Android",
    category: "Programming",
    memberCount: 145,
    channelCount: 4,
    messagesToday: 298,
    flagged: 0,
  }),
];
