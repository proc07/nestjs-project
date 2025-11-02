import { Injectable } from '@nestjs/common';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  async createNested(
    dto: CreateMenuDto,
    prisma: Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
    >,
    parentId?: number,
  ) {
    const { meta, children = [], ...restData } = dto;
    const parent = await prisma.menu
      .create({
        data: {
          parentId,
          ...restData,
          Meta: {
            create: meta,
          },
        },
      })
      .catch((err) => console.log(err));

    if (parent && children?.length) {
      const childrenMenus = await Promise.all(
        children.map((item) => this.createNested(item, prisma, parent.id)),
      );

      // 当前这种比较方便，或者再次查找数据库 find -> include
      parent['children'] = childrenMenus;
    }

    return parent;
  }

  async create(createMenuDto: CreateMenuDto) {
    const data = await this.createNested(createMenuDto, this.prisma);

    return this.prisma.menu.findUnique({
      where: {
        id: data?.id,
      },
      // 查找 2层（关联不多的情况下）如果太多层会影响性能问题。
      // 解决：1、分层查询（推荐） 2、解决方案二：预加载 + 内存递归（一次性查询所有相关数据，然后在内存中构建树）
      // 3、使用原生 SQL 优化
      include: {
        Meta: true,
        children: {
          include: {
            Meta: true,
          },
        },
      },
    });
  }

  findAll(page: number = 1, limit: number = 10, args?: any) {
    let pagination: Partial<Prisma.MenuFindManyArgs> = {
      skip: (page - 1) * limit,
      take: limit,
    };
    if (limit === -1) {
      pagination = {};
    }
    console.log('pagination', pagination);

    return this.prisma.menu.findMany({
      ...pagination,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      include: {
        Meta: true,
        children: {
          include: {
            Meta: true,
            children: true,
          },
        },
        ...(args || {}),
      },
    });
  }

  findOne(id: number) {
    return this.prisma.menu.findUnique({
      where: {
        id,
      },
      include: {
        Meta: true,
        children: {
          include: {
            Meta: true,
            children: true,
          },
        },
      },
    });
  }

  async update(id: number, updateMenuDto: UpdateMenuDto) {
    const { meta, children, ...restData } = updateMenuDto;

    return this.prisma.$transaction(async (prisma) => {
      await prisma.menu
        .update({
          where: {
            id,
          },
          data: {
            ...restData,
            Meta: {
              update: meta,
            },
            // children: {
            //   // del 所有的children 数据先
            //   deleteMany: {},
            // },
          },
        })
        .catch((err) => console.log(err));

      if (children?.length && children.length > 0) {
        // menu -> children (可能有新增，可能也有del)
        const menuIds = (await this.collectMenuIds(id)).filter((o) => o !== id);
        // 为什么要删除 2个表？ 先删除，后创建

        await prisma.meta.deleteMany({
          where: {
            menuId: {
              in: menuIds,
            },
          },
        });
        await prisma.menu.deleteMany({
          where: {
            id: {
              in: menuIds,
            },
          },
        });
        // 判断是否有 children 数据
        await Promise.all(
          children.map(async (item) => {
            return await this.createNested(item, prisma, id);
          }),
        );
      }

      return prisma.menu.findUnique({
        where: {
          id,
        },
        include: {
          Meta: true,
          children: {
            include: {
              Meta: true,
              children: true,
            },
          },
        },
      });
    });
  }

  async collectMenuIds(id: number) {
    const idsToDelete: number[] = [];
    idsToDelete.push(id);

    const menu = await this.prisma.menu.findUnique({
      where: {
        id,
      },
      include: {
        children: true,
      },
    });
    if (menu && menu.children?.length) {
      const childIds = await Promise.all(
        menu.children.map(async (item) => this.collectMenuIds(item.id)),
      );
      for (const item of childIds) {
        idsToDelete.push(...item);
      }
    }
    return idsToDelete;
  }

  async remove(id: number) {
    const idsToDelete = await this.collectMenuIds(id);

    console.log('idsToDelete', idsToDelete);

    return this.prisma.$transaction(async (prisma) => {
      // 1. del 关联表 meta 数据
      await prisma.meta.deleteMany({
        where: {
          menuId: {
            in: idsToDelete,
          },
        },
      });
      // 2. del 关联表 children 数据
      return prisma.menu.deleteMany({
        where: {
          id: {
            in: idsToDelete,
          },
        },
      });
    });
  }
}
