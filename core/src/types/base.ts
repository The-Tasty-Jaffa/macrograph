import { ZodType } from "zod";
import { t, TypeVariant, Wildcard } from ".";

export abstract class BaseType<TOut = any> {
  readonly _type!: TOut;

  abstract default(): TOut;
  abstract variant(): TypeVariant;
  abstract toString(): string;
  abstract asZodType(): ZodType<TOut>;
  abstract getWildcards(): Wildcard[];
  abstract eq(other: t.Any): boolean;
}

export type infer<T extends BaseType<any>> = T["_type"];
