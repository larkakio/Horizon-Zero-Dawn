// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {CheckIn} from "../src/CheckIn.sol";

contract DeployCheckIn is Script {
    function run() external {
        vm.startBroadcast();
        CheckIn deployed = new CheckIn();
        console.log("CheckIn:", address(deployed));
        vm.stopBroadcast();
    }
}
