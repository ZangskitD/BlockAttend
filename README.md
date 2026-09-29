# BlockAttend — Blockchain Attendance Verification

A complete MCA project prototype based on the supplied BlockAttend presentation.

## Architecture
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MySQL
- Blockchain: Ethereum-compatible EVM + Solidity + ethers.js
- Authentication: JWT + role-based access
- Integrity: SHA-256 attendance hash stored on-chain
- Privacy: student/faculty/application data stays in MySQL; blockchain stores verification proof, not PII.

The presentation describes a hybrid model: MySQL holds application data while an Ethereum/EVM verification layer stores cryptographic proofs. It also describes Admin, Faculty and Student roles, SHA-256 verification, auditability, and future QR/GPS, biometric, and multi-institution enhancements.

## Folder structure

BlockAttend/
  backend/
  contracts/
  scripts/
  frontend/
  database/
  .env.example

## 1. Requirements
- Node.js 20+
- MySQL 8+
- MetaMask (optional for a real Sepolia demo)
- Hardhat local node OR an Ethereum-compatible RPC endpoint

## 2. Database
Create a database:
  CREATE DATABASE blockattend;

Then run:
  mysql -u root -p blockattend < database/schema.sql

## 3. Blockchain demo
In terminal 1:
  npm install
  npx hardhat node

In terminal 2:
  npm run compile
  npm run deploy:local

Copy the deployed contract address into backend/.env.

For Sepolia, set RPC_URL and DEPLOYER_PRIVATE_KEY and deploy with your own deployment command. Never commit a private key.

## 4. Backend
  cd backend
  npm install
  copy .env.example .env
  npm run dev

Default API: http://localhost:5000

## 5. Frontend
  cd frontend
  npm install
  npm run dev

Default UI: http://localhost:5173

## Demo accounts
Seeded passwords are intentionally simple for classroom demonstration only:
- admin@blockattend.local / Admin@123
- faculty@blockattend.local / Faculty@123
- student@blockattend.local / Student@123

Change these before any real deployment.

## Attendance integrity flow

1. Faculty creates/marks an attendance record.
2. Backend creates a canonical JSON representation.
3. Backend calculates SHA-256.
4. MySQL stores the attendance record and hash.
5. The backend submits the hash to the Solidity contract.
6. The transaction hash is saved in MySQL.
7. Student/admin verification recalculates SHA-256 from the stored record.
8. The calculated hash is compared with the blockchain hash.
9. Matching hashes => VERIFIED; mismatch => TAMPER DETECTED.

## Important limitation
Blockchain proves that the committed record has not changed after commitment. It does NOT prove that the original attendance mark was truthful. Faculty authorization and application controls are therefore still necessary.
