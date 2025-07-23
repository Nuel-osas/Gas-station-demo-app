# 3Mate Gas Station - SUI Test App

This React app allows you to test SUI transactions with gas sponsorship from the 3Mate Gas Station.

## Features

- 🔗 Connect SUI Wallet
- 💸 Send SUI with sponsored gas
- 🔑 Pre-configured with your API key
- 🎯 Testnet ready

## Setup

1. Install dependencies:
```bash
npm install
```

2. The app will connect to the live Gas Station at `https://gas.movevm.tools`

3. Start the app:
```bash
npm start
```

The app will open at `http://localhost:3000`

## How to Use

1. **Connect Wallet**: Click the "Connect Wallet" button and choose your SUI wallet

2. **Enter Transaction Details**:
   - Recipient address: The address to send SUI to
   - Amount: How much SUI to send (minimum 0.001)

3. **Request Sponsorship**: Click "Request Gas Sponsorship" to send the transaction to 3Mate Gas Station

4. **Sign & Execute**: Once sponsored, click "Sign & Execute Transaction" to complete the transfer

## Configuration

- **API Key**: `3mate_gas_station_sui_testnet_UECIwxc7MlJzyDxw` (already configured)
- **Network**: Testnet
- **Gas Station URL**: `https://gas.movevm.tools`

## Testing the Gas Station

This app will:
1. Build a SUI transfer transaction
2. Send it to your gas station API for sponsorship
3. Receive the sponsored transaction back
4. Allow you to sign and execute it with your wallet

The gas fees will be paid by the gas station, not your wallet!

## Troubleshooting

- Make sure your gas station is running
- Ensure you have SUI testnet tokens in your wallet
- Check the browser console for detailed error messages
- Verify the API key has the right permissions

## Transaction Flow

```
Your Wallet → Build Transaction → 3Mate Gas Station → Sponsored Transaction → Sign & Execute → Blockchain
```