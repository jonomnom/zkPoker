pragma circom 2.0.0;

include "./permutation.circom";
include "./poseidon.circom";
include "./algebra.circom";
include "./elgamal.circom";

/// Currently only supports n = 52.
template ShuffleEncrypt(g, num_cards, num_bits) {
    signal input A[num_cards*num_cards];
    signal input X[2*num_cards];
    signal input R[num_cards];
    signal input pk;
    signal output Y[2*num_cards];
    signal B[2*num_cards];

    component permutation = Permutation(num_cards);
    for (var i = 0; i < num_cards*num_cards; i++) {
        permutation.in[i] <== A[i];
    }
    component elgamal[num_cards];
    for (var i = 0; i < num_cards; i++) {
        elgamal[i] = ElGamalEncrypt(num_bits, g);
        elgamal[i].m <== 1;
        elgamal[i].r <== R[i];
        elgamal[i].pk <== pk;
        B[i] <== elgamal[i].c1;
        B[num_cards + i] <== elgamal[i].c2;
    }
    component linear_transform[2];
    linear_transform[0] = LinearTransform(num_cards, num_cards);
    linear_transform[1] = LinearTransform(num_cards, num_cards);
    for (var i = 0; i < num_cards; i++) {
        linear_transform[0].X[i] <== X[i];
        linear_transform[1].X[i] <== X[num_cards+i];
    }
    for (var i = 0; i < num_cards*num_cards; i++) {
        linear_transform[0].A[i] <== A[i];
        linear_transform[1].A[i] <== A[i];
    }
    for (var i = 0; i < num_cards; i++) {
        linear_transform[0].B[i] <== B[i];
        linear_transform[1].B[i] <== B[num_cards+i];
    }
    for (var i = 0; i < num_cards; i++) {
        Y[i] <== linear_transform[0].C[i];
        Y[num_cards+i] <== linear_transform[1].C[i];
    }
}

/// Currently only supports n = 52.
template Decrypt(g, num_bits) {
    signal input Y[2];
    signal input pkP;
    signal input skP;
    signal output out;
    component exponentiation = Exponentiation(num_bits);
    exponentiation.exponent <== skP;
    exponentiation.base <== g;
    pkP === exponentiation.out;
    component decrypt = ElGamalDecrypt(num_bits);
    decrypt.c1 <== Y[0];
    decrypt.c2 <== Y[1];
    decrypt.sk <== skP;
    out <== decrypt.m;
}
