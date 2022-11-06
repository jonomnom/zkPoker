// npx hardhat deploy --network goerli
import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function ({ getNamedAccounts, deployments, network }: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  
  console.log(`network: ${network.name}`);

  // deploy libraries
  const { address: encryptKeySecondHalfLibAddr } = await deploy("encryptKeySecondHalf", {
    from: deployer,
    log: true,
    deterministicDeployment: false,
  });

  const { address: encryptKeyFirstHalfLibAddr } = await deploy("encryptKeyFirstHalf", {
    from: deployer,
    log: true,
    deterministicDeployment: false,
  });
  
  // deploy verifiers
  const { address: decryptVerifierAddr } = await deploy("decryptVerifier", {
    from: deployer,
    log: true,
    deterministicDeployment: false,
  });
  const { address: encryptVerifierAddr } = await deploy("encryptVerifier", {
    from: deployer,
    log: true,
    deterministicDeployment: false,
    libraries: {
      encryptKeyFirstHalf: encryptKeyFirstHalfLibAddr, 
      encryptKeySecondHalf : encryptKeySecondHalfLibAddr
    }
  });

  // deploy verifier wrapper
  const { address: verifierAddr } = await deploy("Verifier", {
    from: deployer,
    log: true,
    deterministicDeployment: false,
    args: [encryptVerifierAddr, decryptVerifierAddr],
  });

  // deploy board manager
  const { address: mgrAddr, abi: mgrAbi } = await deploy("BoardManager", {
    from: deployer,
    log: true,
    deterministicDeployment: false,
    args: [verifierAddr],
    // proxy: {
    //   proxyContract: "OptimizedTransparentProxy",
    //   execute: {
    //     methodName: "initialize",
    //     args: [],
    //   },
    // },
  });
};

export default func;