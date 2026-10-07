import { PARTNERS } from "./partners";
import styles from "./PartnersPanel.module.css";

export default function PartnersPanel({ query }: { query: string }) {
  const q = query.trim().toLowerCase();
  const partners = q ? PARTNERS.filter((p) => [p.name, p.description].some((v) => v.toLowerCase().includes(q))) : PARTNERS;

  if (partners.length === 0) {
    return <p className={styles.empty}>{q ? <>No partners match “{query}”.</> : "No partners yet."}</p>;
  }

  return (
    <ul className={styles.grid}>
      {partners.map((p) => (
        <li key={p.id} className={styles.card}>
          <span className={styles.logo} style={{ background: p.color }} aria-hidden="true">
            {p.name.charAt(0)}
          </span>
          <h3 className={styles.name}>{p.name}</h3>
          <p className={styles.description}>{p.description}</p>
        </li>
      ))}
    </ul>
  );
}
