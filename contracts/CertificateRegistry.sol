// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract CertificateRegistry {

    address public owner;

    struct Certificate {
        address issuer;
        uint256 issuedAt;
        bool exists;
        bool revoked;
    }

    mapping(address => bool) public authorizedIssuers;
    mapping(bytes32 => Certificate) public certificates;

    event IssuerAuthorized(address indexed issuer);
    event IssuerRemoved(address indexed issuer);

    event CertificateRegistered(
        bytes32 indexed certificateHash,
        address indexed issuer,
        uint256 timestamp
    );

    event CertificateRevoked(
        bytes32 indexed certificateHash
    );

    constructor() {
        owner = msg.sender;
        authorizedIssuers[msg.sender] = true;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyIssuer() {
        require(
            authorizedIssuers[msg.sender],
            "Unauthorized issuer"
        );
        _;
    }

    function authorizeIssuer(address issuer)
        external onlyOwner
    {
        require(issuer != address(0), "Invalid address");

        authorizedIssuers[issuer] = true;
        emit IssuerAuthorized(issuer);
    }

    function removeIssuer(address issuer)
        external onlyOwner
    {
        authorizedIssuers[issuer] = false;
        emit IssuerRemoved(issuer);
    }

    function registerCertificate(bytes32 certificateHash)
        external onlyIssuer
    {
        require(
            certificateHash != bytes32(0),
            "Invalid hash"
        );

        require(
            !certificates[certificateHash].exists,
            "Certificate already registered"
        );

        certificates[certificateHash] = Certificate(
            msg.sender,
            block.timestamp,
            true,
            false
        );

        emit CertificateRegistered(
            certificateHash,
            msg.sender,
            block.timestamp
        );
    }

    function verifyCertificate(bytes32 certificateHash)
        external view returns (bool)
    {
        Certificate memory cert =
            certificates[certificateHash];

        return cert.exists && !cert.revoked;
    }

    function revokeCertificate(bytes32 certificateHash)
        external
    {
        Certificate storage cert =
            certificates[certificateHash];

        require(cert.exists, "Certificate not found");
        require(!cert.revoked, "Already revoked");

        require(
            msg.sender == cert.issuer ||
            msg.sender == owner,
            "Not authorized"
        );

        cert.revoked = true;

        emit CertificateRevoked(certificateHash);
    }
}