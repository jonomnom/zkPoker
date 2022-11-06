import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useAccount } from 'wagmi';
import { useAppDispatch } from './redux/hooks';
import GameControls from './web3/controls/gameControls';
import './App.css';
import BoardComponent from './web3/board/board';
import { useEffect } from 'react';
import ConnectButton from './web3/ConnectButton';
import web3Slice from './redux/web3';
import { Web3StateInstance } from './web3/web3LocalState';
import DevControls from './web3/controls/devControls';

function App() {
  const dispatch = useAppDispatch();
  const { address } = useAccount();

  useEffect(() => {
    console.log('add timer');
    const intervalId = setInterval(async () => {
      // This isn't very react-like (not using a selector but it works)

      // if player has joined and refresh the page, isInGame is false, so we just fetch the state
      // here and render the latest data
      // if (Web3StateInstance.isInGame) {
      console.log('refreshing...');
      const board = await Web3StateInstance.boardManager?.board();
      const proof = await Web3StateInstance.boardManager?.getShuffleProof();
      if (address && board && board.playerAddresses.includes(address)) {
        Web3StateInstance.isInGame = true;
      }

      if (proof) {
        Web3StateInstance.cardValues = proof.deck;
      }

      dispatch(web3Slice.actions.rerender());
      // }
    }, 1500); // don't be too fast, public node can take it
    return () => {
      console.log('clear timer', intervalId);
      clearInterval(intervalId);
    }
  });
  return (
    <div className="App">
      <ConnectButton />
      <BoardComponent></BoardComponent>
      <GameControls></GameControls>
      <DevControls />
      <ToastContainer />
    </div>
  );
}


export default App;
