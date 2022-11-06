make clean name=$1
cd $1
circom test.circom --r1cs --wasm --sym --c
cp input.json test_js
cd test_js
snarkjs ptn bn128 17 pot12_0000.ptau
snarkjs pt2 pot12_0000.ptau pot12_final.ptau
snarkjs g16s ../test.r1cs pot12_final.ptau test_0000.zkey
snarkjs zkev test_0000.zkey verification_key.json
node generate_witness.js test.wasm input.json witness.wtns
snarkjs g16p test_0000.zkey witness.wtns proof.json public.json
snarkjs g16v verification_key.json public.json proof.json
snarkjs zkesv test_0000.zkey verifier.sol
cd ..
cd ..
make clean name=$1
