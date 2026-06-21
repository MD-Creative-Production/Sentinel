import { RbacGuard } from './rbac.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { Role } from '../roles.enum';
import { Permission } from '../permissions.enum';

describe('RbacGuard', () => {
  let guard: RbacGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RbacGuard(reflector);
  });

  const mockExecutionContext = (user: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;
  };

  it('should allow access if no roles or permissions are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const context = mockExecutionContext({ id: 1, roles: [], permissions: [] });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access if user is not present', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation(key => {
      if (key === 'roles') return [Role.Admin];
      return undefined;
    });

    const context = mockExecutionContext(null);
    expect(guard.canActivate(context)).toBe(false);
  });

  it('should allow access if user has required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation(key => {
      if (key === 'roles') return [Role.Admin];
      return undefined;
    });

    const context = mockExecutionContext({ id: 1, roles: [Role.Admin], permissions: [] });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access if user lacks required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation(key => {
      if (key === 'roles') return [Role.Admin];
      return undefined;
    });

    const context = mockExecutionContext({ id: 1, roles: [Role.User], permissions: [] });
    expect(guard.canActivate(context)).toBe(false);
  });

  it('should allow access if user has required permission', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation(key => {
      if (key === 'permissions') return [Permission.CreateUser];
      return undefined;
    });

    const context = mockExecutionContext({
      id: 1,
      roles: [],
      permissions: [Permission.CreateUser],
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access if user lacks required permission', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation(key => {
      if (key === 'permissions') return [Permission.CreateUser];
      return undefined;
    });

    const context = mockExecutionContext({
      id: 1,
      roles: [],
      permissions: [Permission.ViewDashboard],
    });
    expect(guard.canActivate(context)).toBe(false);
  });

  it('should allow access if user has both required role and permission', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation(key => {
      if (key === 'roles') return [Role.Admin];
      if (key === 'permissions') return [Permission.ManageSystem];
      return undefined;
    });

    const context = mockExecutionContext({
      id: 1,
      roles: [Role.Admin],
      permissions: [Permission.ManageSystem],
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access if user has role but lacks permission', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation(key => {
      if (key === 'roles') return [Role.Admin];
      if (key === 'permissions') return [Permission.ManageSystem];
      return undefined;
    });

    const context = mockExecutionContext({
      id: 1,
      roles: [Role.Admin],
      permissions: [Permission.ViewDashboard],
    });
    expect(guard.canActivate(context)).toBe(false);
  });
});
