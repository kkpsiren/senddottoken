import { PublicClient, testnet } from "@lens-protocol/client";

export const lensClient = PublicClient.create({
  environment: testnet,
});
