"use client";

import { wagmiAdapter, projectId, networks } from "@/config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import React, { type ReactNode, useEffect } from "react";
import { WagmiProvider, type Config } from "wagmi";

// Set up queryClient
const queryClient = new QueryClient();

// Set up metadata
const metadata = {
  name: "Send.Token",
  description:
    "Send any ERC-20 token or native currency to multiple recipients.",
  url: "https://send.token", // origin must match your domain & subdomain
  icons: ["https://avatars.githubusercontent.com/u/179229932"],
};

// Create the modal
export const modal = createAppKit({
  enableEIP6963: true,
  adapters: [wagmiAdapter],
  projectId,
  networks,
  metadata,

  themeMode: "light",
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
    socials: [],
    email: false,
    swaps: false,
    onramp: false,
    send: false,
  },
  themeVariables: {
    "--w3m-accent": "#000000",
  },
});

function ContextProvider({ children }: { children: ReactNode }) {
  // Sync AppKit modal theme with app theme
  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains("dark");
      modal.setThemeMode(isDark ? "dark" : "light");
    };
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

export default ContextProvider;
