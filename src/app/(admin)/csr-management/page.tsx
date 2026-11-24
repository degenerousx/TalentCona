import type { Metadata } from "next";
import { Suspense } from "react";
import StudentCreationMock from "./_mock/StudentCreationMock";

export const metadata: Metadata = { title: "CSR Management · TalentCona" };

/** UI/UX mock only — sample data, no API calls. */
export default function CsrManagementPage() {
  return (
    <Suspense>
      <StudentCreationMock />
    </Suspense>
  );
}
