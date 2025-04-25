"use client";

import { useRouter } from "next/navigation";
import { useClient } from "@/app/context/ClientContext";

export default function MenuPage() {
  const router = useRouter();
  const { clientName } = useClient();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Welcome <span className="font-semibold">{clientName || "Guest"}</span>!</h1>
        <p className="flex flex-col items-center text-gray-600 mb-4">Select an action:</p>

        <div className="flex flex-col items-center gap-4 w-full">
          <button
            onClick={() => router.push("/create")}
            className="bg-green-500 text-white w-full py-3 rounded hover:bg-green-600 transition"
          >
            Create a Poll
          </button>

          <button
            onClick={() => router.push("/join")}
            className="bg-blue-500 text-white w-full py-3 rounded hover:bg-blue-600 transition"
          >
            Join a Poll
          </button>
        </div>
      </div>
    </main>
  );
}
