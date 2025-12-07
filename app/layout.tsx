import "./globals.css";
import { AuthProvider } from "@/context/AuthProvider";

export const metadata = { title: "Chat App" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="safe-area">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
