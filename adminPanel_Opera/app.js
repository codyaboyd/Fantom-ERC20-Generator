let signer;
let contract;
let provider;

document.addEventListener('DOMContentLoaded', function () {
    // Connect Wallet button
    document.getElementById('connectWallet').addEventListener('click', function() {
        connectWallet();
    });

    // Transfer Ownership
    document.getElementById('transferOwnership').addEventListener('click', function() {
        const newOwner = document.getElementById('newOwner').value;
        transferOwnership(newOwner);
    });

    // Set Price
    document.getElementById('setPrice').addEventListener('click', function() {
        const serviceName = document.getElementById('serviceName').value;
        const price = document.getElementById('servicePrice').value;
        setPrice(serviceName, price);
    });

    // Withdraw ETH
    document.getElementById('withdrawEth').addEventListener('click', function() {
        const amount = document.getElementById('withdrawAmount').value;
        withdrawETH(amount);
    });

    // Withdraw Tokens
    document.getElementById('withdrawTokens').addEventListener('click', function() {
        const tokenAddress = document.getElementById('tokenAddress').value;
        withdrawTokens(tokenAddress);
    });

    // Check Price
    document.getElementById('checkPrice').addEventListener('click', function() {
        const serviceName = document.getElementById('checkServiceName').value;
        checkPrice(serviceName);
    });

    // Check Contract Balance
    document.getElementById('checkBalance').addEventListener('click', function() {
        checkContractBalance();
    });
});

async function connectWallet() {
    if (window.ethereum) {
        try {
            provider = new ethers.providers.Web3Provider(window.ethereum); // Initialize the provider
            await provider.send("eth_requestAccounts", []);
            signer = provider.getSigner();
            contract = new ethers.Contract(contractAddress, contractABI, signer);
            document.getElementById('status').innerText = 'Wallet connected!';
        } catch (error) {
            showError(error);
        }
    } else {
        document.getElementById('status').innerText = 'Please install MetaMask!';
    }
}

async function transferOwnership(newOwner) {
    try {
        const transaction = await contract.transferOwnership(newOwner);
        await handleTransactionResponse(transaction);
    } catch (error) {
        showError(error);
    }
}

async function setPrice(serviceName, price) {
    try {
        const transaction = await contract.setPrice(serviceName, ethers.utils.parseUnits(price, 'wei'));
        await handleTransactionResponse(transaction);
    } catch (error) {
        showError(error);
    }
}

async function withdrawETH(amount) {
    try {
        const transaction = await contract.withdraw(ethers.utils.parseUnits(amount, 'wei'));
        await handleTransactionResponse(transaction);
    } catch (error) {
        showError(error);
    }
}

async function withdrawTokens(tokenAddress) {
    try {
        const transaction = await contract.withdrawTokens(tokenAddress);
        await handleTransactionResponse(transaction);
    } catch (error) {
        showError(error);
    }
}

async function checkPrice(serviceName) {
    try {
        const price = await contract.getPrice(serviceName);
        document.getElementById('priceDisplay').innerText = `Price for ${serviceName}: ${ethers.utils.formatUnits(price, 'wei')} Wei`;
    } catch (error) {
        showError(error);
    }
}

async function checkContractBalance() {
    try {
        const balance = await provider.getBalance(contract.address);
        document.getElementById('contractBalance').innerText = `Contract Balance: ${ethers.utils.formatEther(balance)} ETH`;
    } catch (error) {
        showError(error);
    }
}

async function handleTransactionResponse(transaction) {
    document.getElementById('status').innerText = 'Transaction sent. Waiting for confirmation...';
    await transaction.wait();
    document.getElementById('status').innerText = 'Transaction confirmed.';
}

function showError(error) {
    console.error(error);
    document.getElementById('status').innerText = 'Error: ' + error.message;
}
