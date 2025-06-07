"use client";

import { useState, useMemo } from "react";
import { encodeFunctionData, parseUnits, type Address } from "viem";
import { useAppKitAccount } from "@reown/appkit/react-core";
import { multisenderAddress, config } from "@/config";
import { Spinner } from "./Spinner";
import { Toast } from "./Toast";
import { useClientMounted } from "@/hooks/useClientMount";
import { useSendTransaction, useBalance } from "wagmi";
import { resolveRecipient } from "@/utils/lensAccounts";
import { readContract, waitForTransactionReceipt } from "wagmi/actions";
import { tokenList, TokenSymbol } from "@/constants/tokens";

const abi = [
  {
    name: "disperseEther",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "recipients", type: "address[]" },
      { name: "amounts", type: "uint256[]" },
    ],
    outputs: [],
  },
  {
    name: "disperseToken",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "recipients", type: "address[]" },
      { name: "amounts", type: "uint256[]" },
    ],
    outputs: [],
  },
] as const;

const erc20Abi = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

const tipRecipient = process.env.NEXT_PUBLIC_TIP_RECIPIENT;

// Utility to truncate messages
const truncateMsg = (msg: string | null, maxLen = 60) => {
  if (!msg) return msg;
  if (msg.toLowerCase().includes("user rejected"))
    return "User rejected transaction";
  return msg.length > maxLen ? msg.slice(0, maxLen) + "…" : msg;
};

