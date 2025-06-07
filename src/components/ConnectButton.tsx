"use client";

import { useAppKitAccount, useDisconnect } from "@reown/appkit/react-core";

export const ConnectButton = () => {
  const { isConnected } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      // Optionally handle error
    }
  };
  return (
    <div>
      {isConnected ? (
        <button onClick={handleDisconnect}>Disconnect</button>
      ) : (
        <appkit-button />
      )}
    </div>
  );
};
