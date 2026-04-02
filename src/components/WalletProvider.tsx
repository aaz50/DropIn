"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type WalletContextValue = {
  address: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  connectError: string | null;
  clearConnectError: () => void;
};

const WalletContext = createContext<WalletContextValue | null>(null);

const STORAGE_KEY = "dropin_wallet_address";

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && window.xrpl?.crossmark) {
      setAddress(saved);
    }
  }, []);

  const connect = useCallback(async () => {
    if (!window.xrpl?.crossmark) {
      alert("Crossmark extension not found. Please install it first.");
      return;
    }
    setConnectError(null);
    try {
      const result = await window.xrpl.crossmark.methods.signInAndWait();
      const addr = result.response.data.address;
      setAddress(addr);
      localStorage.setItem(STORAGE_KEY, addr);
    } catch {
      setConnectError("Wallet connection failed — please try again");
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setConnectError(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const clearConnectError = useCallback(() => setConnectError(null), []);

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected: address !== null,
        connect,
        disconnect,
        connectError,
        clearConnectError,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}
