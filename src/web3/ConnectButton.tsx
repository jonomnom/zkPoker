import { useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected'
import './connectButton.css';
import { useGameContract } from './useGameContract';
import { Web3StateInstance } from './web3LocalState';

export const simplifyAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(addr.length - 4)}`;

function ConnectButton() {
    const { address } = useAccount()
    Web3StateInstance.playerAddress = address;
    console.log('player address', address);
    const { connect } = useConnect({
        connector: new InjectedConnector(),
    })
    const { disconnect } = useDisconnect();

    useGameContract();
    
    return (
        <div className="connect-button">
            {address && simplifyAddress(address)}
            <div onClick={() => address ? disconnect() : connect()}>
                {address ? '' : 'Connect'}
            </div>
        </div>
    );
}

export default ConnectButton;