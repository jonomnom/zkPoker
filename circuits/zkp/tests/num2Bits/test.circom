pragma circom 2.0.0;

include "../../algebra.circom";

template Test() {
    signal input a;
    signal input b;
    signal input d[4];
    signal output c;
    c <== a*b;

    component conversion = Num2Bits(4);
    conversion.in <== a;
    for (var i = 0; i < 4; i++) {
        conversion.out[i] === d[i];
    }
}

component main = Test();
