import { Header } from "@/components/Header";
import { MultiSenderForm } from "@/components/MultiSenderForm";
import { TxHistory } from "@/components/TxHistory";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="container">
        <MultiSenderForm />

        {/* collapsible on small screens to stay minimal */}
        <details className="history" open>
          <summary>Your Transaction History</summary>
          <TxHistory />
        </details>
      </main>
      <Footer />
    </>
  );
}
