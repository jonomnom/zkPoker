//
// Copyright 2017 Christian Reitwiessner
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// 2019 OKIMS
//      ported to solidity 0.6
//      fixed linter warnings
//      added requiere error messages
//
// 2021 Remco Bloemen
//       cleaned up code
//       added InvalidProve() error
//       always revert with InvalidProof() on invalid proof
//       make decryptPairing strict
//
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

library decryptPairing {
  error InvalidProof();

  // The prime q in the base field F_q for G1
  uint256 constant BASE_MODULUS = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

  // The prime moludus of the scalar field of G1.
  uint256 constant SCALAR_MODULUS = 21888242871839275222246405745257275088548364400416034343698204186575808495617;

  struct G1Point {
    uint256 X;
    uint256 Y;
  }

  // Encoding of field elements is: X[0] * z + X[1]
  struct G2Point {
    uint256[2] X;
    uint256[2] Y;
  }

  /// @return the generator of G1
  function P1() internal pure returns (G1Point memory) {
    return G1Point(1, 2);
  }

  /// @return the generator of G2
  function P2() internal pure returns (G2Point memory) {
    return
      G2Point(
        [
          11559732032986387107991004021392285783925812861821192530917403151452391805634,
          10857046999023057135944570762232829481370756359578518086990519993285655852781
        ],
        [
          4082367875863433681332203403145435568316851327593401208105741076214120093531,
          8495653923123431417604973247489272438418190587263600148770280649306958101930
        ]
      );
  }

  /// @return r the negation of p, i.e. p.addition(p.negate()) should be zero.
  function negate(G1Point memory p) internal pure returns (G1Point memory r) {
    if (p.X == 0 && p.Y == 0) return G1Point(0, 0);
    // Validate input or revert
    if (p.X >= BASE_MODULUS || p.Y >= BASE_MODULUS) revert InvalidProof();
    // We know p.Y > 0 and p.Y < BASE_MODULUS.
    return G1Point(p.X, BASE_MODULUS - p.Y);
  }

  /// @return r the sum of two points of G1
  function addition(G1Point memory p1, G1Point memory p2) internal view returns (G1Point memory r) {
    // By EIP-196 all input is validated to be less than the BASE_MODULUS and form points
    // on the curve.
    uint256[4] memory input;
    input[0] = p1.X;
    input[1] = p1.Y;
    input[2] = p2.X;
    input[3] = p2.Y;
    bool success;
    // solium-disable-next-line security/no-inline-assembly
    assembly {
      success := staticcall(sub(gas(), 2000), 6, input, 0xc0, r, 0x60)
    }
    if (!success) revert InvalidProof();
  }

  /// @return r the product of a point on G1 and a scalar, i.e.
  /// p == p.scalar_mul(1) and p.addition(p) == p.scalar_mul(2) for all points p.
  function scalar_mul(G1Point memory p, uint256 s) internal view returns (G1Point memory r) {
    // By EIP-196 the values p.X and p.Y are verified to less than the BASE_MODULUS and
    // form a valid point on the curve. But the scalar is not verified, so we do that explicitelly.
    if (s >= SCALAR_MODULUS) revert InvalidProof();
    uint256[3] memory input;
    input[0] = p.X;
    input[1] = p.Y;
    input[2] = s;
    bool success;
    // solium-disable-next-line security/no-inline-assembly
    assembly {
      success := staticcall(sub(gas(), 2000), 7, input, 0x80, r, 0x60)
    }
    if (!success) revert InvalidProof();
  }

  /// Asserts the pairing check
  /// e(p1[0], p2[0]) *  .... * e(p1[n], p2[n]) == 1
  /// For example pairing([P1(), P1().negate()], [P2(), P2()]) should succeed
  function pairingCheck(G1Point[] memory p1, G2Point[] memory p2) internal view {
    // By EIP-197 all input is verified to be less than the BASE_MODULUS and form elements in their
    // respective groups of the right order.
    if (p1.length != p2.length) revert InvalidProof();
    uint256 elements = p1.length;
    uint256 inputSize = elements * 6;
    uint256[] memory input = new uint256[](inputSize);
    for (uint256 i = 0; i < elements; i++) {
      input[i * 6 + 0] = p1[i].X;
      input[i * 6 + 1] = p1[i].Y;
      input[i * 6 + 2] = p2[i].X[0];
      input[i * 6 + 3] = p2[i].X[1];
      input[i * 6 + 4] = p2[i].Y[0];
      input[i * 6 + 5] = p2[i].Y[1];
    }
    uint256[1] memory out;
    bool success;
    // solium-disable-next-line security/no-inline-assembly
    assembly {
      success := staticcall(sub(gas(), 2000), 8, add(input, 0x20), mul(inputSize, 0x20), out, 0x20)
    }
    if (!success || out[0] != 1) revert InvalidProof();
  }
}

