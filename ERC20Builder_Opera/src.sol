// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {

    event Transfer(address indexed from, address indexed to, uint256 value);

    event Approval(address indexed owner, address indexed spender, uint256 value);

    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function transfer(address to, uint256 value) external returns (bool);

    function allowance(address owner, address spender) external view returns (uint256);

    function approve(address spender, uint256 value) external returns (bool);

    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

interface IERC20Metadata is IERC20 {
    function name() external view returns (string memory);

    function symbol() external view returns (string memory);

    function decimals() external view returns (uint8);
}

interface IERC20Errors {
    error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed);

    error ERC20InvalidSender(address sender);

    error ERC20InvalidReceiver(address receiver);

    error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed);

    error ERC20InvalidApprover(address approver);

    error ERC20InvalidSpender(address spender);
}

interface IGenLink {
    function pay(string memory serviceName) external payable;
}

abstract contract GenLink {

    constructor (address payable receiver, string memory serviceName) payable {
        IGenLink(receiver).pay{value: msg.value}(serviceName);
    }
}

abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}

abstract contract ERC20 is Context, IERC20, IERC20Metadata, IERC20Errors {
    mapping(address account => uint256) private _balances;

    mapping(address account => mapping(address spender => uint256)) private _allowances;

    uint256 private _totalSupply;

    string private _name;
    string private _symbol;
    uint8 private _decimals;

    constructor(string memory name_, string memory symbol_, uint8 decimals_) {
        _name = name_;
        _symbol = symbol_;
        _decimals = decimals_;
    }

    function name() public view virtual returns (string memory) {
        return _name;
    }

    function symbol() public view virtual returns (string memory) {
        return _symbol;
    }

    function decimals() public view virtual returns (uint8) {
        return _decimals;
    }

    function totalSupply() public view virtual returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view virtual returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 value) public virtual returns (bool) {
        address owner = _msgSender();
        _transfer(owner, to, value);
        return true;
    }

    function allowance(address owner, address spender) public view virtual returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 value) public virtual returns (bool) {
        address owner = _msgSender();
        _approve(owner, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) public virtual returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, value);
        _transfer(from, to, value);
        return true;
    }

    function _transfer(address from, address to, uint256 value) internal virtual {
        if (from == address(0)) {
            revert ERC20InvalidSender(address(0));
        }
        if (to == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        _update(from, to, value);
    }

    function _update(address from, address to, uint256 value) internal virtual {
        if (from == address(0)) {
            _totalSupply += value;
        } else {
            uint256 fromBalance = _balances[from];
            if (fromBalance < value) {
                revert ERC20InsufficientBalance(from, fromBalance, value);
            }
            unchecked {
                _balances[from] = fromBalance - value;
            }
        }
        if (to == address(0)) {
            unchecked {
                _totalSupply -= value;
            }
        } else {
            unchecked {
                _balances[to] += value;
            }
        }
        emit Transfer(from, to, value);
    }

    function _mint(address account, uint256 value) internal {
        if (account == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        _update(address(0), account, value);
    }

    function burn(uint256 value) external {
        _burn(msg.sender, value);
    }

    function _burn(address account, uint256 value) internal {
        if (account == address(0)) {
            revert ERC20InvalidSender(address(0));
        }
        _update(account, address(0), value);
    }

    function _approve(address owner, address spender, uint256 value) internal {
        _approve(owner, spender, value, true);
    }

    function _approve(address owner, address spender, uint256 value, bool emitEvent) internal virtual {
        if (owner == address(0)) {
            revert ERC20InvalidApprover(address(0));
        }
        if (spender == address(0)) {
            revert ERC20InvalidSpender(address(0));
        }
        _allowances[owner][spender] = value;
        if (emitEvent) {
            emit Approval(owner, spender, value);
        }
    }

    function _spendAllowance(address owner, address spender, uint256 value) internal virtual {
        uint256 currentAllowance = allowance(owner, spender);
        if (currentAllowance != type(uint256).max) {
            if (currentAllowance < value) {
                revert ERC20InsufficientAllowance(spender, currentAllowance, value);
            }
            unchecked {
                _approve(owner, spender, currentAllowance - value, false);
            }
        }
    }
}

abstract contract Ownable is Context {
    address private _owner;

    error OwnableUnauthorizedAccount(address account);

    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    function owner() public view virtual returns (address) {
        return _owner;
    }

    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

contract factory20 is ERC20, Ownable, GenLink {
    uint256 public maxSupply;
    uint256 public tax1Percent;
    address public tax1Wallet;
    uint256 public tax2Percent;
    address public tax2Wallet;
    uint256 public tax3Percent;
    address public tax3Wallet;

    mapping(address => bool) public whitelist;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 _maxSupply,
        uint256 initialSupply,
        uint256 _tax1Percent,
        address _tax1Wallet,
        uint256 _tax2Percent,
        address _tax2Wallet,
        uint256 _tax3Percent,
        address _tax3Wallet
    )
      ERC20(name, symbol, decimals)
      Ownable(msg.sender)
      GenLink(payable(0xFa429b8e6896806a814EC6E0Bd8E17e16fC37D51), "ERC20")
      payable
    {
        require(initialSupply <= _maxSupply, "Initial supply exceeds max supply");
        require(tax1Percent+tax2Percent+tax3Percent < 100,"Total taxes cant be > 100%");
        maxSupply = _maxSupply;
        _mint(msg.sender, initialSupply);
        tax1Percent = _tax1Percent;
        tax1Wallet = _tax1Wallet;
        tax2Percent = _tax2Percent;
        tax2Wallet = _tax2Wallet;
        tax3Percent = _tax3Percent;
        tax3Wallet = _tax3Wallet;
    }

    function addToWhitelist(address _address) public onlyOwner {
        whitelist[_address] = true;
    }

    function removeFromWhitelist(address _address) public onlyOwner {
        whitelist[_address] = false;
    }

    function setTaxDetails(
         uint256 _taxPercent1,
         address _taxAddress1,
         uint256 _taxPercent2,
         address _taxAddress2,
         uint256 _taxPercent3,
         address _taxAddress3
    ) external onlyOwner {
        require(_taxPercent1+_taxPercent2+_taxPercent3 < 100,"Total taxes cant be > 100%");
        tax1Percent = _taxPercent1;
        tax1Wallet = _taxAddress1;
        tax2Percent = _taxPercent2;
        tax2Wallet = _taxAddress2;
        tax3Percent = _taxPercent3;
        tax3Wallet = _taxAddress3;
    }


    function _transfer(
        address sender,
        address recipient,
        uint256 amount
    ) internal virtual override {
        if (whitelist[sender] || whitelist[recipient]) {
            super._transfer(sender, recipient, amount);
            return;
        }

        uint256 tax1 = (amount * tax1Percent) / 100;
        uint256 tax2 = (amount * tax2Percent) / 100;
        uint256 tax3 = (amount * tax3Percent) / 100;
        uint256 taxedAmount = amount - tax1 - tax2 - tax3;

        super._transfer(sender, tax1Wallet, tax1);
        super._transfer(sender, tax2Wallet, tax2);
        super._transfer(sender, tax3Wallet, tax3);
        super._transfer(sender, recipient, taxedAmount);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        require(totalSupply() + amount <= maxSupply, "Max supply exceeded");
        _mint(to, amount);
    }
}
