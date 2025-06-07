"use client";

import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { parseAbiItem, type Address } from "viem";
import { multisenderAddress } from "@/config";
import { tokenList } from "@/constants/tokens";
import { useAppKitAccount } from "@reown/appkit/react-core";

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
  const { isConnected } = useAppKitAccount();
  const [txs, setTxs] = useState<
    (TxInfo & { tokenAddress?: string; feeEth?: string })[]
  >([]);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 6;

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
            let feeEth: string | undefined = undefined;
            try {
              const receipt = await publicClient.getTransactionReceipt({
                hash: log.transactionHash,
              });
              if (receipt && receipt.gasUsed && receipt.effectiveGasPrice) {
                const fee =
                  BigInt(receipt.gasUsed) * BigInt(receipt.effectiveGasPrice);
                feeEth = (Number(fee) / 1e18).toLocaleString(undefined, {
                  maximumFractionDigits: 6,
                });
              }
            } catch {}
            return {
              hash: log.transactionHash,
              timestamp: Number(block.timestamp),
              value: (log as { args: { totalAmount: bigint } }).args
                .totalAmount,
              recipients: (log as { args: { numRecipients: bigint } }).args
                .numRecipients,
              tokenAddress: (log as any).tokenAddress,
              feeEth,
            } as TxInfo & { tokenAddress?: string; feeEth?: string };
          })
        );
        detailed.sort((a, b) => b.timestamp - a.timestamp);
        setTxs(detailed);
        setPage(0); // reset to first page on new data
      } catch (err) {
        console.error(err);
      }
    }
    fetchLogs();
  }, []);

  if (!isConnected) return null;
  if (!txs.length) return <p>No transactions found.</p>;

  const pageCount = Math.ceil(txs.length / PAGE_SIZE);
  const pagedTxs = txs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="table-responsive">
      <table className="table">
        <thead>
          <tr>
            <th>Time</th>
            <th className="right">Total</th>
            <th className="right">Recipients</th>
            <th>TxHash</th>
            <th className="right">Fee</th>
          </tr>
        </thead>
        <tbody>
          {pagedTxs.map((tx) => {
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
                <td className="right num">
                  {formatAmountByAddress(tx.value, tx.tokenAddress)}
                </td>
                <td className="right num">{tx.recipients.toString()}</td>
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
                <td className="right num">
                  {typeof tx.feeEth === "string" && tx.feeEth !== ""
                    ? `${tx.feeEth} $GHO`
                    : "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {pageCount > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 12,
            marginTop: 16,
          }}
        >
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Prev
          </button>
          <span style={{ alignSelf: "center", fontSize: 13 }}>
            Page {page + 1} / {pageCount}
          </span>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={page === pageCount - 1}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