contract decryptVerifier {
  using decryptPairing for *;

  struct VerifyingKey {
    decryptPairing.G1Point alfa1;
    decryptPairing.G2Point beta2;
    decryptPairing.G2Point gamma2;
    decryptPairing.G2Point delta2;
    decryptPairing.G1Point[] IC;
  }

  struct Proof {
    decryptPairing.G1Point A;
    decryptPairing.G2Point B;
    decryptPairing.G1Point C;
  }

  function verifyingKey() internal pure returns (VerifyingKey memory vk) {
    vk.alfa1 = decryptPairing.G1Point(
      14378794661994809316668936077887579852844330409586136188493910229510707683568,
      19007180918058273234125706522281291487787880146734549337345180962710738215208
    );

    vk.beta2 = decryptPairing.G2Point(
      [5920706861016946300912146506670818945013737603659177373891149557636543490740, 12055325713222300848813253111985210672218263044214498326157766255150057128762],
      [9700420230412290932994502491200547761155381189822684608735830492099336040170, 14277278647337675353039880797101698215986155900184787257566473040310971051502]
    );

    vk.gamma2 = decryptPairing.G2Point(
      [11559732032986387107991004021392285783925812861821192530917403151452391805634, 10857046999023057135944570762232829481370756359578518086990519993285655852781],
      [4082367875863433681332203403145435568316851327593401208105741076214120093531, 8495653923123431417604973247489272438418190587263600148770280649306958101930]
    );

    vk.delta2 = decryptPairing.G2Point(
      [14775193340486106785412518097791831523220390171193689425927766312700613407698, 2639006974166104660735007617629115075610687006489787811483101253678053727965],
      [7033699777372929539950951174758152219641620046403661899994547705056627996272, 12757135341281669891528138934607500598040384987778485246835950609094761223515]
    );

    vk.IC = new decryptPairing.G1Point[](5);

    
      vk.IC[0] = decryptPairing.G1Point(
        9666425137086650662037336904385157031772055490977677744261137988127815787584,
        5394407372917647524486917008691392485984315432533679388723049511191446329374
      );
    
      vk.IC[1] = decryptPairing.G1Point(
        1029880746318880647873272012935051622608590720430145823323385938643967970819,
        10519815370211771276212315568191981797045710057898860151276042150960108246790
      );
    
      vk.IC[2] = decryptPairing.G1Point(
        18679496006835754091909636639352593958358012713658166038623643889897044251963,
        4195574608657694158130023234645666213596440321409392981763827641454293624821
      );
    
      vk.IC[3] = decryptPairing.G1Point(
        21233915107006272243099839554591143807433705314036839416373945066186606306898,
        16302219708944780223707653399805613424179877972668265811493690905270060414617
      );
    
      vk.IC[4] = decryptPairing.G1Point(
        90263583263356702511448915611918453627788815788836443948321726965197381648,
        1295786833271608162503943377766741245832505007368535148970418800924473144110
      );
    
  }

  /// @dev Verifies a Semaphore proof. Reverts with InvalidProof if the proof is invalid.
  function verifyProof(
    uint[2] memory a,
    uint[2][2] memory b,
    uint[2] memory c,
    uint[4] memory input
  ) public view {
    // If the values are not in the correct range, the decryptPairing contract will revert.
    Proof memory proof;
    proof.A = decryptPairing.G1Point(a[0], a[1]);
    proof.B = decryptPairing.G2Point([b[0][0], b[0][1]], [b[1][0], b[1][1]]);
    proof.C = decryptPairing.G1Point(c[0], c[1]);

    VerifyingKey memory vk = verifyingKey();

    // Compute the linear combination vk_x of inputs times IC
    if (input.length + 1 != vk.IC.length) revert decryptPairing.InvalidProof();
    decryptPairing.G1Point memory vk_x = vk.IC[0];
    for (uint i = 0; i < input.length; i++) {
      vk_x = decryptPairing.addition(vk_x, decryptPairing.scalar_mul(vk.IC[i+1], input[i]));
    }

    // Check pairing
    decryptPairing.G1Point[] memory p1 = new decryptPairing.G1Point[](4);
    decryptPairing.G2Point[] memory p2 = new decryptPairing.G2Point[](4);
    p1[0] = decryptPairing.negate(proof.A);
    p2[0] = proof.B;
    p1[1] = vk.alfa1;
    p2[1] = vk.beta2;
    p1[2] = vk_x;
    p2[2] = vk.gamma2;
    p1[3] = proof.C;
    p2[3] = vk.delta2;
    decryptPairing.pairingCheck(p1, p2);
  }
}
