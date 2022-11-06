pragma circom 2.0.0;

include "../../algebra.circom";

template Test() {
    signal input a[6];
    signal input x[3];
    signal input b[2];
    signal output out0;
    signal output out1;

    component conversion = LinearTransform(2, 3);
    for (var i = 0; i < 6; i++) {
        conversion.A[i] <== a[i];
    }
    for (var i = 0; i < 3; i++) {
        conversion.X[i] <== x[i];
    }
    conversion.B[0] <== b[0];
    conversion.B[1] <== b[1];
    out0 <== conversion.C[0];
    out1 <== conversion.C[1];
}

component main = Test();
