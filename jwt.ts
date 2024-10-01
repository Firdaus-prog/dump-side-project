import jwt, { SignOptions } from "jsonwebtoken";



const now = Math.round(new Date().getTime() / 1000);
const nowPlus20 = now + 19 * 60;

const key = {
    private_key: `-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgY9nRbV17Jgev6d4m
i39SP59InBRWrWZyN4bjsSwZ7IOgCgYIKoZIzj0DAQehRANCAATU+aJp06cJ5izg
yrNaqIIFinZ1maI4XI7PmIVQzAa/Cj+XHTrBbRPVlRKfheP2ktljnTPW1GD7dgLY
zoNhei+e
-----END PRIVATE KEY-----`,
    key_id: 'P9F762SC3V',
    issuer_id: '69a6de70-a7ec-47e3-e053-5b8c7c11a4d1',
    app_bundle_id: 'com.astro.sott'
  }

const key_buff = Buffer.from(key.private_key, "utf-8");

const payload = {
iss: key.issuer_id,
exp: nowPlus20,
aud: "appstoreconnect-v1",
};

const signOptions: SignOptions = {
algorithm: "ES256",
header: {
    alg: "ES256",
    kid: key.key_id,
    typ: "JWT",
},
};

const token = jwt.sign(payload, key_buff, signOptions);
console.log(token);