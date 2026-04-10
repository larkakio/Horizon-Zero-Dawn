// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Daily on-chain check-in on Base. No ETH accepted (CHECK_IN_FEE = 0).
/// @dev `lastCheckInDay` stores (calendarDay + 1); 0 means the user has never checked in.
contract CheckIn {
    mapping(address => uint256) public lastCheckInDay;
    mapping(address => uint256) public streak;

    event CheckedIn(address indexed user, uint256 indexed day, uint256 streakCount);

    error AlreadyCheckedInToday();
    error ValueNotAllowed();

    /// @notice One check-in per UTC calendar day (block.timestamp / 1 days).
    function checkIn() external payable {
        if (msg.value != 0) revert ValueNotAllowed();

        uint256 day = block.timestamp / 1 days;
        uint256 stored = lastCheckInDay[msg.sender];
        if (stored != 0 && stored - 1 == day) revert AlreadyCheckedInToday();

        uint256 newStreak;
        if (stored == 0) {
            newStreak = 1;
        } else if (stored - 1 == day - 1) {
            newStreak = streak[msg.sender] + 1;
        } else {
            newStreak = 1;
        }

        lastCheckInDay[msg.sender] = day + 1;
        streak[msg.sender] = newStreak;

        emit CheckedIn(msg.sender, day, newStreak);
    }
}
