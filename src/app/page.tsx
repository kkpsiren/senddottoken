import { ConnectButton } from "@/components/ConnectButton";
import { MultiSenderForm } from "@/components/MultiSenderForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TxHistory } from "@/components/TxHistory";
import Image from "next/image";

export default function Home() {
  return (
    <div className="pages">
      <Image src="/reown.svg" alt="Reown" width={150} height={150} priority />
      <h1>Send.Token</h1>
      <p style={{ marginBottom: 24 }}>
        Send any token on Lens chain to several recipients with different
        amounts.
        <br />
        Also supports sending directly to usernames (default namespace only).
      </p>

      <section>
        <h2>Connect Wallet</h2>
        <ConnectButton />
      </section>

      <section>
        <h2>Multi&nbsp;Sender</h2>
        <MultiSenderForm />
      </section>

      <section>
        <h2>Tx History</h2>
        <TxHistory />
      </section>

      <div className="advice">
        <a
          href="https://github.com/kkpsiren/senddottoken"
          target="_blank"
          rel="noopener noreferrer"
          className="link-button"
        >
          GitHub Repo
        </a>
      </div>
    </div>
  );
}
