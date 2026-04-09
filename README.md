# Multi-Network ERC20 Generator

A lightweight, browser-based token generator and deployment UI for **major EVM networks** (Ethereum, BNB Smart Chain, Polygon, Arbitrum, Optimism, Base, Avalanche, and Fantom) plus **Solana** support via Phantom.

This repository contains two static web apps:

- **`ERC20Builder_Opera/`** – token creation + deployment flow.
- **`adminPanel_Opera/`** – token admin interface (ownership / management actions).

Both apps are plain HTML/CSS/JS and can be served locally with any static file server.

---

## Features

- Build ERC-20 token contracts using a guided form.
- Target deployment on major EVM networks via MetaMask chain switching.
- Deploy SPL token mints on Solana mainnet via Phantom wallet.
- Includes Solidity source template (`src.sol`) used by the builder UI.
- Separate admin panel for post-deployment management workflows.

---

## Project Structure

```text
.
├── ERC20Builder_Opera/
│   ├── app.js
│   ├── data.js
│   ├── index.html
│   ├── src.sol
│   └── ...assets
├── adminPanel_Opera/
│   ├── app.js
│   ├── data.js
│   └── index.html
└── README.md
```

---

## Quick Start

### 1) Clone the repository

```bash
git clone https://github.com/<your-org-or-user>/Fantom-ERC20-Generator.git
cd Fantom-ERC20-Generator
```

### 2) Run a static server

You can use `http-server` (Node.js):

```bash
npx http-server ERC20Builder_Opera
```

Open the local URL printed in the terminal (typically `http://127.0.0.1:8080`).

To run the admin panel instead:

```bash
npx http-server adminPanel_Opera
```

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
