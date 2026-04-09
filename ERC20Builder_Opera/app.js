$(document).ready(function() {
    var isConnected = false;
    var defaultTaxRate = 0;
    var defaultAddress = '';

    const NETWORKS = {
        ethereum: {
            chainId: '0x1',
            chainName: 'Ethereum Mainnet',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://eth.llamarpc.com'],
            blockExplorerUrls: ['https://etherscan.io'],
            label: 'Ethereum'
        },
        bnb: {
            chainId: '0x38',
            chainName: 'BNB Smart Chain',
            nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
            rpcUrls: ['https://bsc-dataseed.binance.org'],
            blockExplorerUrls: ['https://bscscan.com'],
            label: 'BNB Smart Chain'
        },
        polygon: {
            chainId: '0x89',
            chainName: 'Polygon PoS',
            nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
            rpcUrls: ['https://polygon-rpc.com'],
            blockExplorerUrls: ['https://polygonscan.com'],
            label: 'Polygon'
        },
        arbitrum: {
            chainId: '0xa4b1',
            chainName: 'Arbitrum One',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://arb1.arbitrum.io/rpc'],
            blockExplorerUrls: ['https://arbiscan.io'],
            label: 'Arbitrum One'
        },
        optimism: {
            chainId: '0xa',
            chainName: 'OP Mainnet',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://mainnet.optimism.io'],
            blockExplorerUrls: ['https://optimistic.etherscan.io'],
            label: 'Optimism'
        },
        base: {
            chainId: '0x2105',
            chainName: 'Base',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://mainnet.base.org'],
            blockExplorerUrls: ['https://basescan.org'],
            label: 'Base'
        },
        avalanche: {
            chainId: '0xa86a',
            chainName: 'Avalanche C-Chain',
            nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
            rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
            blockExplorerUrls: ['https://snowtrace.io'],
            label: 'Avalanche C-Chain'
        },
        fantom: {
            chainId: '0xfa',
            chainName: 'Fantom Opera',
            nativeCurrency: { name: 'Fantom', symbol: 'FTM', decimals: 18 },
            rpcUrls: ['https://rpc.ftm.tools'],
            blockExplorerUrls: ['https://ftmscan.com'],
            label: 'Fantom Opera'
        }
    };

    function getSelectedNetwork() {
        const selected = $('#network').val();
        return NETWORKS[selected] || NETWORKS.fantom;
    }

    function updateUiForNetwork() {
        const network = getSelectedNetwork();
        $('#wizardTitle').text(`ERC20 Wizard - 1 ${network.nativeCurrency.symbol}`);
    }

    async function ensureCorrectNetwork() {
        const network = getSelectedNetwork();
        const activeChainId = await window.ethereum.request({ method: 'eth_chainId' });

        if (activeChainId !== network.chainId) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: network.chainId }],
                });
            } catch (error) {
                if (error.code === 4902) {
                    await window.ethereum.request({
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

    $('#network').on('change', updateUiForNetwork);
    updateUiForNetwork();

    $('#connectWallet').click(async function() {
        if (!isConnected) {
            if (window.ethereum) {
                try {
                    await ensureCorrectNetwork();
                    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

                    defaultAddress = accounts[0];
                    $('#tax1Address, #tax2Address, #tax3Address').val(defaultAddress);

                    $('#connectWallet').hide();
                    isConnected = true;
                } catch (error) {
                    console.error('Error connecting to wallet:', error);
                }
            } else {
                alert('MetaMask is not installed! Please install MetaMask to continue: https://metamask.io/download.html');
            }
        }
    });


    $('#deployForm').on('submit', async function(e) {
        e.preventDefault();

        const name = $('#name').val();
        const symbol = $('#symbol').val();
        let decimals = parseInt($('#decimals').val());
        decimals = (!decimals || decimals <= 0 || decimals > 18) ? 18 : decimals;

        const maxSupply = ethers.utils.parseUnits($('#maxSupply').val(), decimals);
        const initialSupply = ethers.utils.parseUnits($('#initialSupply').val(), decimals);
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

        if (parseFloat($('#initialSupply').val()) > parseFloat($('#maxSupply').val())) {
            alert('Initial supply cannot be more than max supply.');
            isValid = false;
        }

        if (!isValid) return;

        try {
            const network = await ensureCorrectNetwork();
            const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();

            const factory = new ethers.ContractFactory(abi, bytecode, signer);
            const overrides = { value: ethers.utils.parseUnits("1", "ether") };
            const contract = await factory.deploy(
                name, symbol, decimals, maxSupply, initialSupply,
                tax1, tax1Address, tax2, tax2Address, tax3, tax3Address, overrides
            );

            console.log('Deploying contract...');
            await contract.deployed();
            console.log('Contract deployed at:', contract.address);

            const explorerLink = `${network.blockExplorerUrls[0]}/address/${contract.address}`;
            $('#deployResult').html(`Contract deployed on ${network.label} at: <a href="${explorerLink}" target="_blank">${contract.address}</a><br><button type="button" class="btn btn-info mt-3" id="downloadSource">Download Source Code</button>`);

            $('#downloadSource').click(function() {
                window.location.href = './src.sol';
            });
        } catch (error) {
            console.error('Error deploying contract:', error);
            alert('Error deploying contract: ' + error.message);
        }
    });
});
