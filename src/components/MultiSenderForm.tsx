"use client";

import { useState, useEffect, useMemo } from "react";
import { encodeFunctionData, parseUnits, type Address } from "viem";
import { useAppKitAccount } from "@reown/appkit/react-core";
import { multisenderAddress } from "@/config";
import { Spinner } from "./Spinner";
import { Toast } from "./Toast";
import { useClientMounted } from "@/hooks/useClientMount";
import { useSendTransaction, useBalance } from "wagmi";

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
] as const;

// Define a type for all token symbols
type TokenSymbol = (typeof tokenList)[number]["symbol"];

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
  const MAX_RETRIES = 15;

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
    return { count, total };
  }, [entries, selectedToken]);

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    setError(null);

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
    entries
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((line) => {
        const [r, a] = line.split(",");
        if (r && a) {
          recips.push(r.trim() as Address);
          values.push(
            parseUnits(a.trim() as `${number}`, selectedToken.decimals)
          );
        }
      });

    if (recips.length === 0) {
      setError("No valid entries");
      setLoading(false);
      return;
    }

    const total = values.reduce((s, v) => s + v, 0n);
    const bal = selectedToken.address
      ? tokenBalance?.value ?? 0n
      : nativeBalance?.value ?? 0n;
    if (bal < total) {
      setError("Insufficient balance");
      setLoading(false);
      return;
    }

    try {
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
      setStatus(`Transaction sent: https://explorer.lens.xyz/tx/${hash}`);
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
    <form onSubmit={handleSubmit} className="multi-form">
      <div className="form-group">
        <label htmlFor="token">Token</label>
        <select
          id="token"
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
          <span style={{ marginLeft: "10px" }}>
            Balance:{" "}
            {selectedToken.address
              ? tokenBalance
                ? Number(tokenBalance.value) / 10 ** selectedToken.decimals
                : "-"
              : nativeBalance
              ? Number(nativeBalance.value) / 10 ** selectedToken.decimals
              : "-"}
          </span>
        )}
      </div>
      <div className="form-group">
        <label htmlFor="entries">Recipients and amounts</label>
        <textarea
          id="entries"
          placeholder="recipient, amount per line"
          value={entries}
          onChange={(e) => setEntries(e.target.value)}
          style={{ width: "300px", height: "100px" }}
        />
      </div>
      <div className="summary">
        <p>Total recipients: {summary.count}</p>
        <p>
          Total amount: {Number(summary.total) / 10 ** selectedToken.decimals}{" "}
          {selectedSymbol}
        </p>
      </div>
      <button type="submit" disabled={loading || !isConnected}>
        {loading ? <Spinner /> : "Submit"}
      </button>
      <Toast message={status} type="success" onClose={() => setStatus(null)} />
      <Toast message={error} type="error" onClose={() => setError(null)} />
    </form>
  );
};
