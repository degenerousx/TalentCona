import { HeartIcon, Share2Icon } from "@/components/app/icons";
import { campaignLink, campaignStory, type Student } from "./data";
import styles from "./CampaignPanel.module.css";

const naira = (n: number) => `₦${n}`;

export default function CampaignPanel({ student }: { student: Student }) {
  const { campaign } = student;
  const pct = campaign.goal > 0 ? Math.min(campaign.raised / campaign.goal, 1) * 100 : 0;
  const link = campaignLink(campaign);

  return (
    <div className={styles.panel}>
      <div className={styles.main}>
        <section className={`${styles.card} ${styles.funding}`} aria-labelledby={`funding-${student.id}`}>
          <h3 id={`funding-${student.id}`} className={styles.title}>Funding Progress</h3>
          <div className={styles.fundingBody}>
            <div
              className={styles.track}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={campaign.goal}
              aria-valuenow={campaign.raised}
              aria-label="Funding progress"
            >
              <div className={styles.fill} style={{ width: `${pct}%` }} />
            </div>
            <div className={styles.fundingMeta}>
              <span>{naira(campaign.raised)} raised</span>
              <span>{naira(campaign.goal)} goal</span>
            </div>
          </div>
        </section>

        <section className={`${styles.card} ${styles.link}`}>
          <h3 className={styles.iconTitle}>
            <Share2Icon size={20} color="#0B1026" strokeWidth={1.67} />
            <span>Campaign Link</span>
          </h3>
          <input className={styles.input} type="text" value={link} readOnly aria-label="Campaign link" />
        </section>

        <section className={`${styles.card} ${styles.story}`}>
          <h3 className={styles.title}>Campaign Story</h3>
          <div className={styles.storyBody}>
            <p className={styles.storyText}>{campaignStory(student)}</p>
            <div className={styles.field}>
              <p className={styles.fieldLabel}>Programs:</p>
              <span className={styles.badge} title={campaign.programLabel}>{campaign.programLabel}</span>
            </div>
            <div className={styles.field}>
              <p className={styles.fieldLabel}>Laptop:</p>
              <span className={styles.badge} title={campaign.laptop ?? "Not requested"}>{campaign.laptop ?? "Not requested"}</span>
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
            {campaign.supporters} {campaign.supporters === 1 ? "supporter" : "supporters"}
          </p>
        </div>

        <ul className={styles.list}>
          {campaign.contributions.length === 0 ? (
            <li className={styles.empty}>No contributions yet.</li>
          ) : (
            campaign.contributions.map((c, i) => (
              <li key={`${c.name}-${i}`} className={styles.item}>
                <span className={styles.avatar} aria-hidden="true">{c.name.charAt(0)}</span>
                <div className={styles.itemBody}>
                  <p className={styles.itemTop}>
                    <span className={styles.name}>{c.name}</span>
                    <span className={styles.amount}>{naira(c.amount)}</span>
                  </p>
                  <p className={styles.message}>{c.message}</p>
                  <p className={styles.ago}>{c.ago}</p>
                </div>
              </li>
            ))
          )}
        </ul>

        <p className={styles.more}>
          <button type="button" className={styles.moreLink}>See More...</button>
        </p>
      </aside>
    </div>
  );
}
