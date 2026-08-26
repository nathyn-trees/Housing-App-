import type { Metadata } from "next";
import NavBar from "@/components/NavBar";
import VerifyEmailBanner from "@/components/VerifyEmailBanner";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nearby — housing through people you trust",
  description: "Find a room or a roommate through your actual social network, not strangers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <NavBar />
        <VerifyEmailBanner />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
