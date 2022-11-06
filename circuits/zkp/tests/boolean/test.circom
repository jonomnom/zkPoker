pragma circom 2.0.0;

include "../../algebra.circom";

template Test() {
    signal input a;
    signal input b;
    signal output c;
    c <== a*b;

    component d = Boolean();
    d.in <== a;
}

component main = Test();
