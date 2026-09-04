import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
});

export const metadata: Metadata = {
  title: "AI Video Studio",
  description:
    "פלטפורמת AI לעריכת סרטונים לפי פורמטים מוגדרים מראש והעלאה ישירה ליוטיוב",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <NavBar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
