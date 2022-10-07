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
- [LICENSE](#license)

----

# Implementation

- Domain Implementation and Specification (November 1987): https://datatracker.ietf.org/doc/html/rfc1035
  - Non-experimental and Non-obsolete Resource Records (except for NULL RR which is used as fallback record)
  - One dimension pointer support in labels (read-only)

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
The `data.size` paramter of `TResource` can be different by resource record type.
Also, `NULL` RR, a fallback resource record in dspace, can make additional confusion of developers since all numbers in RFCs are written in bytes(octets).

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
import { EClass, ERecord, EResourceOrder, IPacket, IQuestion, TBuildablePacket, TBuildableQuestion, TPart, TResources } from './definition.js';
export declare const packText: (text: string) => TPart[];
export declare const packLabel: (text: string) => TPart[];
export declare const packQuestion: (q: TBuildableQuestion) => readonly [...TPart[], readonly [ERecord, 16], readonly [EClass, 16]];
export declare const packResource: (r: TResources) => TPart[];
export declare const pack: (a: TBuildablePacket) => Buffer;
export declare const unpackLabel: (buffer: Buffer, offset: number) => readonly [number, string];
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
    ServerStatus = 2
}
export declare const enum EResponseCode {
    NoError = 0,
    FormatError = 1,
    ServerFailure = 2,
    NameError = 3,
    NotImplemented = 4,
    Refused = 5
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
    TXT = 16
}
export declare const enum EClass {
    Internet = 1,
    Chaos = 3,
    Hesiod = 4
}
export interface IQuestion {
    name: string;
    type: ERecord;
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
    data: {
        size: number;
        source: unknown;
    };
}
export interface IResourceOfCname extends IResource {
    type: ERecord.CNAME;
    data: {
        size: number;
        source: string;
    };
}
export interface IResourceOfHinfo extends IResource {
    type: ERecord.HINFO;
    data: {
        size: number;
        source: {
            cpu: string;
            os: string;
        };
    };
}
export interface IResourceOfMx extends IResource {
    type: ERecord.MX;
    data: {
        size: number;
        source: {
            preference: number;
            exchange: string;
        };
    };
}
export interface IResourceOfNs extends IResource {
    type: ERecord.NS;
    data: {
        size: number;
        source: string;
    };
}
export interface IResourceOfPtr extends IResource {
    type: ERecord.PTR;
    data: {
        size: number;
        source: string;
    };
}
export interface IResourceOfSoa extends IResource {
    type: ERecord.SOA;
    data: {
        size: number;
        source: {
            name: string;
            representative: string;
            serial: number;
            refreshIn: number;
            retryIn: number;
            expireIn: number;
            ttl: number;
        };
    };
}
export interface IResourceOfTxt extends IResource {
    type: ERecord.TXT;
    data: {
        size: number;
        source: string;
    };
}
export declare type TInternetAddress = readonly [number, number, number, number];
export interface IResourceOfA extends IResource {
    type: ERecord.A;
    data: {
        size: 4;
        source: TInternetAddress;
    };
}
export interface IResourceOfWks extends IResource {
    type: ERecord.WKS;
    data: {
        size: number;
        source: {
            address: TInternetAddress;
            protocol: number;
            ports: number[];
        };
    };
}
export interface IResourceOfNull extends IResource {
    type: ERecord.NULL;
    data: {
        size: number;
        source: null;
    };
}
export declare type TResources = IResourceOfCname | IResourceOfHinfo | IResourceOfMx | IResourceOfNs | IResourceOfPtr | IResourceOfSoa | IResourceOfTxt | IResourceOfA | IResourceOfWks | IResourceOfNull;
export declare type TInternetResources = IResourceOfA | IResourceOfWks;
export interface IPacket extends IHeader {
    questions: IQuestion[];
    resources: TResources[];
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
```

### `dspace.do53.packet.packText`

Pack text into `TPart[]` appending the null terminator at the end.

```ts
packText('text')
```

### `dspace.do53.packet.packLabel`

**We don't support writing pointers at this time.**

Pack domain name into `TPart[]` appending the null terminator at the end.

```ts
packLabel('domain.tld')
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

```ts
const buildableQuestion: TBuildableQuestion = {
  name: 'domain.tld',
  type: ERecord.A,
  // class: EClass.Internet
}

packQuestion(buildableQuestion)
```

### `dspace.do53.packet.packResource`

Pack RR(Resource Record) into `TPart[]`.
In case, you can skip defining the `class` property and force it as to be `TResource` instead of `TBuildableResource`.

```ts
const resource: TResource = {
  order: EResourceOrder.Answer,
  name: 'domain.tld',
  type: ERecord.A,
  class: EClass.Internet, // You may skip defining the `class`
  ttl: 60, // in Second
  data: {
    size: 4, // in Bytes
    source: [127, 0, 0, 1]
  }
}

packResource(resource /* as TResource */)
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
