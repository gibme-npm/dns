# @gibme/dns

[![CI/CD Build Tests](https://github.com/gibme-npm/dns/actions/workflows/ci.yml/badge.svg)](https://github.com/gibme-npm/dns/actions/workflows/ci.yml)
[![NPM](https://img.shields.io/npm/v/@gibme/dns)](https://www.npmjs.com/package/@gibme/dns)
[![License](https://img.shields.io/npm/l/@gibme/dns)](https://github.com/gibme-npm/dns/blob/master/LICENSE)

TypeScript DNS packet encoder/decoder with support for 46+ record types, DNSSEC, mDNS, UDP, TCP, DoT, and DoH.

## Documentation

[https://gibme-npm.github.io/dns/](https://gibme-npm.github.io/dns/)

## Installation

```bash
yarn add @gibme/dns
```

or

```bash
npm install @gibme/dns
```

## Requirements

- Node.js >= 22

## Features

- **Transport protocols**: UDP (unicast & multicast), TCP, DNS over TLS (DoT), DNS over HTTPS (DoH)
- **Multicast DNS**: Full mDNS support with `qu` (unicast response) and `flush` (cache purge) bits
- **46 record type encoders** plus an `Unsupported` fallback for unknown types
- **DNSSEC support**: DNSKEY, DS, RRSIG, NSEC, NSEC3, NSEC3PARAM, CDS, CDNSKEY
- **Name compression**: RFC 1035 pointer compression with cycle detection
- **Security hardening**: Bounds checking, DoS prevention, protocol limit enforcement
- **Automatic TCP fallback**: Transparently retries over TCP when a UDP response is truncated
- **TypeScript**: Full type definitions with generics

## Quick Start

### Simple Lookup

The `lookup()` function handles all transport details, including automatic TCP fallback for truncated UDP responses.

```typescript
import { lookup } from '@gibme/dns';

const [response, error] = await lookup({
    type: 'A',
    name: 'example.com'
});

if (response) {
    for (const answer of response.answers) {
        console.log(answer.name, answer.type, answer.data);
    }
}
```

#### Lookup Options

```typescript
const [response, error] = await lookup(
    { type: 'MX', name: 'example.com' },
    {
        host: '8.8.8.8',   // nameserver (default: '1.1.1.1')
        port: 53,           // port (default: 53)
        timeout: 5000       // per-query timeout in ms (default: 2000)
    }
);
```

### Encoding a Query

```typescript
import { Query } from '@gibme/dns';

const query = new Query({
    id: 0,
    questions: [{
        type: 'A',
        name: 'google.com'
    }]
});

socket.send(query.buffer);
```

### Decoding a Packet

```typescript
import { Packet } from '@gibme/dns';

const packet = new Packet(buffer);

console.log(packet.id);
console.log(packet.questions);
console.log(packet.answers);
```

### Working with Record Data

```typescript
import { Response } from '@gibme/dns';

const response = new Response(buffer);

for (const answer of response.answers) {
    switch (answer.type) {
        case 'A':
            console.log(`IPv4: ${answer.data}`);
            break;
        case 'MX':
            console.log(`Mail: ${answer.data.exchange} (priority ${answer.data.preference})`);
            break;
        case 'TXT':
            console.log(`Text: ${answer.data.join(' ')}`);
            break;
    }
}
```

### Building a Response

```typescript
import { Packet } from '@gibme/dns';

const response = new Packet({
    id: 1234,
    type: 1,
    recursion_desired: true,
    recursion_available: true,
    questions: [{ type: 'A', name: 'example.com' }],
    answers: [
        { type: 'A', name: 'example.com', ttl: 300, data: '93.184.216.34' },
        { type: 'AAAA', name: 'example.com', ttl: 300, data: '2606:2800:220:1:248:1893:25c8:1946' }
    ],
    authorities: [],
    additionals: []
});

socket.send(response.buffer);
```

## Supported Record Types

| Type | ID | Description |
|------|------|-------------|
| A | 1 | IPv4 address |
| NS | 2 | Authoritative name server |
| CNAME | 5 | Canonical name alias |
| SOA | 6 | Start of authority |
| PTR | 12 | Pointer for reverse DNS |
| HINFO | 13 | Host information |
| MX | 15 | Mail exchange |
| TXT | 16 | Text strings |
| RP | 17 | Responsible person |
| AFSDB | 18 | AFS database location |
| AAAA | 28 | IPv6 address |
| LOC | 29 | Geographic location |
| SRV | 33 | Service locator |
| NAPTR | 35 | Naming authority pointer |
| KX | 36 | Key exchanger |
| CERT | 37 | Certificate |
| DNAME | 39 | Delegation name |
| OPT | 41 | EDNS(0) options |
| DS | 43 | Delegation signer (DNSSEC) |
| SSHFP | 44 | SSH fingerprint |
| IPSECKEY | 45 | IPsec public key |
| RRSIG | 46 | RR signature (DNSSEC) |
| NSEC | 47 | Next secure (DNSSEC) |
| DNSKEY | 48 | DNS public key (DNSSEC) |
| DHCID | 49 | DHCP identifier |
| NSEC3 | 50 | Next secure v3 (DNSSEC) |
| NSEC3PARAM | 51 | NSEC3 parameters (DNSSEC) |
| TLSA | 52 | TLS authentication (DANE) |
| SMIMEA | 53 | S/MIME certificate association |
| HIP | 55 | Host identity protocol |
| CDS | 59 | Child DS (DNSSEC) |
| CDNSKEY | 60 | Child DNSKEY (DNSSEC) |
| OPENPGPKEY | 61 | OpenPGP public key |
| CSYNC | 62 | Child-to-parent sync |
| ZONEMD | 63 | Zone message digest |
| SVCB | 64 | Service binding |
| HTTPS | 65 | HTTPS service binding |
| EUI48 | 108 | 48-bit MAC address |
| EUI64 | 109 | 64-bit EUI address |
| TKEY | 249 | Transaction key |
| TSIG | 250 | Transaction signature |
| URI | 256 | Uniform resource identifier |
| CAA | 257 | Certification authority authorization |
| AVC | 258 | Application visibility and control |
| DOA | 259 | Digital object architecture |
| AMTRELAY | 260 | AMT relay discovery |
| Unsupported | -- | Raw payload fallback for unknown types |

## Security

This library includes comprehensive security hardening to protect against malicious DNS packets. See [SECURITY.md](SECURITY.md) for full details.

**Key Security Features:**
- Buffer over-read protection with bounds checking
- DoS prevention (section count limits, TCP message size validation)
- Compression bomb protection (max depth: 16 levels)
- Infinite loop detection in record parsing
- DNS protocol limit enforcement (name length, label length, etc.)

**Protocol Limits Enforced:**
- Maximum 100 records per section
- DNS names must not exceed 255 bytes total
- Individual labels must not exceed 63 bytes
- Malformed packets throw descriptive errors

## License

[MIT](LICENSE)
