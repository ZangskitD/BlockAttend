import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

const ABI = [
  "function recordAttendance(bytes32 attendanceHash) external",
  "function verifyAttendance(bytes32 attendanceHash) external view returns (bool exists, uint256 committedAt, address committedBy)"
];

let contract;

function getContract() {
  if (contract) return contract;
  if (!process.env.BLOCKCHAIN_PRIVATE_KEY || !process.env.ATTENDANCE_CONTRACT_ADDRESS) {
    throw new Error("Blockchain configuration is incomplete");
  }
  const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
  const wallet = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY, provider);
  contract = new ethers.Contract(process.env.ATTENDANCE_CONTRACT_ADDRESS, ABI, wallet);
  return contract;
}

export async function commitAttendanceHash(hexHash) {
  const c = getContract();
  const tx = await c.recordAttendance("0x" + hexHash);
  const receipt = await tx.wait();
  return receipt.hash;
}

export async function verifyAttendanceHash(hexHash) {
  const c = getContract();
  const result = await c.verifyAttendance("0x" + hexHash);
  return {
    exists: result[0],
    committedAt: Number(result[1]),
    committedBy: result[2]
  };
}
