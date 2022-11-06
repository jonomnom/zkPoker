import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { MentalPoker } from '../types/index';

type Fixture<T> = () => Promise<T>;

declare module "mocha" {
  export interface Context {
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>;
    signers: Signers;
    poker: MentalPoker;
  }
}

export interface Signers {
  admin: SignerWithAddress;
  others: SignerWithAddress[];
}
