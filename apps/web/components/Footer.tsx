import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 py-6 text-center text-xs text-neutral-500">
      <Link href="/terms" className="underline hover:text-neutral-700">
        Terms of Service
      </Link>
      <span className="mx-2">·</span>
      <Link href="/privacy" className="underline hover:text-neutral-700">
        Privacy Policy
      </Link>
    </footer>
  );
}
