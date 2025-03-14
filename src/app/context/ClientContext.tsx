"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import io, { Socket } from "socket.io-client";
import axios from "axios";

type ClientContextType = {
  clientName: string;
  setClientName: (name: string) => void;
  clientId: string;
  setClientId: (id: string) => void;
  socket: Socket | null;
};

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: ReactNode }) {
  // These values are stored on the server as HTTP-only cookies.
  // We retrieve them via an API call.
  const [clientName, setClientName] = useState<string>("");
  const [clientId, setClientId] = useState<string>("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [mounted, setMounted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [showPopup, setShowPopup] = useState<boolean>(false);

  // Mark as mounted (client-side)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get client info from the server. The /get_client endpoint should read the HTTP‑only cookies.
  useEffect(() => {
    if (typeof window !== "undefined") {
      axios
        .get("http://localhost:3001/api/get_client", { withCredentials: true })
        .then((res) => {
          const data = res.data; // expected: { client_id, client_name }
          if (data.client_id) {
            setClientId(data.client_id);
            console.log("Retrieved client id:", data.client_id);
          } else {
            // If no client_id, call /assign_client to generate one.
            console.log("No client id from /get_client, calling /assign_client");
            axios
              .get("http://localhost:3001/api/assign_client", { withCredentials: true })
              .then((res2) => {
                const newClientId = res2.data.client_id;
                if (newClientId) {
                  setClientId(newClientId);
                  console.log("Assigned new client id:", newClientId);
                } else {
                  console.error("No client_id returned from /assign_client");
                }
              })
              .catch((error) => {
                console.error("Error calling /assign_client:", error);
              });
          }

          // If client_name is provided by /get_client, update state.
          if (data.client_name) {
            setClientName(data.client_name);
            console.log("Retrieved client name:", data.client_name);
          } else {
            // If client_name is missing, trigger popup.
            setShowPopup(true);
            console.log("No client name; showing popup");
          }
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error calling /get_client:", error);
          setLoading(false);
        });
    }
  }, []);

  // Establish socket connection after clientId is available.
  useEffect(() => {
    if (clientId) {
      const newSocket = io("http://localhost:3001", { withCredentials: true });
      setSocket(newSocket);
      console.log("Socket connected with clientId:", clientId);
      return () => {
        newSocket.disconnect();
      };
    }
  }, [clientId]);

  // Prevent rendering until we are mounted and loading is complete.
  if (!mounted || loading) {
    return <div>Loading...</div>;
  }

  return (
    <ClientContext.Provider
      value={{ clientName, setClientName, clientId, setClientId, socket }}
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
    axios
      .post("http://localhost:3001/api/set_name", formData, { withCredentials: true })
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
    <div style={popupStyle}>
      <h2>Please set your display name</h2>
      <input
        type="text"
        placeholder="Enter your name"
        value={nameInput}
        onChange={(e) => setNameInput(e.target.value)}
        style={{ padding: "8px", marginBottom: "8px" }}
      />
      <button onClick={handleSubmit} style={{ padding: "8px 16px" }}>
        Submit
      </button>
    </div>
  );
}

// Simple inline style for the popup (adjust as needed)
const popupStyle: React.CSSProperties = {
  position: "fixed",
  top: "30%",
  left: "50%",
  transform: "translate(-50%, -30%)",
  backgroundColor: "white",
  border: "1px solid #ccc",
  borderRadius: "4px",
  padding: "16px",
  zIndex: 1000,
};

export function useClient() {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error("useClient must be used within a ClientProvider");
  }
  return context;
}
