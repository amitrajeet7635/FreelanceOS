import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <TopBar />
        <main style={{ padding: "0 24px 40px", flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
