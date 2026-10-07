import { BanIcon, MailIcon, MapPinIcon, PhoneIcon, SendIcon, SquarePenIcon } from "@/components/app/icons";
import { initials, type Student } from "./data";
import styles from "./StudentHero.module.css";

/** Purple student header: avatar, name, badges, contact details and actions. */
export default function StudentHero({ student, subtitle }: { student: Student; subtitle?: string }) {
  return (
    <section className={styles.hero} aria-label="Student">
      <div className={styles.avatar} aria-hidden="true">
        {initials(student.name)}
      </div>

      <div className={styles.identity}>
        <h1 className={styles.name}>{student.name}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        <div className={styles.badges}>
          <span className={styles.badgeStatus}>{student.status}</span>
          <span className={styles.badgeOutline}>Joined: {student.joined}</span>
        </div>
        <ul className={styles.contacts}>
          <li>
            <MailIcon size={16} color="#FFFFFF" strokeWidth={2} />
            <a href={`mailto:${student.email}`}>{student.email}</a>
          </li>
          <li>
            <PhoneIcon size={16} color="#FFFFFF" strokeWidth={2} />
            <a href={`tel:${student.phone.replace(/[^+\d]/g, "")}`}>{student.phone}</a>
          </li>
          <li>
            <MapPinIcon size={16} color="#FFFFFF" strokeWidth={2} />
            <span>{student.location}</span>
          </li>
        </ul>
      </div>

      <div className={styles.actions}>
        <button type="button" className={`${styles.action} ${styles.actionAssign}`}>
          <SquarePenIcon size={16} color="#364153" strokeWidth={2} />
          Assign Mentor
        </button>
        <button type="button" className={styles.action}>
          <SendIcon size={16} color="#364153" strokeWidth={2} />
          Notify
        </button>
        <button type="button" className={`${styles.action} ${styles.actionDanger}`}>
          <BanIcon size={16} color="#C10007" strokeWidth={2} />
          Suspend
        </button>
      </div>
    </section>
  );
}
