import { AssignCheckboxIcon, CircleAlertIcon } from "@/components/app/icons";
import styles from "./MentorAssign.module.css";

/** Visually hidden checkbox drawn with the design's checkbox icons. */
export function Check({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <>
      <input type="checkbox" className={styles.srOnly} checked={checked} onChange={onChange} aria-label={label} />
      <AssignCheckboxIcon checked={checked} />
    </>
  );
}

/** The blue box explaining the Instructor and Program Advisor roles. */
export function RoleDefinitions() {
  return (
    <aside className={styles.roles} aria-label="Role definitions">
      <span className={styles.rolesIcon}>
        <CircleAlertIcon size={20} color="#155DFC" strokeWidth={1.57} />
      </span>
      <div>
        <h3 className={styles.rolesTitle}>Role Definitions</h3>
        <ul className={styles.rolesList}>
          <li>
            <b>Instructor:</b> Delivers course content and teaches technical skills
          </li>
          <li>
            <b>Program Advisor:</b> Guides students through learning journey and provides career mentorship
          </li>
        </ul>
      </div>
    </aside>
  );
}
