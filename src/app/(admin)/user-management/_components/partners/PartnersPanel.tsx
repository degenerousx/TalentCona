import { Handshake } from "lucide-react";
import { EmptyState } from "@/components/ui/States";
import styles from "../UserManagement.module.css";

/**
 * The backend has no admin endpoint for partners yet: Postman only has the
 * public landing-page forms (POST /partnership-requests and
 * /sponsorship-requests), with nothing to list them. So this says so instead
 * of showing sample organisations.
 */
export default function PartnersPanel() {
  return (
    <div className={styles.state}>
      <EmptyState
        icon={Handshake}
        title="Partners aren't available yet"
        description="Partnership and sponsorship requests are collected from the website, but the backend doesn't offer an admin list of partners yet. They'll appear here once that endpoint exists."
      />
    </div>
  );
}
