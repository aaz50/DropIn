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
};

const WalletContext = createContext<WalletContextValue | null>(null);

const STORAGE_KEY = "dropin_wallet_address";

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);

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
    const result = await window.xrpl.crossmark.methods.signInAndWait();
    const addr = result.response.data.address;
    setAddress(addr);
    localStorage.setItem(STORAGE_KEY, addr);
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <WalletContext.Provider
      value={{ address, isConnected: address !== null, connect, disconnect }}
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
