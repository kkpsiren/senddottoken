'use client'

import { useState, useEffect } from 'react'
import { encodeFunctionData, parseUnits } from 'viem'
import { useAppKitProvider, type Provider, useAppKitAccount } from '@reown/appkit/react-core'
import { multisenderAddress } from '@/config'
import { lensClient } from '@/lensClient'
import { evmAddress, type AnyClient } from '@lens-protocol/client'
import { fetchAccountBalances, fetchAccountsBulk } from '@lens-protocol/client/actions'

const abi = [
  {
    name: 'disperseEther',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'recipients', type: 'address[]' },
      { name: 'amounts', type: 'uint256[]' }
    ],
    outputs: []
  },
  {
    name: 'disperseToken',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'recipients', type: 'address[]' },
      { name: 'amounts', type: 'uint256[]' }
    ],
    outputs: []
  }
] as const

const tokenList = [
  { symbol: 'GHO', address: '', decimals: 18 },
  { symbol: 'WGHO', address: '0x6bDc36E20D267Ff0dd6097799f82e78907105e2F', decimals: 18 },
  { symbol: 'BONSAI', address: '0xB0588f9A9cADe7CD5f194a5fe77AcD6A58250f82', decimals: 18 },
  { symbol: 'WETH', address: '0xE5ecd226b3032910CEaa43ba92EE8232f8237553', decimals: 18 },
  { symbol: 'USDC', address: '0x88F08E304EC4f90D644Cec3Fb69b8aD414acf884', decimals: 6 },
] as const

export const MultiSenderForm = () => {
  const { walletProvider } = useAppKitProvider<Provider>('eip155')
  const { address, isConnected } = useAppKitAccount()

  const [entries, setEntries] = useState('')
  const [balances, setBalances] = useState<Record<string, bigint>>({})
  const [selectedSymbol, setSelectedSymbol] = useState(tokenList[0].symbol)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const MAX_RETRIES = 15

  const selectedToken = tokenList.find(t => t.symbol === selectedSymbol)!

  useEffect(() => {
    if (!address) return
    const fetchBalances = async () => {
      const result = await fetchAccountBalances(lensClient as unknown as AnyClient, {
        includeNative: true,
        account: evmAddress(address),
        tokens: tokenList.filter((t) => t.address).map((t) => evmAddress(t.address)),
      })

      if (result.isErr()) {
        console.error(result.error)
        return
      }

      const map: Record<string, bigint> = {}
      for (const entry of result.value as Array<Record<string, unknown>>) {
        switch (entry.__typename) {
          case 'NativeAmount':
            map[tokenList[0].symbol] = BigInt(entry.value)
            break
          case 'Erc20Amount': {
            const token = tokenList.find(
              (t) => t.address.toLowerCase() === entry.asset.contract.address.toLowerCase()
            )
            if (token) map[token.symbol] = BigInt(entry.value)
            break
          }
        }
      }
      setBalances(map)
    }
    fetchBalances().catch(console.error)
  }, [address])

  const [accountMap, setAccountMap] = useState<Record<string, { username?: string; picture?: string }>>({})

  useEffect(() => {
    const addrs = entries
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => l.split(',')[0].trim())

    if (addrs.length === 0) {
      setAccountMap({})
      return
    }

    const fetchAccounts = async () => {
      const result = await fetchAccountsBulk(lensClient as unknown as AnyClient, {
        addresses: addrs.map((a) => evmAddress(a)),
      })

      if (result.isErr()) {
        console.error(result.error)
        return
      }

      const map: Record<string, { username?: string; picture?: string }> = {}
      for (const acc of result.value as Array<Record<string, unknown>>) {
        const addr = (acc.ownedBy?.address ?? acc.ownedBy).toLowerCase()
        map[addr] = {
          username: acc.handle?.localName ?? acc.handle?.fullHandle,
          picture:
            acc.metadata?.picture?.raw?.uri ??
            acc.metadata?.picture?.optimized?.uri ??
            undefined,
        }
      }
      setAccountMap(map)
    }

    fetchAccounts().catch(console.error)
  }, [entries])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus(null)
    setError(null)

    if (!multisenderAddress) {
      setError('Multisender address is not configured')
      return
    }

    const recips: string[] = []
    const values: bigint[] = []
    entries
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((line) => {
        const [r, a] = line.split(',')
        if (r && a) {
          recips.push(r.trim())
          values.push(parseUnits(a.trim() as `${number}`, selectedToken.decimals))
        }
      })

    if (recips.length === 0) {
      setError('No valid entries')
      return
    }

    const total = values.reduce((s, v) => s + v, 0n)
    const bal = balances[selectedSymbol] || 0n
    if (bal < total) {
      setError('Insufficient balance')
      return
    }

    try {
      const data = encodeFunctionData({
        abi,
        functionName: selectedToken.address ? 'disperseToken' : 'disperseEther',
        args: selectedToken.address ? [selectedToken.address, recips, values] : [recips, values]
      })

      const tx = {
        to: multisenderAddress,
        data,
        value: selectedToken.address ? '0x0' : total.toString(16)
      }

      const hash: string = await walletProvider.request({
        method: 'eth_sendTransaction',
        params: [tx]
      })

      const truncated = `${hash.slice(0, 6)}...${hash.slice(-4)}`
      setStatus(`Transaction sent: https://etherscan.io/tx/${truncated}`)

      let receipt = null
      let retries = 0
      while (!receipt && retries < MAX_RETRIES) {
        receipt = await walletProvider.request({
          method: 'eth_getTransactionReceipt',
          params: [hash]
        })
        if (!receipt) {
          await new Promise((res) => setTimeout(res, 2000))
          retries++
        }
      }
      if (!receipt) {
        setError('Transaction not confirmed. Please check the explorer.')
        return
      }
      setStatus(`Transaction confirmed: https://etherscan.io/tx/${truncated}`)
    } catch (err: unknown) {
      setError((err as Error).message || 'Transaction failed')
    }
  }

  if (!isConnected) return null

  return (
    <form onSubmit={handleSubmit} className="multi-form">
      <div className="form-group">
        <label htmlFor="token">Token</label>
        <select
          id="token"
          value={selectedSymbol}
          onChange={(e) => setSelectedSymbol(e.target.value)}
        >
          {tokenList.map((t) => (
            <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
          ))}
        </select>
        {balances[selectedSymbol] !== undefined && (
          <span style={{ marginLeft: '10px' }}>
            Balance: {Number(balances[selectedSymbol]) / 10 ** selectedToken.decimals}
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
        style={{ width: '300px', height: '100px' }}
      />
      {Object.keys(accountMap).length > 0 && (
        <ul>
          {Object.entries(accountMap).map(([addr, info]) => (
            <li key={addr} style={{ display: 'flex', alignItems: 'center' }}>
              <span>{addr}</span>
              {info.username && <span style={{ marginLeft: '6px' }}> - {info.username}</span>}
              {info.picture && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={info.picture} alt={info.username ?? addr} width={20} height={20} style={{ marginLeft: '6px' }} />
              )}
            </li>
          ))}
        </ul>
      )}
      </div>
      <button type="submit">Submit</button>
      {status && <p style={{ color: 'green' }}>{status}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  )
}

