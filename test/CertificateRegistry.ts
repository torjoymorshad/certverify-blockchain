import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { keccak256, toHex } from "viem";

describe("CertificateRegistry", async function () {
  const { viem } = await network.connect();

  async function setup() {
    const [owner, issuer, outsider] =
      await viem.getWalletClients();

    const registry =
      await viem.deployContract("CertificateRegistry");

    const hash = keccak256(toHex("Sample Certificate"));

    return { registry, owner, issuer, outsider, hash };
  }

  it("Should authorize the owner", async function () {
    const { registry, owner } = await setup();

    assert.equal(
      await registry.read.authorizedIssuers([
        owner.account.address
      ]),
      true
    );
  });

  it("Should register and verify a certificate", async function () {
    const { registry, hash } = await setup();

    await registry.write.registerCertificate([hash]);

    assert.equal(
      await registry.read.verifyCertificate([hash]),
      true
    );
  });

  it("Should reject an unregistered certificate", async function () {
    const { registry, hash } = await setup();

    assert.equal(
      await registry.read.verifyCertificate([hash]),
      false
    );
  });

  it("Should prevent duplicate registration", async function () {
    const { registry, hash } = await setup();

    await registry.write.registerCertificate([hash]);

    await assert.rejects(
      registry.write.registerCertificate([hash]),
      /Certificate already registered/
    );
  });

  it("Should prevent unauthorized registration", async function () {
    const { registry, outsider, hash } = await setup();

    await assert.rejects(
      registry.write.registerCertificate(
        [hash],
        { account: outsider.account }
      ),
      /Unauthorized issuer/
    );
  });

  it("Should authorize a new issuer", async function () {
    const { registry, issuer, hash } = await setup();

    await registry.write.authorizeIssuer([
      issuer.account.address
    ]);

    await registry.write.registerCertificate(
      [hash],
      { account: issuer.account }
    );

    assert.equal(
      await registry.read.verifyCertificate([hash]),
      true
    );
  });

  it("Should revoke a certificate", async function () {
    const { registry, hash } = await setup();

    await registry.write.registerCertificate([hash]);
    await registry.write.revokeCertificate([hash]);

    assert.equal(
      await registry.read.verifyCertificate([hash]),
      false
    );
  });

  it("Should prevent unauthorized revocation", async function () {
    const { registry, outsider, hash } = await setup();

    await registry.write.registerCertificate([hash]);

    await assert.rejects(
      registry.write.revokeCertificate(
        [hash],
        { account: outsider.account }
      ),
      /Not authorized/
    );
  });
});