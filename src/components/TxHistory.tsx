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

export const TxHistory = () => {
  const publicClient = usePublicClient();
  const [txs, setTxs] = useState<TxInfo[]>([]);

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
        const logs = [...etherLogs, ...tokenLogs];
        const detailed = await Promise.all(
          logs.map(async (log) => {
            const block = await publicClient.getBlock({
              blockNumber: log.blockNumber,
            });
            return {
              hash: log.transactionHash,
              timestamp: Number(block.timestamp),
              value: (log as { args: { totalAmount: bigint } }).args.totalAmount,
              recipients: (
                log as { args: { numRecipients: bigint } }
              ).args.numRecipients,
            } as TxInfo;
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
          <th>Value</th>
          <th>Recipients</th>
          <th>Tx</th>
        </tr>
      </thead>
      <tbody>
        {txs.map((tx) => (
          <tr key={tx.hash}>
            <td>{new Date(tx.timestamp * 1000).toLocaleString()}</td>
            <td>{tx.value.toString()}</td>
            <td>{tx.recipients.toString()}</td>
            <td>
              <a
                href={`https://explorer.lens.xyz/tx/${tx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {tx.hash.slice(0, 6)}...{tx.hash.slice(-4)}
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
