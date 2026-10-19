import { Hash } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ActionMenu, StatusPill, tableClasses as t } from "./shared";
import type { Channel } from "./data";

/** Channels tab (Figma 293:32320). Clicking a row opens the channel chat. */
export function ChannelsTab({
  channels,
  onCreate,
  onOpen,
  onEdit,
  onToggle,
  onDelete,
}: {
  channels: Channel[];
  onCreate: () => void;
  onOpen: (channel: Channel) => void;
  onEdit: (channel: Channel) => void;
  onToggle: (channel: Channel) => void;
  onDelete: (channel: Channel) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl leading-7 font-bold text-gray-900">Channel Management</h2>
        <Button
          onClick={onCreate}
          className="h-10 gap-3 px-4 font-semibold"
          icon={<Hash aria-hidden className="size-4.5" />}
        >
          Create Channel
        </Button>
      </div>

      <div className={t.wrap}>
        <table className={t.table}>
          <thead className={t.head}>
            <tr>
              <th className={t.th}>Channel</th>
              <th className={`${t.th} w-26.25`}>Members</th>
              <th className={`${t.th} w-26.25`}>Messages</th>
              <th className={`${t.th} w-26.25`}>Status</th>
              <th className={`${t.th} w-26.25`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {channels.map((c) => {
              const active = c.status === "active";
              return (
                <tr
                  key={c.id}
                  onClick={() => onOpen(c)}
                  className={`${t.row} cursor-pointer hover:bg-gray-50`}
                >
                  <td className={t.td}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpen(c);
                      }}
                      className="flex items-center gap-2 text-base leading-6 font-medium text-gray-900 hover:text-primary"
                    >
                      <Hash aria-hidden className="size-4 text-gray-400" />
                      {c.name}
                    </button>
                    <p className="text-gray-500">{c.description}</p>
                  </td>
                  <td className={t.td}>{c.members}</td>
                  <td className={t.td}>{c.messages}</td>
                  <td className={t.td}>
                    <StatusPill status={c.status}>{active ? "Active" : "Inactive"}</StatusPill>
                  </td>
                  <td className={t.td}>
                    <ActionMenu
                      label={`Actions for #${c.name}`}
                      items={[
                        { label: "View", onSelect: () => onOpen(c) },
                        ...(active ? [{ label: "Edit", onSelect: () => onEdit(c) }] : []),
                        { label: active ? "Deactivate" : "Activate", onSelect: () => onToggle(c) },
                        { label: "Delete", onSelect: () => onDelete(c), danger: true },
                      ]}
                    />
                  </td>
                </tr>
              );
            })}
            {channels.length === 0 && (
              <tr className={t.row}>
                <td colSpan={5} className={`${t.td} py-10 text-center text-gray-500`}>
                  No channels yet. Create one to get the conversation going.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
