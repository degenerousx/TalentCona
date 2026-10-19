import { Flag, Hash, MessageSquare, Users, type LucideIcon } from "lucide-react";
import { Initial } from "./shared";
import type { Community } from "./data";

function Stat({
  value,
  label,
  note,
  noteClass,
  icon: Icon,
  iconClass,
}: {
  value: string;
  label: string;
  note: string;
  noteClass: string;
  icon: LucideIcon;
  iconClass: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-2xl leading-8 font-bold text-gray-900">{value}</p>
        <Icon aria-hidden className={`size-6 ${iconClass}`} />
      </div>
      <p className="text-sm leading-5 text-gray-600">{label}</p>
      <p className={`text-xs leading-4 ${noteClass}`}>{note}</p>
    </div>
  );
}

/** Overview tab (Figma 293:32003). */
export function OverviewTab({ community }: { community: Community }) {
  const activeChannels = community.channels.filter((c) => c.status === "active").length;
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          value={community.memberCount.toLocaleString()}
          label="Total Members"
          note="+12% this month"
          noteClass="text-green-600"
          icon={Users}
          iconClass="text-blue-600"
        />
        <Stat
          value={community.messagesToday.toLocaleString()}
          label="Messages Today"
          note="Active"
          noteClass="text-blue-600"
          icon={MessageSquare}
          iconClass="text-purple-600"
        />
        <Stat
          value={String(activeChannels)}
          label="Active Channels"
          note={activeChannels === community.channels.length ? "All operational" : `${community.channels.length - activeChannels} inactive`}
          noteClass="text-gray-600"
          icon={Hash}
          iconClass="text-green-600"
        />
        <Stat
          value={String(community.flagged)}
          label="Flagged Messages"
          note={community.flagged ? "Needs review" : "All clear"}
          noteClass={community.flagged ? "text-orange-600" : "text-gray-600"}
          icon={Flag}
          iconClass="text-red-600"
        />
      </div>

      <section className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg leading-7 font-semibold text-gray-900">Recent Activity</h3>
        <ul className="flex flex-col gap-3">
          {community.activity.map((a) => (
            <li key={a.id} className="flex h-16 items-center gap-3 rounded-lg bg-gray-50 px-3">
              <Initial name={a.name} />
              <div className="min-w-0">
                <p className="truncate text-sm leading-5 text-gray-900">
                  <span className="font-semibold">{a.name}</span> {a.action}
                </p>
                <p className="text-xs leading-4 text-gray-500">{a.time}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
