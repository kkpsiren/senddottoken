import { PublicClient, mainnet, evmAddress } from "@lens-protocol/client";
import { fetchAccountsBulk, fetchAccount } from "@lens-protocol/client/actions";

const client = PublicClient.create({
  environment: mainnet,
  origin: "https://send.token",
});

export interface LensAccountInfo {
  address: string;
  username: string | null;
  picture: string | null;
}

export const LENS_NAMESPACE = "0x1aA55B9042f08f45825dC4b651B64c9F98Af4615";

export async function mapAddressesToAccounts(
  addresses: string[]
): Promise<LensAccountInfo[]> {
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

export async function resolveRecipient(recipient: string): Promise<string> {
  if (/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
    return recipient;
  }

  const result = await fetchAccount(client, {
    username: {
      localName: recipient,
      namespace: evmAddress(LENS_NAMESPACE),
    },
  });

  if (result.isErr()) {
    throw result.error;
  }

  if (!result.value) {
    throw new Error("Username not found");
  }

  return result.value.address;
}
