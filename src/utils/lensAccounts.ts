import { PublicClient, testnet, evmAddress } from "@lens-protocol/client";
import { fetchAccountsBulk } from "@lens-protocol/client/actions";

const client = PublicClient.create({
  environment: testnet,
  origin: "https://send.token",
});

export interface LensAccountInfo {
  address: string;
  username: string | null;
  picture: string | null;
}

export async function mapAddressesToAccounts(addresses: string[]): Promise<LensAccountInfo[]> {
  const result = await fetchAccountsBulk(client, {
    addresses: addresses.map((a) => evmAddress(a)),
  });

  if (result.isErr()) {
    throw result.error;
  }

  return result.value.map((account) => {
    return {
      address: account.address,
      username: account.username?.localName ?? null,
      picture: account.metadata?.picture ?? null,
    } as LensAccountInfo;
  });
}
