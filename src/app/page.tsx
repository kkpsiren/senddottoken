import { ConnectButton } from "@/components/ConnectButton";
import { InfoList } from "@/components/InfoList";
import { ActionButtonList } from "@/components/ActionButtonList";
import { MultiSenderForm } from "@/components/MultiSenderForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import Image from 'next/image';

export default function Home() {

  return (
    <div className="pages">
      <Image src="/reown.svg" alt="Reown" width={150} height={150} priority />
      <h1>AppKit Core Next.js App Router Example</h1>
      <ThemeToggle />

      <section>
        <h2>Connect Wallet</h2>
        <ConnectButton />
      </section>

      <section>
        <h2>Actions</h2>
        <ActionButtonList />
      </section>

      <section>
        <h2>Multi&nbsp;Sender</h2>
        <MultiSenderForm />
      </section>

      <div className="advice">
        <p>
          This projectId only works on localhost. <br />
          Go to <a href="https://cloud.reown.com" target="_blank" className="link-button" rel="Reown Cloud">Reown Cloud</a> to get your own.
        </p>
      </div>

      <section>
        <h2>Debug Info</h2>
        <InfoList />
      </section>
    </div>
  );
}
