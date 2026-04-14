import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { KeyboardManager } from "@/components/features/KeyboardManager";
import { FocusProvider } from "@/components/features/FocusContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <KeyboardManager />
      <Sidebar />
      <div className="main-content">
        <TopBar />
        <FocusProvider>
          <main style={{ padding: "0 24px 40px", flex: 1 }}>
            {children}
          </main>
        </FocusProvider>
      </div>
    </div>
  );
}
