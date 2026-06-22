import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../roles.enum';
import { Permission } from '../permissions.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      return false; // Or throw UnauthorizedException
    }

    let hasRole = true;
    let hasPermission = true;

    if (requiredRoles && requiredRoles.length > 0) {
      hasRole = requiredRoles.some(role => user.roles?.includes(role));
    }

    if (requiredPermissions && requiredPermissions.length > 0) {
      hasPermission = requiredPermissions.some(permission =>
        user.permissions?.includes(permission),
      );
    }

    return hasRole && hasPermission;
  }
}