export const MultiSenderForm = () => {
  const { address, isConnected } = useAppKitAccount();
  const mounted = useClientMounted();

  // State
  const [entries, setEntries] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState<TokenSymbol>(
    tokenList[0].symbol
  );
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [txLink, setTxLink] = useState<string | null>(null);
  const [tipAmount, setTipAmount] = useState("");
  const [tipStatus, setTipStatus] = useState<string | null>(null);
  const [tipError, setTipError] = useState<string | null>(null);
  const [tipLoading, setTipLoading] = useState(false);
  const [tipTxLink, setTipTxLink] = useState<string | null>(null);

  // Token selection
  const selectedToken = tokenList.find((t) => t.symbol === selectedSymbol)!;

  // Wagmi hooks for balance
  const { data: nativeBalance } = useBalance({
    address: address as Address,
  });
  const { data: tokenBalance } = useBalance({
    address: address as Address,
    token: selectedToken.address as Address,
  });

  // Wagmi send transaction
  const { sendTransactionAsync } = useSendTransaction();

  // Summary
  const summary = useMemo(() => {
    let count = 0;
    let total = 0n;
    entries
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((line) => {
        const [r, a] = line.split(",");
        if (r && a) {
          count++;
          try {
            total += parseUnits(
              a.trim() as `${number}`,
              selectedToken.decimals
            );
          } catch {
            // ignore invalid amounts
          }
        }
      });
    // Add tip to total if present and valid
    if (
      tipRecipient &&
      tipAmount &&
      !isNaN(Number(tipAmount)) &&
      Number(tipAmount) > 0
    ) {
      try {
        total += parseUnits(tipAmount, selectedToken.decimals);
        count++;
      } catch {}
    }
    return { count, total };
  }, [entries, selectedToken, tipAmount, tipRecipient]);

  const userBalance = selectedToken.address
    ? tokenBalance?.value ?? 0n
    : nativeBalance?.value ?? 0n;
  const insufficientBalance = userBalance < summary.total;

  const prettyTotal = useMemo(() => {
    return `${(
      Number(summary.total) /
      10 ** selectedToken.decimals
    ).toLocaleString(undefined, {
      maximumFractionDigits: 6,
    })} $${selectedSymbol}`;
  }, [summary.total, selectedToken.decimals, selectedSymbol]);

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    setError(null);
    setTxLink(null);

    if (!isConnected || !address) {
      setError("Wallet not connected");
      setLoading(false);
      return;
    }
    if (!multisenderAddress) {
      setError("Multisender address is not configured");
      setLoading(false);
      return;
    }

    const recips: Address[] = [];
    const values: bigint[] = [];
    const lines = entries
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    for (const line of lines) {
      const [r, a] = line.split(",");
      if (r && a) {
        try {
          const resolved = await resolveRecipient(r.trim());
          recips.push(resolved as Address);
          values.push(
            parseUnits(a.trim() as `${number}`, selectedToken.decimals)
          );
        } catch {
          setError(`Invalid recipient: ${r.trim()}`);
          setLoading(false);
          return;
        }
      }
    }
    // Add tip as an extra recipient if set
    if (
      tipRecipient &&
      tipAmount &&
      !isNaN(Number(tipAmount)) &&
      Number(tipAmount) > 0
    ) {
      try {
        recips.push(tipRecipient as Address);
        values.push(parseUnits(tipAmount, selectedToken.decimals));
      } catch {}
    }

    if (recips.length === 0) {
      setError("No valid entries");
      setLoading(false);
      return;
    }

    const total = values.reduce((s, v) => s + v, 0n);
    const bal = userBalance;
    if (bal < total) {
      setError("Insufficient balance");
      setLoading(false);
      return;
    }

    try {
      if (selectedToken.address) {
        const allowance = await readContract(config, {
          abi: erc20Abi,
          address: selectedToken.address as Address,
          functionName: "allowance",
          args: [address as Address, multisenderAddress as Address],
        });
        if (allowance < total) {
          const approveData = encodeFunctionData({
            abi: erc20Abi,
            functionName: "approve",
            args: [multisenderAddress as Address, total],
          });
          const approveHash = await sendTransactionAsync({
            to: selectedToken.address as Address,
            data: approveData,
            account: address as Address,
          });
          setStatus(
            `Approval tx sent: https://explorer.lens.xyz/tx/${approveHash}`
          );
          await waitForTransactionReceipt(config, { hash: approveHash });
        }
      }

      // Prepare calldata for disperseEther or disperseToken
      let data: `0x${string}`;
      if (selectedToken.address) {
        // disperseToken(address token, address[] recipients, uint256[] amounts)
        data = encodeFunctionData({
          abi,
          functionName: "disperseToken",
          args: [selectedToken.address as Address, recips, values],
        });
      } else {
        // disperseEther(address[] recipients, uint256[] amounts)
        data = encodeFunctionData({
          abi,
          functionName: "disperseEther",
          args: [recips, values],
        });
      }

      // Send transaction
      const hash = await sendTransactionAsync({
        to: multisenderAddress as Address,
        data,
        value: selectedToken.address ? undefined : total,
        account: address as Address,
      });
      const url = `https://explorer.lens.xyz/tx/${hash}`;
      setTxLink(url);
      setStatus(`Transaction sent: ${url}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Transaction failed");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <form onSubmit={handleSubmit} className="card field">
      {/* === 1. Token selector row === */}
      <div className="field-row">
        <label htmlFor="token">Token</label>
        <select
          id="token"
          className="select"
          value={selectedSymbol}
          onChange={(e) => setSelectedSymbol(e.target.value as TokenSymbol)}
        >
          {tokenList.map((t) => (
            <option key={t.symbol} value={t.symbol}>
              {t.symbol}
            </option>
          ))}
        </select>
        {isConnected && (
          <span className="total-line" style={{ fontSize: 12 }}>
            Balance:{" "}
            {selectedToken.address
              ? tokenBalance?.formatted
              : nativeBalance?.formatted}
            {" $"}
            {selectedSymbol}
          </span>
        )}
      </div>

      {/* === 2. Recipients textarea === */}
      <div className="field">
        <label htmlFor="entries">Recipients and amounts</label>
        <textarea
          id="entries"
          className="textarea"
          value={entries}
          onChange={(e) => setEntries(e.target.value)}
          placeholder={"0x123...,1\n0x456...,2\nkipto,1\nstani,2"}
        />
      </div>

      {/* === 3. Totals === */}
      <div className="total-line">
        <span>Total recipients: {summary.count}</span>
        <span>Total amount: {prettyTotal}</span>
      </div>

      {/* === 4. Optional tip === */}
      {tipRecipient && (
        <div className="field-row" style={{ marginTop: 8 }}>
          <label htmlFor="tip-amount">
            Tip developer <span style={{ fontWeight: 400 }}>(optional)</span>
          </label>
          <input
            id="tip-amount"
            type="number"
            className="select"
            value={tipAmount}
            onChange={(e) => setTipAmount(e.target.value)}
            min="0"
            step="any"
            placeholder="0"
          />
        </div>
      )}

      {/* === 5. Primary action === */}
      <button
        className="btn btn-primary btn-lg"
        type="submit"
        disabled={loading || !isConnected}
      >
        {loading ? <Spinner /> : "Send"}
      </button>

      {/* === 6. Feedback / errors unchanged === */}
      {status && (
        <Toast
          message={status}
          type="success"
          onClose={() => setStatus(null)}
        />
      )}
      {error && (
        <Toast message={error} type="error" onClose={() => setError(null)} />
      )}
      {txLink && (
        <a
          href={txLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginTop: 8, display: "block" }}
        >
          View transaction
        </a>
      )}
    </form>
  );
};
