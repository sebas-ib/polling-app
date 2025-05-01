"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import io, { Socket } from "socket.io-client";
import apiClient from "@/app/lib/api";

type ClientContextType = {
  clientName: string;
  setClientName: (name: string) => void;
  clientId: string;
  setClientId: (id: string) => void;
  socket: Socket | null;
  showPopup: boolean;
  setShowPopup: (value: boolean) => void;
};

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: ReactNode }) {
  const [clientName, setClientName] = useState<string>("");
  const [clientId, setClientId] = useState<string>("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [mounted, setMounted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [showPopup, setShowPopup] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      apiClient
        .get("/api/get_client", { withCredentials: true })
        .then((res) => {
          const data = res.data;
          if (data.client_id) {
            setClientId(data.client_id);
          }

          if (data.client_name && data.client_name.trim() !== "" && data.client_name !== "New Client") {
            setClientName(data.client_name);
          } else {
            setShowPopup(true);
          }

          setLoading(false);
        })
        .catch((error) => {
          console.error("Error calling /api/get_client:", error);
          setShowPopup(true);
          setLoading(false);
        });
    }
  }, []);

  useEffect(() => {
    if (clientId) {
      const newSocket = io(process.env.NEXT_PUBLIC_API_URL!, {
        withCredentials: true,
      });
      setSocket(newSocket);
      console.log("Socket connected with clientId:", clientId);
      return () => {
        newSocket.disconnect();
      };
    }
  }, [clientId]);

  if (!mounted || loading) return <div className="text-white p-4">Loading...</div>;

  return (
    <ClientContext.Provider
      value={{
        clientName,
        setClientName,
        clientId,
        setClientId,
        socket,
        showPopup,
        setShowPopup,
      }}
    >
      {children}
      {showPopup && <ClientNamePopup onClose={() => setShowPopup(false)} />}
    </ClientContext.Provider>
  );
}

function ClientNamePopup({ onClose }: { onClose: () => void }) {
  const { setClientName } = useClient();
  const [nameInput, setNameInput] = useState("");

  const handleSubmit = () => {
    if (!nameInput.trim()) return;
    const formData = new FormData();
    formData.append("client_name", nameInput);

    apiClient
      .post("/api/set_name", formData, { withCredentials: true })
      .then((res) => {
        if (res.data.Result === "Success") {
          setClientName(nameInput);
          onClose();
        } else {
          alert("Failed to set your name. Please try again.");
        }
      })
      .catch((err) => {
        console.error("Error setting client name", err);
        alert("Error setting client name");
      });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-neutral-900 p-8 rounded-xl shadow-lg w-full max-w-md text-white">
        <h2 className="text-2xl font-bold mb-4 text-center">Enter Your Name</h2>
        <input
          type="text"
          placeholder="Your display name"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          className="w-full p-3 mb-4 rounded bg-neutral-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSubmit}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded text-white font-semibold"
        >
          Submit
        </button>
      </div>
    </div>
  );
}

export function useClient() {
  const context = useContext(ClientContext);
  if (!context) throw new Error("useClient must be used within a ClientProvider");
  return context;
}
