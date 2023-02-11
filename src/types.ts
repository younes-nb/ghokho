export type Code = 1 | 2 | 3;

export interface Message {
  code?: Code;
  body: string;
  from?: number;
}
