pragma circom 2.0.0;

include "../../mental_poker.circom";

template Test() {
    var num_bits = 254;
    var g = 3;
    signal input Y[2];
    signal input pkP;
    signal input skP;
    signal output out;
    
    component decrypt = Decrypt(g, num_bits);
    decrypt.Y[0] <== Y[0];
    decrypt.Y[1] <== Y[1];
    decrypt.pkP <== pkP;
    decrypt.skP <== skP;
    out <== decrypt.out;
}

component main {public [Y, pkP]}  = Test();
