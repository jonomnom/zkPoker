pragma circom 2.0.0;

include "../../algebra.circom";

template Test() {
    signal input a;
    signal input b;
    signal input d;
    signal output c;
    c <== a+b;

    component conversion = Exponentiation(254);
    conversion.base <== a;
    conversion.exponent <== b;
    d === conversion.out;
}

component main = Test();
