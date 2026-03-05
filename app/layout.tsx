import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import "bootstrap/dist/css/bootstrap.min.css";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "CadetHours3",
  description: "Volunteer hour tracking for cadets",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="en">
      <body>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
