# Universal-token-generator

A lightweight, browser-based token generator and admin UI for **major EVM networks** (Ethereum, BNB Smart Chain, Polygon, Arbitrum, Optimism, Base, Avalanche, and Fantom) plus **Solana** support via Phantom.

This repository now ships as a single static web app package:

- **`ERC20Builder_Opera/`** – includes both token generation and admin tools in one unified interface.

---

## Features

- Build ERC-20 token contracts using a guided form.
- Target deployment on major EVM networks via MetaMask chain switching.
- Deploy SPL token mints on Solana mainnet via Phantom wallet.
- Manage ownership, service pricing, and withdrawals from the integrated admin tab.
- Includes Solidity source template (`src.sol`) used by the generator UI.

---

## Project Structure

```text
.
├── ERC20Builder_Opera/
│   ├── app.js
│   ├── data.js
│   ├── admin-data.js
│   ├── index.html
│   ├── src.sol
│   └── ...assets
└── README.md
```

---

## Quick Start

### 1) Clone the repository

```bash
git clone https://github.com/<your-org-or-user>/Universal-token-generator.git
cd Universal-token-generator
```

### 2) Run a static server

You can use `http-server` (Node.js):

```bash
npx http-server ERC20Builder_Opera
```

Open the local URL printed in the terminal (typically `http://127.0.0.1:8080`).

---

## Requirements

- A modern browser (Chrome, Firefox, Brave, Edge, etc.)
- Access to wallet/browser extensions compatible with the selected chain (MetaMask for EVM or Phantom for Solana deployments)
- Network access to the selected chain RPC endpoint

---

## Notes

- This project is a **static frontend**; it does not include a backend service.
- Review generated contract code carefully before deploying on mainnet.
- Always test on a test environment and use small amounts first.

---

## License

This project is licensed under the terms in the [LICENSE](LICENSE) file.
