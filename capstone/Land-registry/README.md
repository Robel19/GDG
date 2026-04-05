# 🏛️ LandChain — Decentralised Land Registry on Base Chain

A production-grade dApp for on-chain land ownership registration, verification, and transfer. Built with **Solidity + Foundry** (smart contracts) and **Next.js 14 + wagmi v2 + RainbowKit** (frontend), deployed to Base Sepolia.

---

## Architecture

```
land-registry/
├── contracts/
│   ├── src/
│   │   └── LandRegistry.sol       ← ERC-721 + AccessControl + ReentrancyGuard
│   ├── test/
│   │   └── LandRegistry.t.sol     ← 40+ Foundry tests + fuzz
│   ├── script/
│   │   └── Deploy.s.sol           ← DeployLandRegistry + SeedLandRegistry
│   └── foundry.toml
└── frontend/
    └── src/
        ├── app/                   ← Next.js App Router pages
        │   ├── page.tsx           ← Home / landing
        │   ├── register/          ← Register new parcel (registrar/admin)
        │   ├── my-lands/          ← Owner portfolio dashboard
        │   ├── transfer/          ← 2-step transfer flow
        │   ├── land/              ← Public search + detail page
        │   └── admin/             ← Admin panel (roles, pause)
        ├── components/
        │   ├── Navbar.tsx
        │   ├── LandCard.tsx
        │   ├── TxToast.tsx        ← Live transaction status
        │   └── QRCode.tsx         ← Verification QR
        ├── hooks/
        │   └── useContract.ts     ← All wagmi read/write hooks
        ├── lib/
        │   ├── contract.ts        ← ABI + address + role hashes
        │   ├── wagmi.ts           ← Chain config
        │   └── utils.ts           ← Formatters
        └── types/
            └── index.ts
```

---

## Smart Contract Design

### LandRegistry.sol

| Feature | Implementation |
|---------|---------------|
| Land as NFT | ERC-721 (OpenZeppelin) — each parcel is a token |
| Role-Based Access | `AccessControl` — ADMIN_ROLE, REGISTRAR_ROLE |
| Reentrancy Protection | `ReentrancyGuard` on all write functions |
| Pausability | `Pausable` — admin can halt all writes |
| Duplicate Prevention | `_locationRegistered` mapping |
| Transfer Flow | 2-step: request → admin approve → execute |
| Audit Trail | Full on-chain `TransferRecord[]` per parcel |
| Emergency Override | `adminTransfer()` for legal orders |

### Transfer Flow

```
Owner               Admin               Owner
  │                   │                   │
  ├─ requestTransfer ─►│                   │
  │                   ├─ approveTransfer ─►│
  │                   │                   ├─ executeTransfer
  │                   │                   │  (NFT transferred)
```

### Roles

| Role | Capabilities |
|------|-------------|
| `DEFAULT_ADMIN_ROLE` | Grant / revoke any role |
| `ADMIN_ROLE` | Verify land, approve transfers, admin-transfer, pause |
| `REGISTRAR_ROLE` | Register land, update metadata |

---

## Local Development

### 1. Smart Contracts

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash && foundryup

cd contracts

# Dependencies live under lib/ (git submodules). `forge install` needs a git repo here.
git init   # skip if `contracts` is already inside a git repository with this folder tracked

forge install foundry-rs/forge-std
forge install OpenZeppelin/openzeppelin-contracts

# Compile (Solc 0.8.24 matches OpenZeppelin v5.x in foundry.toml)
forge build

# Run tests (includes fuzz)
forge test -vv

# Run tests with gas report
forge test --gas-report
```

**Deploy to Base Sepolia (default RPC is set in `foundry.toml`; override with `--rpc-url` if needed):**

Copy `contracts/.env.example` to `contracts/.env`, fill in keys (Foundry loads `.env` automatically), or export the same variables in your shell:

```bash
cd contracts

export DEPLOYER_PRIVATE_KEY=0x...   # funded deployer on Base Sepolia
export ADMIN_ADDRESS=0x...          # optional; defaults to deployer
export BASESCAN_API_KEY=...         # from basescan.org (for verification)

forge script script/Deploy.s.sol:DeployLandRegistry \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY \
  -vvvv
```

Copy the printed `NEXT_PUBLIC_LAND_REGISTRY_ADDRESS` into `frontend/.env.local`.

**Optional — local Anvil (same script, local chain):**

```bash
anvil

ADMIN_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
forge script script/Deploy.s.sol:DeployLandRegistry \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

**Using a custom RPC endpoint** (matches `[rpc_endpoints] base_sepolia` in `foundry.toml`):

```bash
export BASE_SEPOLIA_RPC=https://sepolia.base.org   # or Alchemy / Infura URL

forge script script/Deploy.s.sol:DeployLandRegistry \
  --rpc-url base_sepolia \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY
```

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy and fill in environment variables
cp .env.example .env.local
# Set NEXT_PUBLIC_LAND_REGISTRY_ADDRESS to your deployed contract

# Run dev server
npm run dev
# → http://localhost:3000
```

For production hosting (for example Vercel), set `NEXT_PUBLIC_LAND_REGISTRY_ADDRESS` and `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` in the project environment.

---

## Security Considerations

- **Reentrancy** — All state mutations happen _before_ the ERC-721 `_transfer` call (checks-effects-interactions).
- **Access control** — Every write function has a role check via OpenZeppelin `AccessControl`.
- **Duplicate prevention** — `_locationRegistered` mapping prevents the same physical location from being registered twice.
- **Transfer integrity** — The 2-step flow (request → admin approve → execute) prevents fraudulent transfers. Admin can cancel at any stage.
- **Pausability** — The contract can be halted by the admin without upgrading, providing an emergency stop.
- **Custom errors** — Gas-efficient `revert` with typed errors for easier debugging.

---

## Running Tests

```bash
cd contracts

# Full suite
forge test -vvv

# Fuzz only
forge test --match-test testFuzz -vv

# Coverage
forge coverage

# Specific test
forge test --match-test test_ExecuteTransfer_Success -vvvv
```

Expected output: **all tests pass**, including fuzz runs.

---

## Frontend Pages

| Route | Description | Access |
|-------|-------------|--------|
| `/` | Home / landing with stats | Public |
| `/register` | Register new parcel | Registrar / Admin |
| `/my-lands` | View your land portfolio | Wallet required |
| `/transfer` | Initiate / approve / execute transfer | Wallet required |
| `/land` | Search parcel by ID | Public |
| `/land/[id]` | Full parcel detail + history + QR | Public |
| `/admin` | Role management + pause control | Admin only |

---

## Getting Base Sepolia ETH

- Faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- Bridge from Sepolia: https://superbridge.app/base-sepolia

---

## License

MIT
