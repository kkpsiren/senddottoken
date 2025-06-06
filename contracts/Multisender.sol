// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Multisender - minimal batch sending of ETH and ERC-20 tokens
/// @notice Allows batching ETH or token transfers in a single transaction.
/// @notice Minimal ERC-20 interface needed by the contract
interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
}

contract Multisender {

    /// @notice Emitted after a batch ETH transfer completes
    event EtherDispersed(address indexed from, uint256 totalAmount, uint256 numRecipients);

    /// @notice Emitted after a batch token transfer completes
    event TokenDispersed(address indexed token, address indexed from, uint256 totalAmount, uint256 numRecipients);

    /// @dev Disperse ETH to multiple recipients in a single transaction.
    /// @param recipients Array of addresses receiving ETH.
    /// @param amounts Corresponding array of amounts to send each recipient.
    function disperseEther(address[] calldata recipients, uint256[] calldata amounts) external payable {
        require(recipients.length == amounts.length, "length mismatch");

        uint256 total;
        for (uint256 i = 0; i < amounts.length; i++) {
            total += amounts[i];
        }
        require(msg.value == total, "value mismatch");

        for (uint256 i = 0; i < recipients.length; i++) {
            (bool success, ) = recipients[i].call{value: amounts[i]}("");
            require(success, "ETH transfer failed");
        }

        emit EtherDispersed(msg.sender, total, recipients.length);
    }

    /// @dev Disperse ERC-20 tokens to multiple recipients.
    /// @param token Address of the ERC-20 token.
    /// @param recipients Array of recipient addresses.
    /// @param amounts Array of token amounts to transfer.
    function disperseToken(address token, address[] calldata recipients, uint256[] calldata amounts) external {
        require(recipients.length == amounts.length, "length mismatch");

        uint256 total;
        for (uint256 i = 0; i < amounts.length; i++) {
            total += amounts[i];
        }

        IERC20 erc20 = IERC20(token);
        require(erc20.transferFrom(msg.sender, address(this), total), "transferFrom failed");

        for (uint256 i = 0; i < recipients.length; i++) {
            require(erc20.transfer(recipients[i], amounts[i]), "transfer failed");
        }

        emit TokenDispersed(token, msg.sender, total, recipients.length);
    }
}

