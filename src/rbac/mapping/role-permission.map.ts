import { Role } from '../enums/role.enum';
import { Permission } from '../enums/permission.enum';

export const RolePermissions: Record<Role, Permission[]> = {
  [Role.HOST]: [
    Permission.HOTEL_CREATE,
    Permission.HOTEL_UPDATE,
    Permission.HOTEL_DELETE,
    Permission.HOTEL_READ,
    Permission.BOOKING_READ,
    Permission.ROOM_CREATE,
    Permission.ROOM_DELETE,
    Permission.ROOM_UPDATE,
  ],

  [Role.USER]: [
    Permission.BOOKING_CREATE,
    Permission.BOOKING_READ,
    Permission.BOOKING_CANCEL,
  ],
};
