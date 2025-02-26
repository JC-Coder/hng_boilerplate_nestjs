import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organisation } from './entities/organisations.entity';
import { OrganisationsController } from './organisations.controller';
import { OrganisationsService } from './organisations.service';
import { User } from '@modules/user/entities/user.entity';
import { OrganisationUserRole } from '@modules/role/entities/organisation-user-role.entity';
import { Permissions } from '@modules/permissions/entities/permissions.entity';
import { Role } from '@modules/role/entities/role.entity';
import { Profile } from '@modules/profile/entities/profile.entity';
import { UserModule } from '@modules/user/user.module';
import { InviteModule } from '@modules/invite/invite.module';
import UserService from '@modules/user/user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Organisation,
      User,
      OrganisationUserRole,
      Role,
      Organisation,
      User,
      Permissions,
      Profile,
    ]),
    UserModule,
    InviteModule,
  ],
  controllers: [OrganisationsController],
  providers: [OrganisationsService, UserService],
})
export class OrganisationsModule {}
