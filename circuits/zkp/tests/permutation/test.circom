pragma circom 2.0.0;

include "../../permutation.circom";

template Test() {
    signal input a[9];
    signal output out;
    out <== a[0] * a[1];
    
    component conversion = Permutation(3);
    for (var i = 0; i<9; i++) {
        conversion.in[i] <== a[i];
    }
}

component main = Test();
