import AuthGate from "@/components/layout/AuthGate";
import Header from "@/components/layout/Header";
import IdleTimeout from "@/components/layout/IdleTimeout";
import MainScroll from "@/components/layout/MainScroll";
import RequirePrivilege from "@/components/layout/RequirePrivilege";
import ScrollLock from "@/components/layout/ScrollLock";
import Sidebar from "@/components/layout/Sidebar";

/** Shared shell (header + sidebar) for every admin module. Don't edit per-module. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    // h-dvh, in normal flow: the shell is exactly one viewport tall and ends
    // where the viewport ends, so there is never a strip of bare <body> under
    // it. (It used to be `fixed inset-0`, which took it out of flow and let a
    // stray scroll of the document slide it out from under the header.)
    // ScrollLock undoes any programmatic scroll that still gets through.
    <AuthGate>
      <IdleTimeout />
      <div id="app-shell" className="flex h-dvh flex-col overflow-hidden">
        <ScrollLock />
        <Header />
        <div className="flex min-h-0 flex-1">
          <Sidebar />
          <MainScroll>
            <RequirePrivilege>{children}</RequirePrivilege>
          </MainScroll>
        </div>
      </div>
    </AuthGate>
  );
}
