"use client";

import {
  useAppKitAccount,
  useDisconnect,
  useAppKit,
} from "@reown/appkit/react-core";

export const ConnectButton = () => {
  const { isConnected } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();
  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch {
      // Optionally handle error
    }
  };
  return (
    <div>
      {isConnected ? (
        <button className="btn btn-outline btn-sm" onClick={handleDisconnect}>
          Disconnect
        </button>
      ) : (
        <button className="btn btn-primary btn-sm" onClick={() => open()}>
          Connect Wallet
        </button>
      )}
    </div>
  );
};
