$(document).ready(function() {
    var isConnected = false;
    var defaultTaxRate = 0;
    var defaultAddress = '';

    $('#connectWallet').click(async function() {
        if (!isConnected) {
            if (window.ethereum) {
                try {
                    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                    const networkId = await window.ethereum.request({ method: 'net_version' });
                    const fantomTestnetId = '250';

                    if (networkId !== fantomTestnetId) {
                        try {
                            await window.ethereum.request({
                                method: 'wallet_switchEthereumChain',
                                params: [{ chainId: '0xfa' }], // Fantom Opera testnet chain ID
                            });
                        } catch (error) {
                            if (error.code === 4902) {
                                try {
                                    // Request to add Fantom Opera testnet to MetaMask
                                    await window.ethereum.request({
                                        method: 'wallet_addEthereumChain',
                                        params: [{
                                            chainId: '0xfa', // Fantom Opera testnet chain ID
                                            chainName: 'Fantom Opera',
                                            nativeCurrency: {
                                                name: 'Fantom',
                                                symbol: 'FTM', // 2-6 characters long
                                                decimals: 18
                                            },
                                            rpcUrls: ['https://rpc.ftm.tools/'], // RPC URL
                                            blockExplorerUrls: ['https://ftmscan.com/']
                                        }],
                                    });
                                } catch (addError) {
                                    console.error('Error adding Fantom Opera:', addError);
                                }
                            } else {
                                console.error('Error switching to Fantom Opera:', error);
                            }
                        }
                    }

                    defaultAddress = accounts[0];
                    $('#tax1Address, #tax2Address, #tax3Address').val(defaultAddress);

                    $('#connectWallet').hide();
                    isConnected = true;
                } catch (error) {
                    console.error('Error connecting to MetaMask:', error);
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

        const provider = new ethers.providers.JsonRpcProvider("https://rpc.testnet.fantom.network/");
        const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();

        try {
            const factory = new ethers.ContractFactory(abi, bytecode, signer);
            const overrides = { value: ethers.utils.parseUnits("1", "ether") };
            const contract = await factory.deploy(
                name, symbol, decimals, maxSupply, initialSupply,
                tax1, tax1Address, tax2, tax2Address, tax3, tax3Address, overrides
            );

            console.log('Deploying contract...');
            await contract.deployed();
            console.log('Contract deployed at:', contract.address);

            const explorerLink = `https://ftmscan.com/address/${contract.address}`;
            $('#deployResult').html(`Contract deployed at: <a href="${explorerLink}" target="_blank">${contract.address}</a><br><button type="button" class="btn btn-info mt-3" id="downloadSource">Download Source Code</button>`);

            $('#downloadSource').click(function() {
                window.location.href = './src.sol';
            });
        } catch (error) {
            console.error('Error deploying contract:', error);
            alert('Error deploying contract: ' + error.message);
        }
    });
});
