pragma circom 2.0.0;

template Boolean() {
    signal input in;
    in * (in -1) === 0;
}

template Num2Bits(n) {
    signal input in;
    signal output out[n];
    var lc = 0;
    var e2=1;
    for (var i = 0; i<n; i++) {
        out[i] <-- (in >> i) & 1;
        out[i] * (out[i] -1 ) === 0;
        lc += out[i] * e2;
        e2 = e2+e2;
    }
    lc === in;
}

// out = base ** exponent
// n is the number of bits
// TODO: current implementation does not exploit base as a public input.
template Exponentiation(n) {
    signal input exponent;
    signal input base;
    signal output out;
    signal powers[n];
    signal accumulators[n];
    signal terms1[n];
    signal terms2[n];
    signal terms3[n];
    powers[0] <== base;
    for (var i = 1; i<n; i++) {
        powers[i] <== powers[i-1] * powers[i-1];
    }
    component num_to_bits = Num2Bits(n);
    num_to_bits.in <== exponent;
    terms1[0] <== num_to_bits.out[0] * powers[0];
    terms2[0] <== 1-num_to_bits.out[0];
    terms3[0] <== terms1[0] + terms2[0];
    accumulators[0] <== terms3[0];
    for(var i = 1; i<n; i++) {
        terms1[i] <== num_to_bits.out[i] * powers[i];
        terms2[i] <== 1-num_to_bits.out[i];
        terms3[i] <== terms1[i] + terms2[i];
        accumulators[i] <== terms3[i] * accumulators[i-1];
    }
    out <== accumulators[n-1];
}

// Given private matrix A of shape mxn, private vector X of length n, and private vector B
// of length m, returns an output vector C of length m such that C = (A \times X) * B.
template LinearTransform(m, n) {
    signal input A[m*n];
    signal input X[n];
    signal input B[m];
    signal output C[m];
    signal intermediate[m*n];
    var lc;
    for (var i = 0; i < m; i++) {
        lc = 0;
        for (var j = 0; j < n; j++) {
            intermediate[i*n+j] <== A[i*n+j] * X[j];
            lc += intermediate[i*n+j];
        }
        C[i] <== lc * B[i];
    }
}
