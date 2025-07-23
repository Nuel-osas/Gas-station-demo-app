import React, { useState } from 'react';
import App from './App';
import IotaWalletApp from './IotaWalletApp';
import './App.css';

type Chain = 'sui' | 'iota';

function MainApp() {
  const [selectedChain, setSelectedChain] = useState<Chain>('sui');

  return (
    <div className="main-container">
      <div className="chain-selector">
        <button 
          className={`chain-button ${selectedChain === 'sui' ? 'active' : ''}`}
          onClick={() => setSelectedChain('sui')}
        >
          SUI Network
        </button>
        <button 
          className={`chain-button ${selectedChain === 'iota' ? 'active' : ''}`}
          onClick={() => setSelectedChain('iota')}
        >
          IOTA Network
        </button>
      </div>
      
      {selectedChain === 'sui' ? <App /> : <IotaWalletApp />}
    </div>
  );
}

export default MainApp;