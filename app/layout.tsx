import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

export const metadata: Metadata = {
  title: "FreelanceOS — Client Acquisition System",
  description: "Personal freelance management system for web development client acquisition.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
