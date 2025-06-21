### DNS packet encoding & decoding in an abstract way

## Documentation

[https://gibme-npm.github.io/dns/](https://gibme-npm.github.io/dns/)

## Features

This package is designed to encode & decode DNS packets whether they are being transmitted via:

* UDP
  * Unicast or Multicast
* TCP
* DNS over TLS
* DNS over HTTPs

### Includes support for:

* Full support for Multicast DNS:
  * `qu` bit - Requesting unicast responses
  * `flush` bit - Requesting clearing of cached entries
* The following record types:
  * A
  * AAAA
  * AFSDB
  * AMTRELAY
  * AVC
  * CAA
  * CDNSKEY
  * CDS
  * CERT
  * CNAME
  * CSYNC
  * DHCID
  * DNAME
  * DNSKEY
  * DOA
  * DS
  * EUI48
  * EUI64
  * HINFO
  * IPSECKEY
  * KX
  * LOC
  * MX
  * NAPTR
  * NS
  * NSEC
  * NSEC3
  * NSEC3PARAM
  * OPENPGPKEY
  * OPT
  * PTR
  * RP
  * RRSIG
  * SMIMEA
  * SOA
  * SRV
  * SSHFP
  * SVCB
  * TKEY
  * TLSA
  * TSIG
  * TXT
  * URI
  * ZONEMD
  * Any others supported via `Unsupported` that provides the payload in Buffer form

## Sample Code

### Encoding

```typescript
import { Query } from '@gibme/dns';

const query = new Query({
    id: 0,
    questions: [{
        type: 'A',
        name: 'google.com'
    }]
})

socket.send(query.buffer);
```

### Decoding

```typescript
import { Packet } from '@gibme/dns';

const packet = new Packet(buffer);

console.log(packet);
```
