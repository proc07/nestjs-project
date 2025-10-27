import {
  AbilityBuilder,
  createMongoAbility,
  buildMongoQueryMatcher,
  PureAbility,
  AbilityTuple,
  MatchConditions,
  MongoAbility,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { createPrismaAbility } from '@casl/prisma';
import {
  allInterpreters,
  allParsingInstructions,
  MongoQuery,
} from '@ucast/mongo2js';

export interface IPolicy {
  type: number; // 0-json, 1-mongo, 2-function
  effect: 'can' | 'cannot';
  action: string;
  subject: string;
  fields?: string[] | string;
  conditions: string | Record<string, any>;
  args?: string[] | string;
}

type AppAbility = PureAbility<AbilityTuple, MatchConditions>;
type AbilityType = MongoAbility<AbilityTuple, MongoQuery> | AppAbility;

@Injectable()
export class CaslAbilityService {
  buildAbility(polices: IPolicy[], args: any[] = []) {
    const abilityArr: AbilityType[] = [];
    let ability: AbilityType;

    polices.forEach((policy) => {
      switch (policy.type) {
        case 0:
          ability = this.handleJsonType(policy);
          break;
        case 1:
          ability = this.handleMongoType(policy);
          break;
        case 2:
          ability = this.handleFunctionType(policy, args);
          break;
      }
      abilityArr.push(ability);
    });

    return abilityArr;
  }

  determineAction(effect: string, builder: AbilityBuilder<AbilityType>) {
    return effect === 'can' ? builder.can : builder.cannot;
  }

  // 针对一般场景
  // can('action', 'subject', 'fields', 'conditions')
  handleJsonType(policy: IPolicy) {
    const builder = new AbilityBuilder<AbilityType>(createMongoAbility);
    const action = this.determineAction(policy.effect, builder);

    const conditions =
      (typeof policy.conditions === 'string'
        ? (JSON.parse(policy.conditions || '{}') as Record<string, any>)
        : policy.conditions) || {};

    action(policy.action, policy.subject, policy.fields, conditions);

    return builder.build();
  }

  // 针对 mongo 查询场景
  handleMongoType(policy: IPolicy) {
    const builder = new AbilityBuilder<AbilityType>(createMongoAbility);
    const action = this.determineAction(policy.effect, builder);

    const conditionsMatcher = buildMongoQueryMatcher(
      allParsingInstructions,
      allInterpreters,
    );

    const localArgs: any[] = [];
    if (policy.fields) {
      localArgs.push(policy.fields);
    }
    if (policy.conditions) {
      localArgs.push(
        typeof policy.conditions === 'object' && policy.conditions['data']
          ? policy.conditions['data']
          : policy.conditions,
      );
    }

    // subject ->  string | class 类的实例
    action(policy.action, policy.subject, ...localArgs);

    return builder.build({
      conditionsMatcher,
    });
  }

  // 针对函数场景
  handleFunctionType(policy: IPolicy, args: any[]) {
    const builder = new AbilityBuilder<AppAbility>(PureAbility);
    const action = this.determineAction(policy.effect, builder);

    const lambdaMatcher = (matchConditions: MatchConditions) => matchConditions;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    let func: Function | undefined;
    if (policy.args && policy.args.length > 0) {
      let arr: string[] = [];
      if (typeof policy.args === 'string') {
        arr = policy.args.split(',');
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        func = new Function(...arr, 'return ' + policy.conditions);
      } else {
        // policy.args is array
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        func = new Function(...policy.args, 'return ' + policy.conditions);
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      func = new Function('return ' + policy.conditions);
    }

    action(policy.action, policy.subject, func(...args));

    return builder.build({
      conditionsMatcher: lambdaMatcher,
    });
  }
}
