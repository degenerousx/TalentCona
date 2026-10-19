import { ProgramWizard } from "../_components/ProgramWizard";
import { emptyDraft } from "../_components/data";

export const metadata = { title: "Create New Program · Manage Programs" };

export default function NewProgramPage() {
  return <ProgramWizard mode="create" initial={emptyDraft} />;
}
