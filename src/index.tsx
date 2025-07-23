import React from 'react';
import ReactDOM from 'react-dom/client';
import MainApp from './MainApp';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { IotaClientProvider, WalletProvider as IotaWalletProvider } from '@iota/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { getFullnodeUrl as getIotaFullnodeUrl } from '@iota/iota-sdk/client';
import '@mysten/dapp-kit/dist/index.css';
import '@iota/dapp-kit/dist/index.css';

const suiNetworks = {
  testnet: { url: getFullnodeUrl('testnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
};

const iotaNetworks = {
  testnet: { url: getIotaFullnodeUrl('testnet') },
  mainnet: { url: getIotaFullnodeUrl('mainnet') },
};

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={suiNetworks} defaultNetwork="testnet">
        <WalletProvider autoConnect>
          <IotaClientProvider networks={iotaNetworks} defaultNetwork="testnet">
            <IotaWalletProvider autoConnect>
              <MainApp />
            </IotaWalletProvider>
          </IotaClientProvider>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  </React.StrictMode>
);