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

  // Mark as mounted (client-side)
  useEffect(() => {
    setMounted(true);
  }, []);

  // On mount, retrieve client info from the server using /api/get_client.
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
            // If no client_id is returned, call /api/set_name with the client_name from context.
            console.log(
              "No client id from /api/get_client, calling /api/set_name with client_name:",
              clientName
            );
            const formData = new FormData();
            formData.append("client_name", clientName);
            axios
              .post("http://localhost:3001/api/set_name", formData, {
                withCredentials: true,
              })
              .then((res2) => {
                const newClientId = res2.data.client_id;
                if (newClientId) {
                  setClientId(newClientId);
                  console.log("Assigned new client id:", newClientId);
                } else {
                  console.error("No client_id returned from /api/set_name");
                }
              })
              .catch((error) => {
                console.error("Error calling /api/set_name:", error);
              });
          }

          if (data.client_name) {
            setClientName(data.client_name);
            console.log("Retrieved client name:", data.client_name);
          } else {
            console.log("No client name; showing popup");
            setShowPopup(true);
          }
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error calling /api/get_client:", error);
          setLoading(false);
          // In case of error, show the popup.
          setShowPopup(true);
        });
    }
  }, [clientName]);

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

  // Avoid rendering until mounted and finished loading.
  if (!mounted || loading) {
    return <div>Loading...</div>;
  }

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
