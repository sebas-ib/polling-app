"use client";

import { useRouter } from "next/navigation";
import { useClient } from "@/app/context/ClientContext";

export default function MenuPage() {
  const router = useRouter();
  const { clientName } = useClient();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0d1117] via-[#0b1b26] to-[#0f172a] text-neutral-100 px-4">
      <div className="w-full max-w-md bg-neutral-900 p-8 rounded-2xl shadow-xl border border-neutral-800 text-center">
        <h1 className="text-4xl tracking-wide text-blue-400 mb-4 uppercase"
          style={{ fontFamily: "var(--font-bebas)" }}>
          Hello {clientName || "Guest"}</h1>
        <p className="text-neutral-400 mb-6 font-medium">Select an action:</p>
        <div className="flex flex-col gap-4 w-full">
          <button
            onClick={() => router.push("/create")}
            className="bg-emerald-500 hover:bg-emerald-600 transition px-4 py-3 rounded text-white font-semibold"
          >
            Create a Poll
          </button>

          <button
            onClick={() => router.push("/join")}
            className="bg-blue-600 hover:bg-blue-700 transition px-4 py-3 rounded text-white font-semibold"
          >
            Join a Poll
          </button>
        </div>
      </div>
    </main>
  );
}
