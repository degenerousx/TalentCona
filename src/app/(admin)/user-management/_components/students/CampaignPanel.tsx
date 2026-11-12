"use client";

import { useState } from "react";
import { HeartIcon, Share2Icon } from "@/components/icons";
import PanelState from "../shared/PanelState";
import { humanize, timeAgo, useCampaign } from "../api";
import styles from "./CampaignPanel.module.css";

const SHOWN = 5;

export default function CampaignPanel({ studentId, enrollmentId }: { studentId: string; enrollmentId: string }) {
  const query = useCampaign(studentId, enrollmentId);
  const [all, setAll] = useState(false);
  if (query.isPending || query.isError) return <PanelState query={query} noun="campaign" />;
  const c = query.data;
  if (!c) return <p className={styles.none}>No fundraising campaign funds this program.</p>;
  const contributions = all ? c.contributions : c.contributions.slice(0, SHOWN);

  return (
    <div className={styles.panel}>
      <div className={styles.main}>
        <section className={`${styles.card} ${styles.funding}`} aria-labelledby={`funding-${c.id}`}>
          <h3 id={`funding-${c.id}`} className={styles.title}>
            Funding Progress{c.status ? ` · ${humanize(c.status)}` : ""}
          </h3>
          <div className={styles.fundingBody}>
            <div className={styles.track} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={c.progress} aria-label="Funding progress">
              <div className={styles.fill} style={{ width: `${c.progress}%` }} />
            </div>
            <div className={styles.fundingMeta}>
              <span>{c.raised ?? "—"} raised</span>
              <span>{c.goal ?? "—"} goal</span>
            </div>
          </div>
        </section>

        <section className={`${styles.card} ${styles.link}`}>
          <h3 className={styles.iconTitle}>
            <Share2Icon size={20} color="#0B1026" strokeWidth={1.67} />
            <span>Campaign Link</span>
          </h3>
          <input className={styles.input} type="text" value={c.link ?? "No link yet"} readOnly aria-label="Campaign link" />
        </section>

        <section className={`${styles.card} ${styles.story}`}>
          <h3 className={styles.title}>Campaign Story</h3>
          <div className={styles.storyBody}>
            <p className={styles.storyText}>{c.story ?? "The student hasn't written a message."}</p>
            <div className={styles.field}>
              <p className={styles.fieldLabel}>Programs:</p>
              {c.programs.length ? (
                c.programs.map((p) => (
                  <span key={p} className={styles.badge} title={p}>
                    {p}
                  </span>
                ))
              ) : (
                <span className={styles.badge}>None</span>
              )}
            </div>
            <div className={styles.field}>
              <p className={styles.fieldLabel}>Laptop:</p>
              <span className={styles.badge} title={c.laptops.join(", ") || "Not requested"}>
                {c.laptops.join(", ") || "Not requested"}
              </span>
            </div>
          </div>
        </section>
      </div>

      <aside className={`${styles.card} ${styles.contributions}`}>
        <div className={styles.contribHeader}>
          <h3 className={styles.iconTitle}>
            <HeartIcon size={20} color="#FB2C36" strokeWidth={1.67} />
            <span>Contributions</span>
          </h3>
          <p className={styles.supporters}>
            {c.supporters} {c.supporters === 1 ? "supporter" : "supporters"}
          </p>
        </div>

        <ul className={styles.list}>
          {contributions.length === 0 ? (
            <li className={styles.empty}>No contributions yet.</li>
          ) : (
            contributions.map((x) => (
              <li key={x.id} className={styles.item}>
                <span className={styles.avatar} aria-hidden="true">
                  {x.name.charAt(0).toUpperCase()}
                </span>
                <div className={styles.itemBody}>
                  <p className={styles.itemTop}>
                    <span className={styles.name}>{x.name}</span>
                    <span className={styles.amount}>{x.amount}</span>
                  </p>
                  {x.message && <p className={styles.message}>{x.message}</p>}
                  {x.at && <p className={styles.ago}>{timeAgo(x.at)}</p>}
                </div>
              </li>
            ))
          )}
        </ul>

        {c.contributions.length > SHOWN && (
          <p className={styles.more}>
            <button type="button" className={styles.moreLink} onClick={() => setAll((v) => !v)}>
              {all ? "Show less" : `See all ${c.contributions.length}…`}
            </button>
          </p>
        )}
      </aside>
    </div>
  );
}
