import { SetMetadata } from '@nestjs/common';
import { ActionEnum } from '../enum/actions.enum';
import { Reflector } from '@nestjs/core';

export const ROLE_PERMISSION_KEY = 'rolePermission';

const accumulateMetadata = (key: string, permission: string) => {
  console.log(key, permission);
  return (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: TypedPropertyDescriptor<any>,
  ) => {
    console.log('accumulateMetadata', target, propertyKey, descriptor);
    const reflector = new Reflector();

    // 针对于方法装饰器，descriptor.value 是方法的引用。
    if (descriptor && descriptor.value) {
      const existPermissions =
        reflector.get<string[]>(key, descriptor.value) || [];
      const newPermission = [...existPermissions, permission];

      // 这里的作用是将新的权限数组设置到目标方法上。
      SetMetadata(key, newPermission)(target, propertyKey!, descriptor);
    } else {
      // 针对于类 constructor 装饰器，descriptor.value 是 undefined。
      // 这里的作用是将新的权限数组设置到目标类上。
      const existPermissions = reflector.get<string[]>(key, target) || [];
      const newPermission = [...existPermissions, permission];

      // SetMetadata 并不是被 “调用了两次”，而是：
      // 第一次调用：传入元数据的 key 和 value，返回一个装饰器函数。
      // 第二次调用：执行这个装饰器函数，传入目标对象（类、方法等）的信息，最终完成元数据设置。
      SetMetadata(key, newPermission)(target);
    }
  };
};

export const RolePermission = (permission: string) => {
  return accumulateMetadata(ROLE_PERMISSION_KEY, permission);
};

export const Create = () => {
  return accumulateMetadata(
    ROLE_PERMISSION_KEY,
    ActionEnum.Create.toLocaleLowerCase(),
  );
};

export const Update = () => {
  return accumulateMetadata(
    ROLE_PERMISSION_KEY,
    ActionEnum.Upload.toLocaleLowerCase(),
  );
};

export const Read = () => {
  return accumulateMetadata(
    ROLE_PERMISSION_KEY,
    ActionEnum.Read.toLocaleLowerCase(),
  );
};

export const Delete = () => {
  return accumulateMetadata(
    ROLE_PERMISSION_KEY,
    ActionEnum.Delete.toLocaleLowerCase(),
  );
};
