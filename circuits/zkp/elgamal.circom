pragma circom 2.0.0;

include "./algebra.circom";

template ElGamalEncrypt(n, g) {
    signal input m;
    signal input r;
    signal input pk;
    signal output c1;
    signal output c2;
    component compute_c1 = Exponentiation(n);
    compute_c1.exponent <== r;
    compute_c1.base <== g;
    c1 <== compute_c1.out;
    component compute_c2 = Exponentiation(n);
    compute_c2.exponent <== r;
    compute_c2.base <== pk;
    c2 <== compute_c2.out * m;
}

template ElGamalDecrypt(n) {
    signal input c1;
    signal input c2;
    signal input sk;
    signal output m;
    component exp = Exponentiation(n);
    exp.exponent <== sk;
    exp.base <== c1;
    m <-- c2 / exp.out;
    m * exp.out === c2;
}
