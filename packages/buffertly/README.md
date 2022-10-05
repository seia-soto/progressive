# Buffertly

https://github.com/seia-soto/progressive/tree/master/packages/buffertly

Buffertly(name from butterfly) is a dead simple utility to play with octets over network.
The original use of this set of functions is to play easy with buffers over network to implement the DNS server.

- [Buffertly](#buffertly)
- [Notion](#notion)
- [API](#api)
  - [`buffertly.octets`](#buffertlyoctets)
    - [Converting numbers to octets](#converting-numbers-to-octets)
    - [Dealing buffers with an array way](#dealing-buffers-with-an-array-way)
    - [Determining the range of the value](#determining-the-range-of-the-value)
  - [`buffertly.pick`](#buffertlypick)
    - [Reading a boolean value](#reading-a-boolean-value)
  - [`buffertly.range`](#buffertlyrange)
    - [Try reading an arbitrary integer represented in four bits](#try-reading-an-arbitrary-integer-represented-in-four-bits)
- [LICENSE](#license)

----

# Notion

Buffertly converts your data into octets internally. [Read more](https://en.wikipedia.org/wiki/Octet_(computing))

# API

```typescript
/// <reference types="node" />
/**
 * Make arbitrary numbers to octets regarding the type size
 * @param fragments An array consisted of the value and the size in bits
 * @returns An usable array with bytes can be converted into Buffer
 */
export declare const octets: (fragments: (readonly [number, number])[]) => number[];
/**
 * Read a single bit from buffer
 * @param buffer The buffer object
 * @param offset The offset in bits
 */
export declare const pick: (buffer: Buffer, offset: number) => number;
/**
 * Read bits in range and return as a number
 * @param buffer The buffer object
 * @param offset The offset in bits
 * @param size The size of value in bits
 * @returns A number data, convertable to string with String.fromCharCode method.
 */
export declare const range: (buffer: Buffer, offset: number, size: number) => number;
```

## `buffertly.octets`

This API let you convert fully *arbitrary* data into octets.
Since buffer does not support writing in bits or only allow writing in power of two length, it's common to write duplicated functions.

Try buffertly way.

```ts
octets([
  [first, bits],
  ... // As you want.
])
```

### Converting numbers to octets

`octets` returns a common array consisted with arbitrary numbers(`number[]`).
It's because you can modify the array as you want, not like `Buffer` does.

```ts
const some = octets([
  [0, 16], // Write zero in UInt16BE form.
  [1, 3] // Write 1 to binary using three bits.
])

const buffer = Buffer.from(some) // You can convert into buffer directly.
```

### Dealing buffers with an array way

Dealing with `Buffer` API is somewhat easy but huge annoyance for development.
Buffertly offers an array way instead.

```ts
const some = octets([
  [0, 16],
  [0, 16]
])

const another = octets([
  [1, 16],
  [1, 16]
])

const buffer = Buffer.from([...some, ...another])
```

### Determining the range of the value

Make sure you're writing the numbers in valid range depending on the width of bits.
In buffertly, we don't check the valid length due to performance reason.
Also, it's highly expected you'll write some validation code before passing parameters to `octets`.

```ts
const example = octets([
  [a, n] // Max width is (2 ** (n * 2)) - 1 in this case.
])

const invalid = octets([
  [65536, 8] // Note that there is -1 at the end and the length starts with zero, not one; (2 ** (8 * 2)) - 1
])
```

## `buffertly.pick`

This API let you pick a bit at a specific position from the buffer.
Literally a bit.

```ts
// Think 0o00000001 as 0b1
const buffer = octets([
  [1, 8]
])

pick(buffer, 1) // It's 1!
```

### Reading a boolean value

A boolean is commonly expressed as a bit or one width binary (zero or one) in octets.
The following is a snippet from [RFC 1035: Domain Implementation and Specification (November 1987)](https://datatracker.ietf.org/doc/html/rfc1035#section-4.1.1).

Let's try reading `AA` (Authoritative Answer) field at position **21**.

```
// https://datatracker.ietf.org/doc/html/rfc1035#section-4.1.1

                                    1  1  1  1  1  1
      0  1  2  3  4  5  6  7  8  9  0  1  2  3  4  5
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    |                      ID                       |
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    |QR|   Opcode  |AA|TC|RD|RA|   Z    |   RCODE   |
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    |                    QDCOUNT                    |
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    |                    ANCOUNT                    |
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    |                    NSCOUNT                    |
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    |                    ARCOUNT                    |
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
```

Now you may want to conver it into boolean thing.
It's depends on you completely.

```ts
const isAuthoritativeAnswer = pick(buffer, 21) // 0 | 1
```

## `buffertly.range`

This API let you read number in the specific range of bits without respecting the standard offsets and formats of integers such as `UInt16BE` and `UInt32BE`.

```ts
range(buffer, offset, size)
```

### Try reading an arbitrary integer represented in four bits

See and find `Opcode` in the RFC above again.
You can notice that the offset and size `Opcode` will not allow us to use standard methods from `Buffer` NAPI.
Rather implementing from scratch, buffertly provide you a handy way to compose bits in that range (17 to 21).

```ts
const opcode = range(buffer, 17, 4)
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
