# Dspace

https://github.com/seia-soto/progressive/tree/master/packages/dspace

Dspace is a simple layer to handle DNS packet.
The purpose of dspace is to replace existing packages handling packets inefficiently and use better types.

- [Dspace](#dspace)
- [Implementation](#implementation)
- [API](#api)
  - [Do53](#do53)
    - [`dspace.do53.packet.packText`](#dspacedo53packetpacktext)
    - [`dspace.do53.packet.packLabel`](#dspacedo53packetpacklabel)
    - [`dspace.do53.packet.packQuestion`](#dspacedo53packetpackquestion)
    - [`dspace.do53.packet.packResource`](#dspacedo53packetpackresource)
    - [`dspace.do53.packet.pack`](#dspacedo53packetpack)
    - [`dspace.do53.packet.unpackLabel`](#dspacedo53packetunpacklabel)
    - [`dspace.do53.packet.unpackText`](#dspacedo53packetunpacktext)
    - [`dspace.do53.packet.unpackQuestion`](#dspacedo53packetunpackquestion)
    - [`dspace.do53.packet.unpackResource`](#dspacedo53packetunpackresource)
    - [`dspace.do53.packet.unpack`](#dspacedo53packetunpack)
      - [Unpacking the `UPDATE` packet](#unpacking-the-update-packet)
- [LICENSE](#license)

----

# Implementation

Dspace is working in progress to implement [Standard and Proposed Security Standards RFC documents described in Wikipedia](https://en.wikipedia.org/wiki/Domain_Name_System#RFC_documents).

**Packet manipulation**

- [RFC 1035] Domain Implementation and Specification (November 1987): https://datatracker.ietf.org/doc/html/rfc1035
  - Non-experimental and Non-obsolete Resource Records (except for NULL RR which is used as fallback record)
  - Recursive resistance pointer parsing support in labels
- [RFC 1123] Requirements for Internet Hosts (October 1989) — DOMAIN NAME TRANSLATION: https://datatracker.ietf.org/doc/html/rfc1123#section-6
  - Unused fields in a query or response message is all zero
  - Writing pointer support in labels
- [RFC 1995] Incremental Zone Transfer in DNS (August 1996): https://datatracker.ietf.org/doc/html/rfc1995
  - Incremental transfer (IXFR) Resource Record
- [RFC 1996] A Mechanism for Prompt Notification of Zone Changes (DNS NOTIFY) (August 1996): https://datatracker.ietf.org/doc/html/rfc1996
  - Notify operation code support (compatible with 1035 & 1123)
- [RFC 2136] Dynamic Updates in the Domain Name System (DNS UPDATE) (April 1997): https://datatracker.ietf.org/doc/html/rfc2136
  - Update operation code support (compatible with 1035 & 1123)
- [RFC 2308] Negative Caching of DNS Queries (DNS NCACHE) (March 1998): https://datatracker.ietf.org/doc/html/rfc2308
  - Nothing to do
- **EXPERIMENTAL (might have some bugs)** [RFC 4034] DNSSEC Resource Records (March 2005): https://datatracker.ietf.org/doc/html/rfc4034
  - DNS Security Extension related Resource Records

**Server**

None.

**Client**

None.

# API

Please refer the TypeScript definition for arguments and returning values.
The specific sections will not describe detailed unless additional resources are required.

```typescript
import * as do53 from './models/do53/index.js';
export { do53, };
```

## Do53

DNS over the port 53, or plain-text DNS.

**`TPart[]`**

This type is for buffertly which builds our specification and data into actual buffer.
The first entry represents the data itself in number.
For example, we represent the string in number using `String.prototype.charCodeAt` API.
The second entry is the length of the data in bits.

```ts
type TPart = readonly [number, number];
```

See [Buffertly API](https://github.com/seia-soto/progressive/tree/master/packages/buffertly#buffertlyoctets) for more information.

**Unit — Octet and bit**

There are many cases mixing units — especially bytes and bits.
It's important that all parameters we accept is expressed as `bits` except for `data.size` in `TResource`.
Only the `NULL` RR, a fallback resource record in dspace, can make additional confusion of developers since all numbers in RFCs are written in bytes(octets).

**Packing**

In packing process, we use the following flow.
We use the term `buildable` for the exclusively partial porperties.

```
pack(packet: TBuildablePacket): Buffer
- packComponent(component: TBuildableComponent): TPart[]
```

**Unpacking**

In unpacking process, we use the following flow.
The offset is expressed in bits.

```
unpack(buffer: Buffer): IPacket
- unpackComponent(buffer: Buffer, offset: number, ...): TComponent
```

**Method**

```typescript
/// <reference types="node" />
import { EClass, ERecord, EResourceOrder, IPacket, IQuestion, TBuildablePacket, TBuildableQuestion, TCompressionMap, TPart, TResources } from './definition.js';
export declare const packText: (text: string) => TPart[];
export declare const packLabel: (text: string, compressionMap: TCompressionMap) => TPart[];
export declare const packQuestion: (q: TBuildableQuestion, compressionMap: TCompressionMap) => readonly [...TPart[], readonly [ERecord | import("./definition.js").EQuestionRecord, 16], readonly [EClass, 16]];
export declare const packResource: (r: TResources, compressionMap: TCompressionMap) => TPart[];
export declare const pack: (a: TBuildablePacket) => Buffer;
export declare const unpackLabel: (buffer: Buffer, offset: number, jump?: number) => readonly [number, string];
export declare const unpackText: (buffer: Buffer, offset: number) => readonly [number, string];
export declare const unpackQuestion: (buffer: Buffer, offset: number) => readonly [number, IQuestion];
export declare const unpackResource: (buffer: Buffer, offset: number, order?: EResourceOrder) => readonly [number, TResources];
export declare const unpack: (buffer: Buffer) => IPacket;
```

**Definition**

```typescript
export declare type TFlag = 0 | 1;
export declare type TPart = readonly [number, number];
export declare const enum EQueryOrResponse {
    Query = 0,
    Response = 1
}
export declare const enum EOperationCode {
    Query = 0,
    InverseQuery = 1,
    ServerStatus = 2,
    Notify = 4,
    Update = 5
}
export declare const enum EResponseCode {
    NoError = 0,
    FormatError = 1,
    ServerFailure = 2,
    NameError = 3,
    NotImplemented = 4,
    Refused = 5,
    YxDomain = 6,
    YxRrSet = 7,
    NxRrSet = 8,
    NotAuthorized = 9,
    NotZone = 10
}
export interface IOptions {
    isAuthoritativeAnswer: TFlag;
    isTruncated: TFlag;
    isRecursionDesired: TFlag;
    isRecursionAvailable: TFlag;
}
export interface ICounts {
    question: number;
    answer: number;
    nameserver: number;
    additional: number;
}
export interface IHeader {
    id: number;
    isQueryOrResponse: EQueryOrResponse;
    operationCode: EOperationCode;
    responseCode: EResponseCode;
    options: IOptions;
    counts: ICounts;
}
export declare const enum ERecord {
    A = 1,
    NS = 2,
    CNAME = 5,
    SOA = 6,
    MB = 7,
    MG = 8,
    MR = 9,
    NULL = 10,
    WKS = 11,
    PTR = 12,
    HINFO = 13,
    MINFO = 14,
    MX = 15,
    TXT = 16,
    DS = 43,
    RRSIG = 46,
    NSEC = 47,
    DNSKEY = 48
}
export declare const enum EQuestionRecord {
    IXFR = 251,
    AXFR = 252,
    MAILB = 253,
    MAILA = 254,
    Any = 255
}
export declare const enum EClass {
    Internet = 1,
    Chaos = 3,
    Hesiod = 4,
    None = 254,
    Any = 255
}
export interface IQuestion {
    name: string;
    type: ERecord | EQuestionRecord;
    class: EClass;
}
export declare const enum EResourceOrder {
    Answer = 0,
    Authority = 1,
    Additional = 2
}
export interface IResource {
    order: EResourceOrder;
    name: string;
    type: ERecord;
    class: EClass;
    ttl: number;
    data: unknown;
}
export interface IResourceOfCname extends IResource {
    type: ERecord.CNAME;
    data: string;
}
export interface IResourceOfHinfo extends IResource {
    type: ERecord.HINFO;
    data: {
        cpu: string;
        os: string;
    };
}
export interface IResourceOfMx extends IResource {
    type: ERecord.MX;
    data: {
        preference: number;
        exchange: string;
    };
}
export interface IResourceOfNs extends IResource {
    type: ERecord.NS;
    data: string;
}
export interface IResourceOfPtr extends IResource {
    type: ERecord.PTR;
    data: string;
}
export interface IResourceOfSoa extends IResource {
    type: ERecord.SOA;
    data: {
        name: string;
        representative: string;
        serial: number;
        refreshIn: number;
        retryIn: number;
        expireIn: number;
        ttl: number;
    };
}
export interface IResourceOfTxt extends IResource {
    type: ERecord.TXT;
    data: string;
}
export declare type TInternetAddress = readonly [number, number, number, number];
export interface IResourceOfA extends IResource {
    type: ERecord.A;
    data: TInternetAddress;
}
export interface IResourceOfWks extends IResource {
    type: ERecord.WKS;
    data: {
        address: TInternetAddress;
        protocol: number;
        ports: number[];
    };
}
export interface IResourceOfNull extends IResource {
    type: ERecord.NULL;
    data: {
        size: number;
    };
}
export declare const enum EKeyAlgorithm {
    RSAMD5 = 1,
    DH = 2,
    DSA = 3,
    ECC = 4,
    RSASHA1 = 5,
    INDIRECT = 252,
    PRIVATEDNS = 253,
    PRIVATEOID = 254
}
export interface IResourceOfDnskey extends IResource {
    type: ERecord.DNSKEY;
    data: {
        flags: {
            isZoneKey: TFlag;
            isSecureEntryPoint: TFlag;
        };
        protocol: 3;
        algorithm: EKeyAlgorithm;
        publicKey: number[];
    };
}
export interface IResourceOfRrsig extends IResource {
    type: ERecord.RRSIG;
    data: {
        typeCovered: ERecord;
        algorithm: EKeyAlgorithm;
        labels: number;
        originalTtl: number;
        signatureExpiration: number;
        signatureInception: number;
        keyTag: number;
        signerName: string;
        signature: number[];
    };
}
export interface IResourceOfNsec extends IResource {
    type: ERecord.NSEC;
    data: {
        nextName: string;
        typeBitMap: ERecord[];
    };
}
export declare const enum EDigestType {
    SHA1 = 1
}
export interface IResourceOfDs extends IResource {
    type: ERecord.DS;
    data: {
        keyTag: number;
        algorithm: EKeyAlgorithm;
        digestType: EDigestType;
        digest: number[];
    };
}
export declare type TResources = IResourceOfCname | IResourceOfHinfo | IResourceOfMx | IResourceOfNs | IResourceOfPtr | IResourceOfSoa | IResourceOfTxt | IResourceOfA | IResourceOfWks | IResourceOfNull | IResourceOfDnskey | IResourceOfRrsig | IResourceOfNsec | IResourceOfDs;
export interface IPacket extends IHeader {
    questions: IQuestion[];
    resources: TResources[];
}
export interface IUpdatePacket extends Omit<IPacket, 'options'> {
    questions: (Omit<IQuestion, 'type'> & {
        type: ERecord.SOA;
    })[];
}
export declare type TOptionalResourcesClassField = Partial<{
    class: EClass;
}>;
export declare type TBuildableQuestion = Omit<IQuestion, 'class'> & TOptionalResourcesClassField;
export declare type TBuildableResource = Omit<TResources, 'class'> & TOptionalResourcesClassField;
export declare type TBuildablePacketOverridingParameters = 'options' | 'questions' | 'resources';
export interface IBuildablePacketOverrides extends Omit<IPacket, TBuildablePacketOverridingParameters> {
    options: Partial<IOptions>;
    questions: TBuildableQuestion[];
    resources: TBuildableResource[];
}
export declare type TNecessaryPacketParameters = 'isQueryOrResponse';
export declare type TBuildablePacket = Pick<IBuildablePacketOverrides, TNecessaryPacketParameters> & Partial<Omit<IBuildablePacketOverrides, TNecessaryPacketParameters>>;
export declare type TCompressionMap = Record<string, number> & {
    __offset: number;
};
```

### `dspace.do53.packet.packText`

Pack text into `TPart[]`.
You need to manually append the null terminator at the end using `yourText + '\0'`.

```ts
packText('text')
```

### `dspace.do53.packet.packLabel`

Pack domain name into `TPart[]`.
Also, you need to give `TCompressionMap` to perform compress, otherwise just pass `{__offset: 0}`.

```ts
packLabel('domain.tld', {__offset: 0})
```

The label is used to represent the domain name in DNS packet consisted with series of octets — The length of label and text.
The length of the line in the following graph is 16 bits.

```
       +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    00 |           6           |           D           |
       +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    02 |           O           |           M           |
       +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    04 |           A           |           I           |
       +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    06 |           N           |           3           |
       +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    08 |           T           |           L           |
       +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    10 |           D           |           0           |
       +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
```

### `dspace.do53.packet.packQuestion`

Pack question section into `TPart[]`.
In case, you can skip defining the `class` property as this method supports `TBuildableQuestion`.

The passed compression map will be drilled into `packLabel` method.

```ts
const buildableQuestion: TBuildableQuestion = {
  name: 'domain.tld',
  type: ERecord.A,
  // class: EClass.Internet
}

packQuestion(buildableQuestion, {__offset: 0})
```

### `dspace.do53.packet.packResource`

Pack RR(Resource Record) into `TPart[]`.
In case, you can skip defining the `class` property and force it as to be `TResource` instead of `TBuildableResource`.

The passed compression map will be drilled into `packLabel` method.

```ts
const resource: TResource = {
  order: EResourceOrder.Answer,
  name: 'domain.tld',
  type: ERecord.A,
  class: EClass.Internet, // You may skip defining the `class`
  ttl: 60, // in Second
  data: [127, 0, 0, 1]
}

packResource(resource /* as TResource */, {__offset: 0})
```

### `dspace.do53.packet.pack`

Pack the buildable request or response to `Buffer`.
Also, see `TBuildableQuestion`, `TBuildableResource`, `IOptions`, and `TBuildablePacket`.

```ts
import {createSocket} from 'dgram:udp4';

const soc = createSocket('udp4');
const req = pack({
  isQueryOrResponse: EQueryOrResponse.Query,
  questions: [
    {
      type: ERecord.A,
      name: 'cloudflare.com',
    },
  ],
  options: {
    isRecursionDesired: 1,
  },
});

soc.send(req, 53, '1.1.1.2');
soc.once('message', message => console.log(message));
```

The buildable means that dpsace allows some missing parameters.
We define it as TypeScript type in definition.

```ts
export declare type TBuildablePacketOverridingParameters = 'options' | 'questions' | 'resources';
export interface IBuildablePacketOverrides extends Omit<IPacket, TBuildablePacketOverridingParameters> {
    options: Partial<IOptions>;
    questions: TBuildableQuestion[];
    resources: TBuildableResource[];
}
export declare type TNecessaryPacketParameters = 'isQueryOrResponse';
export declare type TBuildablePacket = Pick<IBuildablePacketOverrides, TNecessaryPacketParameters> & Partial<Omit<IBuildablePacketOverrides, TNecessaryPacketParameters>>;
```

### `dspace.do53.packet.unpackLabel`

Unpack the label supporting pointers.
The pointer system is well-described in [RFC 1035#Message Compression](https://datatracker.ietf.org/doc/html/rfc1035#section-4.1.4).

```ts
const [nextOffset, domain] = unpackLabel(buffer, 0)
```

### `dspace.do53.packet.unpackText`

Unpack the text until the null terminator appears.

```ts
const [nextOffset, text] = unpackText(buffer, 0)
```

### `dspace.do53.packet.unpackQuestion`

Unpack the question section from the specific offset.

```ts
const [nextOffset, question] = unpackQuestion(buffer, 0)
```

### `dspace.do53.packet.unpackResource`

Unpack the resource record from the specific offset.
This method receives an optional `EResourceOrder` as the last parameter to specify the category of the resource record.

```ts
const [nextOffset, resource] = unpackResource(buffer, 0, EResourceOrder.Answer)
```

See also: https://datatracker.ietf.org/doc/html/rfc1035#section-4.1

```
    +---------------------+
    |        Header       |
    +---------------------+
    |       Question      | the question for the name server
    +---------------------+
    |        Answer       | RRs answering the question
    +---------------------+
    |      Authority      | RRs pointing toward an authority
    +---------------------+
    |      Additional     | RRs holding additional information
    +---------------------+
```

### `dspace.do53.packet.unpack`

Unpack the packet buffer.

```ts
socket.on('message', message => {
  const request = unpack(message)

  console.log(request)
})
```

#### Unpacking the `UPDATE` packet

You may want to unpack the `UPDATE` packet which `IPacket.operationCode` is `EOperationCode.Update`.
In this case, you can force the type using `IUpdatePacket`.

In RFC 2136, the terms are different.
However, it's not reasonable to build an unpacking function especially for the zone section since the structure of the packet is same.

The `IPacket` fully covers `IUpdatePacket`.

```ts
const unpackUpdate = (buffer: Buffer) => {
  const request = unpack(message)

  if (request.operationCode === EOperationCode.Update) {
    return request as IUpdatePacket
  }

  return request
}
```

# LICENSE

This package and code is distributed over MIT License.

```
MIT License Copyright 2022 HoJeong Go

Permission is hereby granted, free of
charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to the
following conditions:

The above copyright notice and this permission notice
(including the next paragraph) shall be included in all copies or substantial
portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO
EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```
