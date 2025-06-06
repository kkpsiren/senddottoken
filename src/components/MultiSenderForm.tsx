'use client'

import { useState, useEffect } from 'react'
import { encodeFunctionData, parseUnits } from 'viem'
import { useAppKitProvider, type Provider, useAppKitAccount } from '@reown/appkit/react-core'
import { multisenderAddress } from '@/config'

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

  const selectedToken = tokenList.find(t => t.symbol === selectedSymbol)!

  useEffect(() => {
    if (!address) return
    const fetchBalances = async () => {
      const result: Record<string, bigint> = {}
      for (const t of tokenList) {
        try {
          if (!t.address) {
            const bal = await walletProvider.request({
              method: 'eth_getBalance',
              params: [address, 'latest']
            }) as string
            result[t.symbol] = BigInt(bal)
          } else {
            const data = '0x70a08231' + address.slice(2).padStart(64, '0')
            const bal = await walletProvider.request({
              method: 'eth_call',
              params: [{ to: t.address, data }, 'latest']
            }) as string
            result[t.symbol] = BigInt(bal)
          }
        } catch (err) {
          result[t.symbol] = 0n
        }
      }
      setBalances(result)
    }
    fetchBalances().catch(console.error)
  }, [address, walletProvider])

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
      while (!receipt) {
        receipt = await walletProvider.request({
          method: 'eth_getTransactionReceipt',
          params: [hash]
        })
        if (!receipt) {
          await new Promise((res) => setTimeout(res, 2000))
        }
      }
      setStatus(`Transaction confirmed: https://etherscan.io/tx/${truncated}`)
    } catch (err: any) {
      setError(err.message || 'Transaction failed')
    }
  }

  if (!isConnected) return null

  return (
    <form onSubmit={handleSubmit} style={{ margin: '20px' }}>
      <div>
        <select
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
      <div>
        <textarea
          placeholder="recipient, amount per line"
          value={entries}
          onChange={(e) => setEntries(e.target.value)}
          style={{ width: '300px', height: '100px' }}
        />
      </div>
      <button type="submit">Submit</button>
      {status && <p style={{ color: 'green' }}>{status}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  )
}
