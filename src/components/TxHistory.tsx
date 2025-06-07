"use client";

import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { multisenderAddress } from "@/config";
import { parseAbiItem, type Address } from "viem";

interface TxInfo {
  hash: string;
  timestamp: number;
  value: bigint;
  recipients: bigint;
}

const etherEvent = parseAbiItem(
  "event EtherDispersed(address indexed from, uint256 totalAmount, uint256 numRecipients)"
);
const tokenEvent = parseAbiItem(
  "event TokenDispersed(address indexed token, address indexed from, uint256 totalAmount, uint256 numRecipients)"
);

const tokenList = [
  { symbol: "GHO", address: "", decimals: 18 },
  {
    symbol: "WGHO",
    address: "0x6bDc36E20D267Ff0dd6097799f82e78907105e2F",
    decimals: 18,
  },
  {
    symbol: "BONSAI",
    address: "0xB0588f9A9cADe7CD5f194a5fe77AcD6A58250f82",
    decimals: 18,
  },
  {
    symbol: "WETH",
    address: "0xE5ecd226b3032910CEaa43ba92EE8232f8237553",
    decimals: 18,
  },
  {
    symbol: "USDC",
    address: "0x88F08E304EC4f90D644Cec3Fb69b8aD414acf884",
    decimals: 6,
  },
];

function formatAmount(value: bigint, symbol: string): string {
  const token = tokenList.find((t) => t.symbol === symbol);
  if (!token) return value.toString();
  const num = Number(value) / 10 ** token.decimals;
  return `${num.toLocaleString(undefined, {
    maximumFractionDigits: 6,
  })} $${symbol}`;
}

function formatAmountByAddress(
  value: bigint,
  address: string | undefined
): string {
  if (!address) {
    // Ether (GHO)
    return formatAmount(value, "GHO");
  }
  const token = tokenList.find(
    (t) => t.address.toLowerCase() === address.toLowerCase()
  );
  if (!token) return value.toString();
  return formatAmount(value, token.symbol);
}

// Add a helper for formatting date
function formatDateTime(ts: number): string {
  const d = new Date(ts * 1000);
  // Format: YYYY-MM-DD HH:mm
  return d
    .toLocaleString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace(/,/, "");
}

export const TxHistory = () => {
  const publicClient = usePublicClient();
  const [txs, setTxs] = useState<(TxInfo & { tokenAddress?: string })[]>([]);

  useEffect(() => {
    async function fetchLogs() {
      if (!publicClient || !multisenderAddress) return;
      try {
        const etherLogs = await publicClient.getLogs({
          address: multisenderAddress as Address,
          event: etherEvent,
          fromBlock: 0n,
        });
        const tokenLogs = await publicClient.getLogs({
          address: multisenderAddress as Address,
          event: tokenEvent,
          fromBlock: 0n,
        });
        const logs = [
          ...etherLogs.map((log) => ({ ...log, tokenAddress: undefined })),
          ...tokenLogs.map((log) => ({
            ...log,
            tokenAddress: (log as any).args.token,
          })),
        ];
        const detailed = await Promise.all(
          logs.map(async (log) => {
            const block = await publicClient.getBlock({
              blockNumber: log.blockNumber,
            });
            return {
              hash: log.transactionHash,
              timestamp: Number(block.timestamp),
              value: (log as { args: { totalAmount: bigint } }).args
                .totalAmount,
              recipients: (log as { args: { numRecipients: bigint } }).args
                .numRecipients,
              tokenAddress: (log as any).tokenAddress,
            } as TxInfo & { tokenAddress?: string };
          })
        );
        detailed.sort((a, b) => b.timestamp - a.timestamp);
        setTxs(detailed);
      } catch (err) {
        console.error(err);
      }
    }
    fetchLogs();
  }, [publicClient]);

  if (!txs.length) return <p>No transactions found.</p>;

  return (
    <table>
      <thead>
        <tr>
          <th>Time</th>
          <th>Total</th>
          <th>Recipients</th>
          <th>TxHash</th>
        </tr>
      </thead>
      <tbody>
        {txs.map((tx) => {
          const explorerUrl = `https://explorer.lens.xyz/tx/${tx.hash}`;
          return (
            <tr
              key={tx.hash}
              style={{ cursor: "pointer" }}
              onClick={() =>
                window.open(explorerUrl, "_blank", "noopener,noreferrer")
              }
            >
              <td>{formatDateTime(tx.timestamp)}</td>
              <td>{formatAmountByAddress(tx.value, tx.tokenAddress)}</td>
              <td>{tx.recipients.toString()}</td>
              <td>
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  {tx.hash.slice(0, 6)}...{tx.hash.slice(-4)}
                </a>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
