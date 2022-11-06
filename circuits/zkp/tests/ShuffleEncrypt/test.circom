pragma circom 2.0.0;

include "../../mental_poker.circom";

template Test() {
    var num_cards = 52;
    var g = 3;
    var num_bits = 254;
    signal input A[num_cards * num_cards];
    signal input X[2*num_cards];
    signal input R[num_cards];
    signal input pk;
    signal output Y[2*num_cards];
    component shuffle_encrypt = ShuffleEncrypt(g, num_cards, num_bits);
    for (var i = 0; i<num_cards*num_cards; i++) {
        shuffle_encrypt.A[i] <== A[i];
    }
    for (var i = 0; i<2*num_cards; i++) {
        shuffle_encrypt.X[i] <== X[i];
    }
    for (var i = 0; i<num_cards; i++) {
        shuffle_encrypt.R[i] <== R[i];
    }
    shuffle_encrypt.pk <== pk;
    for (var i = 0; i<2*num_cards; i++) {
        Y[i] <== shuffle_encrypt.Y[i];
    }
}

component main {public [X, pk]}  = Test();
