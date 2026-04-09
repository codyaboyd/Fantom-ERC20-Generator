$(document).ready(function() {
    var isConnected = false;
    var defaultTaxRate = 0;
    var defaultAddress = '';
    let connectedWalletType = null;
    let activeEvmProvider = null;
    let activeSolanaProvider = null;

    const NETWORKS = {
        ethereum: {
            type: 'evm',
            chainId: '0x1',
            chainName: 'Ethereum Mainnet',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://eth.llamarpc.com'],
            blockExplorerUrls: ['https://etherscan.io'],
            label: 'Ethereum'
        },
        bnb: {
            type: 'evm',
            chainId: '0x38',
            chainName: 'BNB Smart Chain',
            nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
            rpcUrls: ['https://bsc-dataseed.binance.org'],
            blockExplorerUrls: ['https://bscscan.com'],
            label: 'BNB Smart Chain'
        },
        polygon: {
            type: 'evm',
            chainId: '0x89',
            chainName: 'Polygon PoS',
            nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
            rpcUrls: ['https://polygon-rpc.com'],
            blockExplorerUrls: ['https://polygonscan.com'],
            label: 'Polygon'
        },
        arbitrum: {
            type: 'evm',
            chainId: '0xa4b1',
            chainName: 'Arbitrum One',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://arb1.arbitrum.io/rpc'],
            blockExplorerUrls: ['https://arbiscan.io'],
            label: 'Arbitrum One'
        },
        optimism: {
            type: 'evm',
            chainId: '0xa',
            chainName: 'OP Mainnet',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://mainnet.optimism.io'],
            blockExplorerUrls: ['https://optimistic.etherscan.io'],
            label: 'Optimism'
        },
        base: {
            type: 'evm',
            chainId: '0x2105',
            chainName: 'Base',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://mainnet.base.org'],
            blockExplorerUrls: ['https://basescan.org'],
            label: 'Base'
        },
        avalanche: {
            type: 'evm',
            chainId: '0xa86a',
            chainName: 'Avalanche C-Chain',
            nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
            rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
            blockExplorerUrls: ['https://snowtrace.io'],
            label: 'Avalanche C-Chain'
        },
        fantom: {
            type: 'evm',
            chainId: '0xfa',
            chainName: 'Fantom Opera',
            nativeCurrency: { name: 'Fantom', symbol: 'FTM', decimals: 18 },
            rpcUrls: ['https://rpc.ftm.tools'],
            blockExplorerUrls: ['https://ftmscan.com'],
            label: 'Fantom Opera'
        },
        solana: {
            type: 'solana',
            rpcUrl: 'https://api.mainnet-beta.solana.com',
            nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
            blockExplorerUrls: ['https://solscan.io'],
            label: 'Solana Mainnet'
        }
    };

    function getSelectedNetwork() {
        const selected = $('#network').val();
        return NETWORKS[selected] || NETWORKS.fantom;
    }

    function isSolanaSelected() {
        return getSelectedNetwork().type === 'solana';
    }

    function setConnectedState(address, walletType) {
        defaultAddress = address || '';
        isConnected = Boolean(address);
        connectedWalletType = walletType || null;

        if (walletType === 'evm' && address) {
            $('#tax1Address, #tax2Address, #tax3Address').val(address);
            $('#connectWallet').text(`Connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
        } else if (walletType === 'solana' && address) {
            $('#connectWallet').text(`Connected: ${address.slice(0, 4)}...${address.slice(-4)}`);
        } else {
            updateUiForNetwork();
        }

        if (isConnected) {
            $('#connectWallet').prop('disabled', true);
        } else {
            $('#connectWallet').prop('disabled', false);
        }
    }

    function resetConnectedState() {
        setConnectedState('', null);
    }

    function getEvmProvider() {
        const ethereum = window.ethereum;
        if (!ethereum) return null;

        // Prefer MetaMask provider explicitly when multiple EIP-1193 providers are injected.
        if (Array.isArray(ethereum.providers)) {
            const metaMaskProvider = ethereum.providers.find((provider) => provider && provider.isMetaMask);
            if (metaMaskProvider) return metaMaskProvider;
            return ethereum.providers[0] || ethereum;
        }

        return ethereum;
    }

    function getPhantomProvider() {
        const injectedProvider = window.phantom?.solana || window.solana;
        if (injectedProvider && injectedProvider.isPhantom) {
            return injectedProvider;
        }
        return null;
    }

    function attachEvmEventHandlers(provider) {
        if (!provider || typeof provider.on !== 'function') return;
        provider.removeListener?.('accountsChanged', onEvmAccountsChanged);
        provider.removeListener?.('chainChanged', onEvmChainChanged);
        provider.removeListener?.('disconnect', onEvmDisconnect);
        provider.on('accountsChanged', onEvmAccountsChanged);
        provider.on('chainChanged', onEvmChainChanged);
        provider.on('disconnect', onEvmDisconnect);
    }

    function attachSolanaEventHandlers(provider) {
        if (!provider || typeof provider.on !== 'function') return;
        provider.off?.('accountChanged', onSolanaAccountChanged);
        provider.off?.('disconnect', onSolanaDisconnect);
        provider.on('accountChanged', onSolanaAccountChanged);
        provider.on('disconnect', onSolanaDisconnect);
    }

    function onEvmAccountsChanged(accounts) {
        if (!Array.isArray(accounts) || accounts.length === 0) {
            resetConnectedState();
            return;
        }
        setConnectedState(accounts[0], 'evm');
    }

    function onEvmChainChanged() {
        // Keep simple and robust: force consistent provider and contract state for selected chain.
        window.location.reload();
    }

    function onEvmDisconnect() {
        resetConnectedState();
    }

    function onSolanaAccountChanged(publicKey) {
        if (!publicKey) {
            resetConnectedState();
            return;
        }
        setConnectedState(publicKey.toString(), 'solana');
    }

    function onSolanaDisconnect() {
        resetConnectedState();
    }

    function toBaseUnits(amountStr, decimals) {
        const value = String(amountStr || '').trim();
        if (!value) return 0n;
        if (!/^\d+(\.\d+)?$/.test(value)) {
            throw new Error('Invalid numeric amount provided.');
        }

        const [whole, fractionRaw = ''] = value.split('.');
        const fractionPadded = (fractionRaw + '0'.repeat(decimals)).slice(0, decimals);
        const asString = `${whole}${fractionPadded}`.replace(/^0+(?=\d)/, '');
        return BigInt(asString || '0');
    }

    function updateUiForNetwork() {
        const network = getSelectedNetwork();
        const isSolana = network.type === 'solana';

        if (isSolana) {
            $('#wizardTitle').text('SPL Token Wizard - Phantom wallet required');
            $('#connectWallet').text('Connect to Phantom');
            $('#downloadSource').empty();
            $('#taxSection').hide();
        } else {
            $('#wizardTitle').text(`ERC20 Wizard - 1 ${network.nativeCurrency.symbol}`);
            $('#connectWallet').text('Connect to MetaMask');
            $('#taxSection').show();
        }
    }

    async function ensureCorrectNetwork() {
        const network = getSelectedNetwork();

        if (network.type === 'solana') {
            return network;
        }

        const provider = getEvmProvider();
        if (!provider) {
            throw new Error('MetaMask (or a compatible EVM wallet) is not available.');
        }

        const activeChainId = await provider.request({ method: 'eth_chainId' });

        if (activeChainId !== network.chainId) {
            try {
                await provider.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: network.chainId }],
                });
            } catch (error) {
                if (error.code === 4902) {
                    await provider.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: network.chainId,
                            chainName: network.chainName,
                            nativeCurrency: network.nativeCurrency,
                            rpcUrls: network.rpcUrls,
                            blockExplorerUrls: network.blockExplorerUrls
                        }],
                    });
                } else {
                    throw error;
                }
            }
        }

        return network;
    }

    $('#network').on('change', function() {
        resetConnectedState();
        updateUiForNetwork();
    });
    updateUiForNetwork();

    $('#connectWallet').click(async function() {
        if (!isConnected) {
            try {
                if (isSolanaSelected()) {
                    const provider = getPhantomProvider();
                    if (!provider) {
                        alert('Phantom wallet is not installed! Please install Phantom to continue: https://phantom.app/download');
                        return;
                    }

                    activeSolanaProvider = provider;
                    attachSolanaEventHandlers(provider);
                    const response = await provider.connect();
                    setConnectedState(response.publicKey.toString(), 'solana');
                    return;
                }

                const provider = getEvmProvider();
                if (!provider) {
                    alert('MetaMask is not installed! Please install MetaMask to continue: https://metamask.io/download.html');
                    return;
                }

                activeEvmProvider = provider;
                attachEvmEventHandlers(provider);
                await ensureCorrectNetwork();
                const accounts = await provider.request({ method: 'eth_requestAccounts' });

                setConnectedState(accounts[0], 'evm');
            } catch (error) {
                console.error('Error connecting wallet:', error);
                alert('Error connecting wallet: ' + error.message);
            }
        }
    });


    $('#deployForm').on('submit', async function(e) {
        e.preventDefault();

        const network = getSelectedNetwork();
        const name = $('#name').val();
        const symbol = $('#symbol').val();
        let decimals = parseInt($('#decimals').val());

        if (network.type === 'solana') {
            decimals = Number.isFinite(decimals) && decimals >= 0 && decimals <= 9 ? decimals : 9;
        } else {
            decimals = (!decimals || decimals <= 0 || decimals > 18) ? 18 : decimals;
        }

        const initialSupplyInput = $('#initialSupply').val();
        const maxSupplyInput = $('#maxSupply').val();

        if (network.type === 'solana') {
            try {
                const provider = activeSolanaProvider || getPhantomProvider();
                if (!provider) {
                    throw new Error('Phantom wallet is required for Solana deployments.');
                }

                if (!provider.publicKey) {
                    await provider.connect();
                }

                const payer = provider.publicKey;
                const initialSupply = toBaseUnits(initialSupplyInput, decimals);
                const connection = new solanaWeb3.Connection(network.rpcUrl, 'confirmed');

                const mintKeypair = solanaWeb3.Keypair.generate();
                const mintRent = await connection.getMinimumBalanceForRentExemption(splToken.MINT_SIZE);
                const associatedTokenAccount = await splToken.getAssociatedTokenAddress(
                    mintKeypair.publicKey,
                    payer,
                    false,
                    splToken.TOKEN_PROGRAM_ID,
                    splToken.ASSOCIATED_TOKEN_PROGRAM_ID
                );

                const transaction = new solanaWeb3.Transaction();
                transaction.add(
                    solanaWeb3.SystemProgram.createAccount({
                        fromPubkey: payer,
                        newAccountPubkey: mintKeypair.publicKey,
                        space: splToken.MINT_SIZE,
                        lamports: mintRent,
                        programId: splToken.TOKEN_PROGRAM_ID
                    }),
                    splToken.createInitializeMint2Instruction(
                        mintKeypair.publicKey,
                        decimals,
                        payer,
                        payer,
                        splToken.TOKEN_PROGRAM_ID
                    ),
                    splToken.createAssociatedTokenAccountInstruction(
                        payer,
                        associatedTokenAccount,
                        payer,
                        mintKeypair.publicKey,
                        splToken.TOKEN_PROGRAM_ID,
                        splToken.ASSOCIATED_TOKEN_PROGRAM_ID
                    )
                );

                if (initialSupply > 0n) {
                    transaction.add(
                        splToken.createMintToInstruction(
                            mintKeypair.publicKey,
                            associatedTokenAccount,
                            payer,
                            initialSupply,
                            [],
                            splToken.TOKEN_PROGRAM_ID
                        )
                    );
                }

                const latestBlockhash = await connection.getLatestBlockhash('finalized');
                transaction.recentBlockhash = latestBlockhash.blockhash;
                transaction.feePayer = payer;
                transaction.partialSign(mintKeypair);

                const signed = await provider.signTransaction(transaction);
                const signature = await connection.sendRawTransaction(signed.serialize());
                await connection.confirmTransaction({
                    signature,
                    blockhash: latestBlockhash.blockhash,
                    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
                }, 'confirmed');

                const explorerLink = `${network.blockExplorerUrls[0]}/token/${mintKeypair.publicKey.toString()}`;
                $('#deployResult').html(`SPL token mint deployed on ${network.label}: <a href="${explorerLink}" target="_blank">${mintKeypair.publicKey.toString()}</a><br>Tx: <a href="${network.blockExplorerUrls[0]}/tx/${signature}" target="_blank">${signature}</a><br><small>Name and symbol are entered for planning; metadata is not automatically created in this flow.</small>`);
                return;
            } catch (error) {
                console.error('Error deploying SPL token:', error);
                alert('Error deploying SPL token: ' + error.message);
                return;
            }
        }

        const maxSupply = ethers.utils.parseUnits(maxSupplyInput, decimals);
        const initialSupply = ethers.utils.parseUnits(initialSupplyInput, decimals);
        const tax1 = $('#tax1').val() ? parseFloat($('#tax1').val()) : defaultTaxRate;
        const tax1Address = $('#tax1Address').val() || defaultAddress;
        const tax2 = $('#tax2').val() ? parseFloat($('#tax2').val()) : defaultTaxRate;
        const tax2Address = $('#tax2Address').val() || defaultAddress;
        const tax3 = $('#tax3').val() ? parseFloat($('#tax3').val()) : defaultTaxRate;
        const tax3Address = $('#tax3Address').val() || defaultAddress;

        let isValid = true;
        [tax1Address, tax2Address, tax3Address].forEach(address => {
            if (!address.startsWith('0x')) {
                alert('Invalid address format: ' + address);
                isValid = false;
                return;
            }
        });

        if (tax1 + tax2 + tax3 > 100) {
            alert('Combined tax percentage cannot exceed 100.');
            isValid = false;
        }

        if (parseFloat(initialSupplyInput) > parseFloat(maxSupplyInput)) {
            alert('Initial supply cannot be more than max supply.');
            isValid = false;
        }

        if (!isValid) return;

        try {
            const provider = activeEvmProvider || getEvmProvider();
            if (!provider) {
                throw new Error('MetaMask (or a compatible EVM wallet) is not available.');
            }

            const evmNetwork = await ensureCorrectNetwork();
            const signer = new ethers.providers.Web3Provider(provider).getSigner();

            const factory = new ethers.ContractFactory(abi, bytecode, signer);
            const overrides = { value: ethers.utils.parseUnits('1', 'ether') };
            const contract = await factory.deploy(
                name, symbol, decimals, maxSupply, initialSupply,
                tax1, tax1Address, tax2, tax2Address, tax3, tax3Address, overrides
            );

            console.log('Deploying contract...');
            await contract.deployed();
            console.log('Contract deployed at:', contract.address);

            const explorerLink = `${evmNetwork.blockExplorerUrls[0]}/address/${contract.address}`;
            $('#deployResult').html(`Contract deployed on ${evmNetwork.label} at: <a href="${explorerLink}" target="_blank">${contract.address}</a><br><button type="button" class="btn btn-info mt-3" id="downloadSource">Download Source Code</button>`);

            $('#downloadSource').click(function() {
                window.location.href = './src.sol';
            });
        } catch (error) {
            console.error('Error deploying contract:', error);
            alert('Error deploying contract: ' + error.message);
        }
    });
});
