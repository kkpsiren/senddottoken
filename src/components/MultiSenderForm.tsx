'use client'

import { useState } from 'react'
import { encodeFunctionData, parseEther } from 'viem'
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

export const MultiSenderForm = () => {
  const { walletProvider } = useAppKitProvider<Provider>('eip155')
  const { isConnected } = useAppKitAccount()

  const [useToken, setUseToken] = useState(false)
  const [token, setToken] = useState('')
  const [recipients, setRecipients] = useState('')
  const [amounts, setAmounts] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus(null)
    setError(null)

    if (!multisenderAddress) {
      setError('Multisender address is not configured')
      return
    }

    const recips = recipients.split(',').map((r) => r.trim()).filter(Boolean)
    const amnts = amounts.split(',').map((a) => a.trim()).filter(Boolean)

    if (recips.length !== amnts.length) {
      setError('Recipients and amounts length mismatch')
      return
    }

    try {
      const values = amnts.map((a) => parseEther(a as `${number}`))
      const data = encodeFunctionData({
        abi,
        functionName: useToken ? 'disperseToken' : 'disperseEther',
        args: useToken ? [token, recips, values] : [recips, values]
      })

      const tx = {
        to: multisenderAddress,
        data,
        value: useToken ? '0x0' : values.reduce((sum, v) => sum + v, 0n).toString(16)
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
        <label>
          <input
            type="checkbox"
            checked={useToken}
            onChange={(e) => setUseToken(e.target.checked)}
          />
          {' '}Sending ERC-20 Token
        </label>
      </div>
      {useToken && (
        <div>
          <input
            type="text"
            placeholder="token address"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            style={{ width: '300px' }}
          />
        </div>
      )}
      <div>
        <textarea
          placeholder="recipients,comma,separated"
          value={recipients}
          onChange={(e) => setRecipients(e.target.value)}
          style={{ width: '300px', height: '60px' }}
        />
      </div>
      <div>
        <textarea
          placeholder="amounts,comma,separated"
          value={amounts}
          onChange={(e) => setAmounts(e.target.value)}
          style={{ width: '300px', height: '60px' }}
        />
      </div>
      <button type="submit">Submit</button>
      {status && <p style={{ color: 'green' }}>{status}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  )
}
