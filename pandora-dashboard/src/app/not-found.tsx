import Link from "next/link";
import { FlaskConical } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f5f4f0] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#e8e6df] mb-4">
          <FlaskConical className="w-8 h-8 text-[#888780]" />
        </div>
        <h1 className="text-4xl font-medium text-[#1a1a18] mb-2">404</h1>
        <p className="text-sm text-[#888780] mb-6">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a1a18] text-white text-sm rounded-lg hover:bg-[#2a2a28] transition"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
