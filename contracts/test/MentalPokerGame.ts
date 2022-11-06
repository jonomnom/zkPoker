import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { expect } from 'chai';
import { artifacts, ethers, waffle } from 'hardhat';
import { MentalPokerGame } from '../types';

import type { Signers } from './types';

describe('Mental poker tests', function () {
  beforeEach(async function () {
    this.signers = {} as Signers;

    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.signers.admin = signers[0];
    this.signers.others = signers;

    const artifact = await artifacts.readArtifact('MentalPoker');
    const poker = <MentalPokerGame>await waffle.deployContract(this.signers.admin, artifact, []);
    await poker.deployed();
    this.poker = poker;

    // todo, add some tests
    it('some test', async function () {
      expect(1).to.equal(1);
    })
  });


});
