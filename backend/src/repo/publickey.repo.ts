/***
 * ECDSA
 * Curve      : SECG secp256r1 / X9.62 prime256v1 / NIST P-256
 * Generator  : https://emn178.github.io/online-tools/ecdsa/key-generator/
 **/

const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgZzB6cCCmSvtuMCsr
GXpbp19W4Txq66PIzsDL/dnUmbKhRANCAAR1szZm70N510mHpGL7Sy9BWJZcM2Xj
Ujo4fAhTk109YLAO7KUQl+9ZdmQbNdx9412FLw4aHRRviXV9RFWdSVvq
-----END PRIVATE KEY-----`;

const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEdbM2Zu9DeddJh6Ri+0svQViWXDNl
41I6OHwIU5NdPWCwDuylEJfvWXZkGzXcfeNdhS8OGh0Ub4l1fURVnUlb6g==
-----END PUBLIC KEY-----`;

export const PublicKeyRepository = {
  get: () => {
    return PUBLIC_KEY;
  },
};
