import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export default async function NavBar() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold text-brand-700">
          Nearby
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {user ? (
            <>
              <Link href="/matches" className="text-neutral-700 hover:text-brand-600">
                Matches
              </Link>
              <Link href="/connections" className="text-neutral-700 hover:text-brand-600">
                Connections
              </Link>
              <Link href="/list-room" className="text-neutral-700 hover:text-brand-600">
                List a room
              </Link>
              <span className="text-neutral-400">{user.name}</span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="text-neutral-700 hover:text-brand-600">
                Log in
              </Link>
              <Link href="/signup" className="rounded bg-brand-600 px-3 py-1.5 text-white hover:bg-brand-700">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
