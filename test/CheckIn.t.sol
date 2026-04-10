// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {CheckIn} from "../src/CheckIn.sol";

contract CheckInTest is Test {
    CheckIn public c;
    address alice = address(0xA11CE);

    function setUp() public {
        c = new CheckIn();
    }

    function test_CheckIn_FirstTime() public {
        vm.prank(alice);
        c.checkIn();
        assertEq(c.streak(alice), 1);
        assertEq(c.lastCheckInDay(alice), (block.timestamp / 1 days) + 1);
    }

    function test_CheckIn_RevertIfValueSent() public {
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        vm.expectRevert(CheckIn.ValueNotAllowed.selector);
        c.checkIn{value: 1 wei}();
    }

    function test_CheckIn_RevertSameDay() public {
        vm.startPrank(alice);
        c.checkIn();
        vm.expectRevert(CheckIn.AlreadyCheckedInToday.selector);
        c.checkIn();
        vm.stopPrank();
    }

    function test_CheckIn_NextDayIncrementsStreak() public {
        vm.startPrank(alice);
        c.checkIn();
        vm.warp(block.timestamp + 1 days);
        c.checkIn();
        assertEq(c.streak(alice), 2);
        vm.stopPrank();
    }

    function test_CheckIn_MissedDayResetsStreak() public {
        vm.startPrank(alice);
        c.checkIn();
        vm.warp(block.timestamp + 2 days);
        c.checkIn();
        assertEq(c.streak(alice), 1);
        vm.stopPrank();
    }
}
