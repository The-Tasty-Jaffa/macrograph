import { ReactiveSet } from "@solid-primitives/set";
import { Component, lazy } from "solid-js";
import {
  Enum,
  EnumBuilder,
  EnumVariants,
  LazyEnumVariants,
  LazyStructFields,
  Struct,
  StructBuilder,
  StructFields,
} from "@macrograph/typesystem";

import { Core } from "./Core";
import {
  EventNodeSchema,
  EventsMap,
  NodeSchema,
  NonEventNodeSchema,
  PropertyDef,
  SchemaProperties,
} from "./NodeSchema";
import { ExecInput, ExecOutput } from "./IO";

export interface PackageArgs<TCtx> {
  name: string;
  ctx?: TCtx;
  SettingsUI?: Parameters<typeof lazy<Component<TCtx>>>[0];
}

export class Package<TEvents extends EventsMap = EventsMap, TCtx = any> {
  name: string;
  schemas = new ReactiveSet<NodeSchema<TEvents>>();
  core?: Core;
  ctx?: TCtx;
  SettingsUI?: ReturnType<typeof lazy>;

  structs = new Map<string, Struct>();
  enums = new Map<string, Enum>();

  constructor(args: PackageArgs<TCtx>) {
    this.name = args.name;
    this.ctx = args.ctx;
    this.SettingsUI = args.SettingsUI ? lazy(args.SettingsUI) : undefined;
  }

  createNonEventSchema<TIO, TProperties extends Record<string, PropertyDef>>(
    schema: Omit<
      NonEventNodeSchema<TIO, TProperties>,
      "package" | "properties"
    > & {
      properties?: TProperties;
    }
  ) {
    const altered: NonEventNodeSchema<
      { custom: TIO; default?: { in: ExecInput; out: ExecOutput } },
      TProperties
    > = {
      ...schema,
      properties: Object.entries(schema.properties ?? {}).reduce(
        (acc: any, [id, property]: any) => {
          acc[id] = {
            id,
            ...property,
          };

          return acc;
        },
        {} as SchemaProperties<TProperties>
      ),
      generateIO: (ctx) => {
        let defaultIO;

        if (schema.variant === "Exec") {
          defaultIO = {
            in: ctx.io.execInput({
              id: "exec",
            }),
            out: ctx.io.execOutput({
              id: "exec",
            }),
          };
        }

        const custom = schema.generateIO(ctx);

        return {
          custom,
          default: defaultIO,
        };
      },
      run: async (args) => {
        await schema.run({ ...args, io: args.io.custom });

        if (schema.variant === "Exec" && args.io.default)
          args.ctx.exec(args.io.default.out);
      },
      package: this as any,
    };

    this.schemas.add(altered as any);

    return this;
  }

  createEventSchema<
    TEvent extends keyof TEvents,
    TIO,
    TProperties extends Record<string, PropertyDef>
  >(
    schema: Omit<
      EventNodeSchema<TEvents, TEvent, TIO, TProperties>,
      "package" | "properties"
    > & {
      properties?: TProperties;
    }
  ) {
    const altered: EventNodeSchema<TEvents, TEvent, TIO, TProperties> = {
      ...schema,
      properties: Object.entries(schema.properties ?? {}).reduce(
        (acc: any, [id, property]: any) => {
          acc[id] = {
            id,
            ...property,
          };

          return acc;
        },
        {} as SchemaProperties<TProperties>
      ),
      package: this as any,
    };

    this.schemas.add(altered as any);

    return this;
  }

  schema(name: string): NodeSchema<TEvents> | undefined {
    for (const schema of this.schemas) {
      if (schema.name === name) return schema;
    }
  }

  emitEvent<TEvent extends keyof TEvents>(event: {
    name: TEvent;
    data: TEvents[TEvent];
  }) {
    this.core?.emitEvent(this, event as any);
  }

  registerType(type: Enum<any> | Struct<any>) {
    if (type instanceof Enum) {
      this.enums.set(type.name, type);
    } else {
      this.structs.set(type.name, type);
    }
  }

  createEnum<Variants extends EnumVariants>(
    name: string,
    builderFn: (t: EnumBuilder) => Variants | LazyEnumVariants<Variants>
  ) {
    const builder = new EnumBuilder();

    const e = new Enum(name, builderFn(builder));

    this.registerType(e);

    return e;
  }

  createStruct<Fields extends StructFields>(
    name: string,
    builderFn: (t: StructBuilder) => Fields | LazyStructFields<Fields>
  ) {
    const builder = new StructBuilder();

    const s = new Struct(name, builderFn(builder));

    this.registerType(s);

    return s;
  }
}

export function createEnum<Variants extends EnumVariants>(
  name: string,
  builderFn: (t: EnumBuilder) => Variants | LazyEnumVariants<Variants>
) {
  const builder = new EnumBuilder();

  return new Enum(name, builderFn(builder));
}

export function createStruct<Fields extends StructFields>(
  name: string,
  builderFn: (t: StructBuilder) => Fields | LazyStructFields<Fields>
) {
  const builder = new StructBuilder();

  return new Struct(name, builderFn(builder));
}

export type Events<TEventsMap extends EventsMap = EventsMap> =
  TEventsMap extends EventsMap<infer TName>
    ? {
        name: TName;
        data: EventsMap[TName];
      }
    : never;
export type OnEvent<TEventsMap extends EventsMap = EventsMap> = (
  _: Events<TEventsMap>
) => void;