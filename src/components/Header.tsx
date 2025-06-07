"use client";
import Image from "next/image";
import { ConnectButton } from "@/components/ConnectButton";
import { ThemeSwitch } from "@/components/ThemeSwitch";

export const Header = () => (
  <header className="header">
    <div className="header-brand">
      <Image
        src="/send_token_full.svg"
        alt="Logo"
        width={100}
        height={100}
        priority
      />
    </div>
    <div className="header-right">
      <ConnectButton />
      <ThemeSwitch />
    </div>
  </header>
);
