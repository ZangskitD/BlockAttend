// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * Stores cryptographic proofs for attendance records.
 * No student name, email, roll number, or other PII is written on-chain.
 */
contract AttendanceRegistry {
    struct Proof {
        uint256 committedAt;
        address committedBy;
        bool exists;
    }

    mapping(bytes32 => Proof) private proofs;

    event AttendanceCommitted(
        bytes32 indexed attendanceHash,
        address indexed committedBy,
        uint256 committedAt
    );

    function recordAttendance(bytes32 attendanceHash) external {
        require(attendanceHash != bytes32(0), "Invalid hash");
        require(!proofs[attendanceHash].exists, "Hash already committed");

        proofs[attendanceHash] = Proof({
            committedAt: block.timestamp,
            committedBy: msg.sender,
            exists: true
        });

        emit AttendanceCommitted(attendanceHash, msg.sender, block.timestamp);
    }

    function verifyAttendance(bytes32 attendanceHash)
        external
        view
        returns (bool exists, uint256 committedAt, address committedBy)
    {
        Proof memory p = proofs[attendanceHash];
        return (p.exists, p.committedAt, p.committedBy);
    }
}
