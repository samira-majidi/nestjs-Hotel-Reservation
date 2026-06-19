import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { OWNERSHIP_META } from './ownership.decorator';
import { OwnershipService } from './ownership.service';
import { OwnershipMeta } from './interface/ownershipmeta.interface';
import { TypedRequest } from './interface/type-request';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly ownership: OwnershipService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const meta = this.reflector.get<OwnershipMeta>(
      OWNERSHIP_META,
      context.getHandler(),
    );

    if (!meta) return true;

    const req = context.switchToHttp().getRequest<TypedRequest>();

    const userId = req.user?.sub;
    const entityIdRaw = req.params[meta.param];
    const entityId = /^\d+$/.test(entityIdRaw)
      ? Number(entityIdRaw)
      : entityIdRaw;
    if (userId == null) {
      throw new UnauthorizedException('User not authenticated.');
    }

    if (entityIdRaw == null || Number.isNaN(entityId)) {
      throw new BadRequestException('Invalid entity id.');
    }

    const has = await this.ownership.checkOwnership(
      meta.entity,
      entityId,
      userId,
    );

    if (!has) {
      throw new ForbiddenException('You are not owner of this resource.');
    }

    return true;
  }
}

/*import 
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { RESOURCE_OWNER_KEY } from './constants/resource-owner.constant';
import { REQUEST_USER_KEY } from '../constants/auth-constant';
import { Request } from 'express';
import { OwnershipRegistry } from './ownership-handler.registry';

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const resourceType = this.reflector.get<string>(
      RESOURCE_OWNER_KEY,
      context.getHandler(),
    );

    if (!resourceType) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const user = request[REQUEST_USER_KEY];

    if (!user) throw new UnauthorizedException('User not authenticated');

    const config = OwnershipRegistry[resourceType];
    if (!config)
      throw new Error(`Resource "${resourceType}" is not registered`);

    const { model, idField, ownerField } = config;

    // استخراج ID
    const id =
      request.params[idField] ||
      request.params[`${resourceType}Id`] ||
      request.params.id;

    if (!id) {
      throw new Error(
        `ID parameter not found. Expected: "${idField}", "${resourceType}Id", "id"`,
      );
    }

    const repo = this.dataSource.getRepository(model);

    const entity = (await repo.findOne({
      where: { [idField]: isNaN(Number(id)) ? id : Number(id) },
      select: [ownerField],
    })) as Record<string, number | string>;

    if (!entity) {
      throw new NotFoundException(
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `Resource "${resourceType}" with id "${id}" not found`,
      );
    }

    const ownerId = entity[ownerField];

    if (ownerId !== user.id && ownerId !== user.sub) {
      throw new ForbiddenException('You do not own this resource');
    }

    return true;
  }
}*/
