import { BigNumberish } from "ethers";
import { A, R, X } from "./constant";
//import * as snarkjs from "snarkjs"
//var snarkjs = require("snarkjs")

//const fs = require("fs")
declare global {
  interface Window { snarkjs: any; }
}


const reader = new FileReader()
const DIR = "./"
const ZKDIR = DIR + "/circuits/"

export function readFileInWeb() {
  // const res = readFile(ZKDIR + "/encrypt/test_js/test.wasm", ()=>{})
  // console.log("read file res : ", res)
}

export const pk = 27;
export const skArray = [1, 1, 1];
export const pkArray = [3, 3, 3];

export type Proof = {
  pi_a: BigNumberish[]
  pi_b: BigNumberish[][]
  pi_c: BigNumberish[]
  protocol: string
  curve: string
}

export type SolidityProof = [
  BigNumberish,
  BigNumberish,
  BigNumberish,
  BigNumberish,
  BigNumberish,
  BigNumberish,
  BigNumberish,
  BigNumberish
]

export function packToSolidityProof(proof: Proof): SolidityProof {
  return [
      proof.pi_a[0],
      proof.pi_a[1],
      proof.pi_b[0][1],
      proof.pi_b[0][0],
      proof.pi_b[1][1],
      proof.pi_b[1][0],
      proof.pi_c[0],
      proof.pi_c[1]
  ]
}

export function samplePermutation(n : number) {
  let array = []
  for (let i = 0; n; i++) {
    array.push(0)
    
  }
  let currentIndex : BigNumberish = array.length - 1;
  while (currentIndex != 0) {
    let randomIndex = Math.floor(Math.random() * currentIndex);
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    currentIndex--;
  }
  let output = Array(n*n).fill(0);
  for (let i = 0; i < n; i++) {
    output[i*n + array[i]] = 1;
  }
  return output;
}

export async function shuffleEncrypt(A : BigNumberish[], X : BigNumberish[], R : BigNumberish[], pk : number) {
  console.log("snarkjs.groth16 : ", window.snarkjs.groth16)
  console.log("snarkjs.groth16.fullProve : ", window.snarkjs.groth16.fullProve)
  const { proof, publicSignals } =
    await window.snarkjs.groth16.fullProve({
      A: A,
      X: X,
      R: R,
      pk: pk,
    }, ZKDIR + "/encrypt/test_js/test.wasm", ZKDIR + "/encrypt/zkey.20");

    return {
        proof : packToSolidityProof(proof),
        deck : publicSignals.slice(0, 104)
    }
}

export async function decrypt(Y : BigNumberish[], skP : BigNumberish[], pkP : BigNumberish[]) {
  const { proof, publicSignals } = await window.snarkjs.groth16.fullProve({ Y: Y, skP: skP, pkP: pkP }, ZKDIR + "decrypt/test_js/test.wasm", ZKDIR + "/decrypt/zkey.20");

  return {
      proof : packToSolidityProof(proof),
      card : [ publicSignals[0], Y[0], Y[1], pkP]
  }
}
