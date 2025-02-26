import { SetMetadata } from '@nestjs/common';
import { PermissionCategory } from '@modules/permissions/helpers/PermissionCategory';
export const PERMISSIONS_KEY = Symbol('permissions');
export const Permissions = (...permissions: PermissionCategory[]) => SetMetadata(PERMISSIONS_KEY, permissions);
