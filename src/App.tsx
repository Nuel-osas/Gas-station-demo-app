import React, { useState } from 'react';
import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction, useSuiClient, useSignTransaction, useCurrentWallet } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import type { TransactionResult } from '@mysten/sui/transactions';
import { toHex, fromHex, toBase64 } from '@mysten/sui/utils';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

const API_KEY = process.env.REACT_APP_SUI_API_KEY || 'YOUR_SUI_API_KEY';
// Use proxy endpoint for production CORS handling, direct proxy for development
const GAS_STATION_URL = process.env.NODE_ENV === 'development' ? '' : '/api';

function App() {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const { mutate: signTransaction } = useSignTransaction();
  const suiClient = useSuiClient();
  
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('0.001');
  const [status, setStatus] = useState<{ type: 'info' | 'success' | 'error'; message: string } | null>(null);
  const [sponsoredTx, setSponsoredTx] = useState<any>(null);
  const [txDigest, setTxDigest] = useState<string | null>(null);
  
  // NFT minting states
  const [showNftForm, setShowNftForm] = useState(false);
  const [nftName, setNftName] = useState('');
  const [nftDescription, setNftDescription] = useState('');
  const [nftUrl, setNftUrl] = useState('');


  // Combined function to sponsor and execute in one flow
  const handleSponsorAndExecute = async () => {
    if (!recipientAddress) {
      setStatus({ type: 'error', message: 'Please enter a recipient address' });
      toast.error('Please enter a recipient address');
      return;
    }

    if (!currentAccount) {
      setStatus({ type: 'error', message: 'Please connect your wallet first' });
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setStatus({ type: 'info', message: 'Preparing and sponsoring transaction...' });
      toast.info('Preparing transaction...');
      
      // Create the transaction (with type assertion for TypeScript issues)
      const tx = new Transaction() as any;
      const amountInMist = parseFloat(amount) * 1_000_000_000;
      
      // For sponsored transactions, we need to get user's coins first
      const coins = await suiClient.getCoins({
        owner: currentAccount.address,
        coinType: '0x2::sui::SUI',
      });
      
      if (coins.data.length === 0) {
        setStatus({ type: 'error', message: 'No SUI coins found in your wallet' });
        toast.error('No SUI coins found in your wallet');
        return;
      }
      
      // Use the user's first coin for the transfer
      const coinToSplit = coins.data[0];
      const [coin] = tx.splitCoins(tx.object(coinToSplit.coinObjectId), [amountInMist]);
      tx.transferObjects([coin], recipientAddress);
      tx.setSender(currentAccount.address);
      
      const txBytes = await tx.build({
        client: suiClient,
        onlyTransactionKind: true,
      });
      
      const rawTxBytesHex = toHex(txBytes);
      
      // Send to gas station for sponsorship (via proxy in production)
      const response = await fetch(`${GAS_STATION_URL}/sponsor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: API_KEY,
          rawTxBytesHex,
          sender: currentAccount.address,
          network: 'testnet'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to sponsor transaction';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.message || errorMessage;
        } catch {
          errorMessage = errorText || `HTTP ${response.status}`;
        }
        console.error('Sponsorship error:', errorMessage);
        setStatus({ type: 'error', message: `Error: ${errorMessage}` });
        toast.error(`Sponsorship failed: ${errorMessage}`);
        return;
      }

      const sponsorResult = await response.json();
      
      setStatus({ type: 'info', message: 'Transaction sponsored! Signing with wallet...' });
      toast.info('Please approve the transaction in your wallet');
      
      // Immediately sign and execute the sponsored transaction
      const sponsoredBytes = fromHex(sponsorResult.txBytesHex);
      
      signTransaction(
        {
          transaction: toBase64(sponsoredBytes),
        },
        {
          onSuccess: async (userSignature) => {
            try {
              setStatus({ type: 'info', message: 'Executing transaction...' });
              
              // Execute transaction with both signatures
              const result = await suiClient.executeTransactionBlock({
                transactionBlock: sponsoredBytes,
                signature: [userSignature.signature, sponsorResult.sponsorSignature],
              });
              
              setStatus({ type: 'success', message: 'Transaction executed successfully!' });
              toast.success('Transaction successful! 🎉', {
                position: 'top-right',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
              });
              
              setTxDigest(result.digest);
              setSponsoredTx(null);
              
            } catch (execError: any) {
              console.error('Execution error:', execError);
              setStatus({ type: 'error', message: `Execution failed: ${execError.message}` });
              toast.error(`Execution failed: ${execError.message}`);
            }
          },
          onError: (error) => {
            console.error('Wallet signing error:', error);
            if (error.message.includes('Unknown value 9939') || error.message.includes('version')) {
              setStatus({ 
                type: 'error', 
                message: 'Wallet version incompatibility. Please update your wallet.' 
              });
              toast.error('Wallet version incompatibility - please update your wallet');
            } else if (error.message.includes('User rejected')) {
              setStatus({ type: 'info', message: 'Transaction cancelled by user' });
              toast.info('Transaction cancelled');
            } else {
              setStatus({ type: 'error', message: `Signing failed: ${error.message}` });
              toast.error(`Signing failed: ${error.message}`);
            }
          }
        }
      );
      
    } catch (error: any) {
      console.error('Error:', error);
      let errorMessage = error.message;
      
      if (error.message === 'Failed to fetch') {
        errorMessage = 'Failed to connect to gas station. This might be a CORS issue if running locally.';
      }
      
      setStatus({ type: 'error', message: `Error: ${errorMessage}` });
      toast.error(`Error: ${errorMessage}`);
    }
  };

  // NFT Minting function
  const handleMintNFT = async () => {
    if (!nftName || !nftDescription || !nftUrl) {
      setStatus({ type: 'error', message: 'Please fill in all NFT fields' });
      toast.error('Please fill in all NFT fields');
      return;
    }

    if (!currentAccount) {
      setStatus({ type: 'error', message: 'Please connect your wallet first' });
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setStatus({ type: 'info', message: 'Preparing NFT minting transaction...' });
      toast.info('Preparing NFT mint...');
      
      // Create the transaction
      const tx = new Transaction() as any;
      
      // Call the mint_nft function from your smart contract
      const packageId = '0x5952e88b777eeb105168a58493f2c78ff0aa56beefa6cb9f3049c8a1b6026483';
      
      tx.moveCall({
        target: `${packageId}::nft::mint_nft`,
        arguments: [
          tx.pure.string(nftName),
          tx.pure.string(nftDescription),
          tx.pure.string(nftUrl),
        ],
      });
      
      tx.setSender(currentAccount.address);
      
      const txBytes = await tx.build({
        client: suiClient,
        onlyTransactionKind: true,
      });
      
      const rawTxBytesHex = toHex(txBytes);
      
      // Send to gas station for sponsorship (via proxy in production)
      const response = await fetch(`${GAS_STATION_URL}/sponsor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: API_KEY,
          rawTxBytesHex,
          sender: currentAccount.address,
          network: 'testnet'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to sponsor NFT minting';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.message || errorMessage;
        } catch {
          errorMessage = errorText || `HTTP ${response.status}`;
        }
        console.error('Sponsorship error:', errorMessage);
        setStatus({ type: 'error', message: `Error: ${errorMessage}` });
        toast.error(`Sponsorship failed: ${errorMessage}`);
        return;
      }

      const sponsorResult = await response.json();
      
      setStatus({ type: 'info', message: 'NFT minting sponsored! Signing with wallet...' });
      toast.info('Please approve the NFT minting in your wallet');
      
      // Immediately sign and execute the sponsored transaction
      const sponsoredBytes = fromHex(sponsorResult.txBytesHex);
      
      signTransaction(
        {
          transaction: toBase64(sponsoredBytes),
        },
        {
          onSuccess: async (userSignature) => {
            try {
              setStatus({ type: 'info', message: 'Minting NFT...' });
              
              // Execute transaction with both signatures
              const result = await suiClient.executeTransactionBlock({
                transactionBlock: sponsoredBytes,
                signature: [userSignature.signature, sponsorResult.sponsorSignature],
              });
              
              setStatus({ type: 'success', message: 'NFT minted successfully!' });
              toast.success('NFT minted successfully! 🎨', {
                position: 'top-right',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
              });
              
              setTxDigest(result.digest);
              setSponsoredTx(null);
              
              // Clear NFT form
              setNftName('');
              setNftDescription('');
              setNftUrl('');
              setShowNftForm(false);
              
            } catch (execError: any) {
              console.error('Execution error:', execError);
              setStatus({ type: 'error', message: `Execution failed: ${execError.message}` });
              toast.error(`Execution failed: ${execError.message}`);
            }
          },
          onError: (error) => {
            console.error('Wallet signing error:', error);
            if (error.message.includes('User rejected')) {
              setStatus({ type: 'info', message: 'NFT minting cancelled by user' });
              toast.info('NFT minting cancelled');
            } else {
              setStatus({ type: 'error', message: `Signing failed: ${error.message}` });
              toast.error(`Signing failed: ${error.message}`);
            }
          }
        }
      );
      
    } catch (error: any) {
      console.error('Error:', error);
      let errorMessage = error.message;
      
      if (error.message === 'Failed to fetch') {
        errorMessage = 'Failed to connect to gas station. This might be a CORS issue if running locally.';
      }
      
      setStatus({ type: 'error', message: `Error: ${errorMessage}` });
      toast.error(`Error: ${errorMessage}`);
    }
  };

  return (
    <div className="App">
      <ToastContainer />
      <header className="App-header">
        <h1 style={{ color: 'white !important', background: 'none', WebkitBackgroundClip: 'unset', WebkitTextFillColor: 'white' }}>3Mate Gas Station - SUI Test App</h1>
        
        <div className="wallet-section">
          <ConnectButton />
          {currentAccount && (
            <p className="wallet-info">
              Connected: {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
            </p>
          )}
        </div>

        {status && (
          <div className={`status ${status.type}`}>
            {status.message}
          </div>
        )}

        {currentAccount && (
          <div className="form-section">
            <h2>Send SUI with Gas Sponsorship</h2>
            
            <div className="form-group">
              <label>Recipient Address:</label>
              <input
                type="text"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="0x..."
              />
            </div>

            <div className="form-group">
              <label>Amount (SUI):</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.001"
                min="0.001"
              />
            </div>

            <div className="button-group">
              <button onClick={handleSponsorAndExecute} className="primary-button">
                Send Transaction (Gas Sponsored)
              </button>
            </div>
          </div>
        )}

        {currentAccount && (
          <div className="form-section" style={{ marginTop: '20px' }}>
            <h2>Mint NFT (Gas Sponsored)</h2>
            
            <button 
              onClick={() => setShowNftForm(!showNftForm)} 
              className="primary-button"
              style={{ marginBottom: '20px' }}
            >
              {showNftForm ? 'Hide NFT Form' : 'Show NFT Form'}
            </button>
            
            {showNftForm && (
              <>
                <div className="form-group">
                  <label>NFT Name:</label>
                  <input
                    type="text"
                    value={nftName}
                    onChange={(e) => setNftName(e.target.value)}
                    placeholder="My Cool NFT"
                  />
                </div>

                <div className="form-group">
                  <label>NFT Description:</label>
                  <input
                    type="text"
                    value={nftDescription}
                    onChange={(e) => setNftDescription(e.target.value)}
                    placeholder="This is an amazing NFT"
                  />
                </div>

                <div className="form-group">
                  <label>NFT Image URL:</label>
                  <input
                    type="text"
                    value={nftUrl}
                    onChange={(e) => setNftUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="button-group">
                  <button onClick={handleMintNFT} className="success-button">
                    Mint NFT (Gas Sponsored)
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {sponsoredTx && (
          <div className="details-section">
            <h3>Sponsored Transaction Details</h3>
            <pre>{JSON.stringify({
              digest: sponsoredTx.digest,
              sponsorSignature: sponsoredTx.sponsorSignature ? '0x...' + sponsoredTx.sponsorSignature.slice(-8) : null,
              txBytesHex: sponsoredTx.txBytesHex ? '0x...' + sponsoredTx.txBytesHex.slice(-8) : null
            }, null, 2)}</pre>
            <p style={{ marginTop: '10px', fontSize: '14px', color: '#9ca3af' }}>
              Note: If wallet execution fails, the transaction has been successfully sponsored. 
              The issue is with wallet compatibility. Your gas cost would be paid by the sponsor.
            </p>
          </div>
        )}

        {txDigest && (
          <div className="success-section">
            <h3>Transaction Successful!</h3>
            <p>Transaction Digest: {txDigest}</p>
            <a 
              href={`https://testnet.suivision.xyz/txblock/${txDigest}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Explorer
            </a>
          </div>
        )}

        <div className="api-info">
          <p>Gas Station: <code>https://gas.movevm.tools</code></p>
          <p>NFT Package: <code style={{ fontSize: '12px' }}>0x5952e88b777eeb105168a58493f2c78ff0aa56beefa6cb9f3049c8a1b6026483</code></p>
          <p>Network: <code>testnet</code></p>
          <p style={{ fontSize: '12px' }}>
            Get testnet SUI from: <a href="https://faucet.sui.io/" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>
              https://faucet.sui.io/
            </a>
          </p>
          <div className="cors-warning">
            <strong>⚠️ Important:</strong> Make sure your gas station allows CORS from localhost or use a proxy.
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;