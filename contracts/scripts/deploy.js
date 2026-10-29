const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("--------------------------------------------------");
  console.log("Deploying CouponCashbackSystem Smart Contract...");
  console.log("--------------------------------------------------");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer Address:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deployer Balance:", hre.ethers.formatEther(balance), "ETH");

  const CouponCashbackSystem = await hre.ethers.getContractFactory("CouponCashbackSystem");
  const contract = await CouponCashbackSystem.deploy();

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("\n>>> CouponCashbackSystem deployed successfully!");
  console.log(">>> Contract Address:", contractAddress);

  // Fund contract with initial 1.0 ETH for cashback pool
  const fundTx = await deployer.sendTransaction({
    to: contractAddress,
    value: hre.ethers.parseEther("1.0"),
  });
  await fundTx.wait();
  console.log(">>> Contract funded with 1.0 ETH for cashback reserve pool.");

  // Save deployment artifact for backend and frontend consumption
  const contractsDir = path.join(__dirname, "..", "..", "backend", "src", "config");
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  const frontendContractsDir = path.join(__dirname, "..", "..", "frontend", "src", "contracts");
  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
  }

  const contractArtifact = await hre.artifacts.readArtifact("CouponCashbackSystem");

  const deploymentData = {
    address: contractAddress,
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    abi: contractArtifact.abi,
  };

  fs.writeFileSync(
    path.join(contractsDir, "contractDeployment.json"),
    JSON.stringify(deploymentData, null, 2)
  );
  fs.writeFileSync(
    path.join(frontendContractsDir, "contractDeployment.json"),
    JSON.stringify(deploymentData, null, 2)
  );

  console.log(">>> Deployment info exported to backend and frontend config directories.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
