/* eslint-disable no-unused-vars */
export type TFlag = 0 | 1

export type TPart = readonly [number, number]

// Header: https://datatracker.ietf.org/doc/html/rfc1035#section-4.1.1
export const enum EQueryOrResponse {
  Query = 0,
  Response
}

export const enum EOperationCode {
  Query = 0,
  InverseQuery,
  ServerStatus
}

export const enum EResponseCode {
  NoError = 0,
  FormatError,
  ServerFailure,
  NameError,
  NotImplemented,
  Refused
}

export interface IOptions {
  isAuthoritativeAnswer: TFlag,
  isTruncated: TFlag,
  isRecursionDesired: TFlag,
  isRecursionAvailable: TFlag
}

export interface ICounts {
  question: number,
  answer: number,
  nameserver: number,
  additional: number
}

export interface IHeader {
  id: number,
  isQueryOrResponse: EQueryOrResponse,
  operationCode: EOperationCode,
  responseCode: EResponseCode,
  options: IOptions,
  counts: ICounts
}

// Question: https://datatracker.ietf.org/doc/html/rfc1035#section-4.1.2
export const enum ERecord {
  A = 1,
  NS,
  CNAME = 5,
  SOA,
  MB,
  MG,
  MR,
  NULL,
  WKS,
  PTR,
  HINFO,
  MINFO,
  MX,
  TXT
}

export const enum EClass {
  Internet = 1,
  Chaos = 3,
  Hesiod
}

export interface IQuestion {
  name: string,
  type: ERecord,
  class: EClass
}

// Resource: https://datatracker.ietf.org/doc/html/rfc1035#section-4.1.3
export const enum EResourceOrder {
  Answer,
  Authority,
  Additional
}

export interface IResource {
  order: EResourceOrder,
  name: string,
  type: ERecord,
  class: EClass,
  ttl: number,
  data: {
    size: number,
    source: unknown
  }
}

// Standard Resource Records: https://datatracker.ietf.org/doc/html/rfc1035#section-3.3
export interface IResourceOfCname extends IResource {
  type: ERecord.CNAME,
  data: {
    size: number,
    source: string
  }
}

export interface IResourceOfHinfo extends IResource {
  type: ERecord.HINFO,
  data: {
    size: number,
    source: {
      cpu: string,
      os: string
    }
  }
}

export interface IResourceOfMx extends IResource {
  type: ERecord.MX,
  data: {
    size: number,
    source: {
      preference: number,
      exchange: string
    }
  }
}

export interface IResourceOfNs extends IResource {
  type: ERecord.NS,
  data: {
    size: number,
    source: string
  }
}

export interface IResourceOfPtr extends IResource {
  type: ERecord.PTR,
  data: {
    size: number,
    source: string
  }
}

export interface IResourceOfSoa extends IResource {
  type: ERecord.SOA,
  data: {
    size: number,
    source: {
      name: string,
      representative: string,
      serial: number,
      refreshIn: number,
      retryIn: number,
      expireIn: number,
      ttl: number
    }
  }
}

export interface IResourceOfTxt extends IResource {
  type: ERecord.TXT,
  data: {
    size: number,
    source: string
  }
}

// Internet specific Resource Records: https://datatracker.ietf.org/doc/html/rfc1035#section-3.4
export type TInternetAddress = readonly [number, number, number, number]

export interface IResourceOfA extends IResource {
  type: ERecord.A,
  data: {
    size: 4,
    source: TInternetAddress
  }
}

export interface IResourceOfWks extends IResource {
  type: ERecord.WKS,
  data: {
    size: number,
    source: {
      address: TInternetAddress,
      protocol: number,
      ports: number[]
    }
  }
}

// NULL Resource Record: https://datatracker.ietf.org/doc/html/rfc1035#section-3.3.10
export interface IResourceOfNull extends IResource {
  type: ERecord.NULL,
  data: {
    size: number,
    source: null
  }
}

export type TResources = IResourceOfCname
  | IResourceOfHinfo
  | IResourceOfMx
  | IResourceOfNs
  | IResourceOfPtr
  | IResourceOfSoa
  | IResourceOfTxt
  | IResourceOfA
  | IResourceOfWks
  | IResourceOfNull

export type TInternetResources = IResourceOfA
  | IResourceOfWks

// Packet (Composed)
export interface IPacket extends IHeader {
  questions: IQuestion[],
  resources: TResources[]
}

// Parameters
export type TOptionalResourcesClassField = Partial<{ class: EClass }>

export type TBuildableQuestion = Omit<IQuestion, 'class'> & TOptionalResourcesClassField

export type TBuildableResource = Omit<TResources, 'class'> & TOptionalResourcesClassField

export type TBuildablePacketOverridingParameters = 'options' | 'questions' | 'resources'

export interface IBuildablePacketOverrides extends Omit<IPacket, TBuildablePacketOverridingParameters> {
  options: Partial<IOptions>
  questions: TBuildableQuestion[]
  resources: TBuildableResource[]
}

export type TNecessaryPacketParameters = 'isQueryOrResponse'

export type TBuildablePacket = Pick<IBuildablePacketOverrides, TNecessaryPacketParameters>
  & Partial<Omit<IBuildablePacketOverrides, TNecessaryPacketParameters>>

// External notion
export type TCompressionMap = Record<string, number> & { __offset: number }
