import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux'
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import reduxRootStore from './redux/rootstore';
import { createClient, WagmiConfig } from 'wagmi';
import { JSON_RPC_URL, OP_GOERLI_CHAIN_ID } from './constants/contracts';
import { providers } from 'ethers';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

const client = createClient({
    autoConnect: true,
    provider: new providers.JsonRpcProvider(JSON_RPC_URL[OP_GOERLI_CHAIN_ID], {
      chainId: OP_GOERLI_CHAIN_ID,
      name: 'op goerli',
    })
  })

root.render(
  <React.StrictMode>
    <Provider store={reduxRootStore}>
      <WagmiConfig client={client}>
        <App />
      </WagmiConfig>
    </Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
