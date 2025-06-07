"use client";
import { Header } from "@/components/Header";
import { MultiSenderForm } from "@/components/MultiSenderForm";
import { TxHistory } from "@/components/TxHistory";
import { Footer } from "@/components/Footer";
import { useAppKitAccount } from "@reown/appkit/react-core";

export default function Home() {
  const { isConnected } = useAppKitAccount();
  return (
    <>
      <Header />
      <main className="container">
        <MultiSenderForm />
        {isConnected && (
          <details className="history mt-xl" open>
            <summary>Transaction History</summary>
            <TxHistory />
          </details>
        )}
      </main>
      <Footer />
    </>
  );
}
