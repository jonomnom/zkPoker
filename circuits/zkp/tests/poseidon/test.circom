pragma circom 2.0.0;

include "../../poseidon.circom";

template Test() {
    signal input a[104];
    signal output out;
    
    component poseidon = Poseidon104();
    for (var i = 0; i<104; i++) {
        poseidon.inputs[i] <== a[i];
    }
    out <== poseidon.final_out;
}

component main = Test();
