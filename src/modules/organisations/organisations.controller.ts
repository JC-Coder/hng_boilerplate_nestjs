import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OwnershipGuard } from '@guards/authorization.guard';
import { OrganisationMembersResponseDto } from './dto/org-members-response.dto';
import { OrganisationRequestDto } from './dto/organisation.dto';
import { OrganisationsService } from './organisations.service';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import { UpdateMemberRoleDto } from './dto/update-organisation-role.dto';
import { UserOrganizationErrorResponseDto, UserOrganizationResponseDto } from './dto/user-orgs-response.dto';
import { AddMemberDto } from './dto/add-member.dto';

@ApiBearerAuth()
@ApiTags('organisation')
@Controller('organisations')
export class OrganisationsController {
  private readonly logger = new Logger(OrganisationsController.name);
  constructor(private readonly organisationsService: OrganisationsService) {}

  @ApiOperation({ summary: 'Create new Organisation' })
  @ApiResponse({ status: 201, description: 'The created organisation' })
  @ApiResponse({ status: 409, description: 'Organisation email already exists' })
  @Post('/')
  async create(@Body() createOrganisationDto: OrganisationRequestDto, @Req() req) {
    const user = req['user'];
    return this.organisationsService.createOrganisation(createOrganisationDto, user.sub);
  }

  @UseGuards(OwnershipGuard)
  @Delete(':org_id')
  async delete(@Param('org_id') id: string) {
    return this.organisationsService.deleteorganisation(id);
  }

  @ApiOperation({ summary: 'Update Organisation' })
  @ApiResponse({ status: 200, description: 'Organisation updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'User is currently not authorized, kindly authenticate to continue' })
  @ApiResponse({ status: 403, description: 'You do not have permission to update this organisation' })
  @ApiResponse({ status: 404, description: 'Organisation not found' })
  @UseGuards(OwnershipGuard)
  @Patch(':orgId')
  async update(@Param('orgId') orgId: string, @Body() updateOrganisationDto: UpdateOrganisationDto) {
    return await this.organisationsService.updateOrganisation(orgId, updateOrganisationDto);
  }

  @ApiOperation({ summary: 'Get members of an Organisation' })
  @ApiResponse({ status: 200, description: 'The found record', type: OrganisationMembersResponseDto })
  @ApiResponse({ status: 404, description: 'Organisation not found' })
  @ApiResponse({ status: 403, description: 'User not a member of the organisation' })
  @Get(':org_id/users')
  async getMembers(
    @Req() req,
    @Param('org_id') org_id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('page_size', new DefaultValuePipe(1), ParseIntPipe) page_size: number
  ): Promise<OrganisationMembersResponseDto> {
    const { sub } = req.user;
    return this.organisationsService.getOrganisationMembers(org_id, page, page_size, sub);
  }

  @ApiOperation({ summary: "Gets a user's organizations" })
  @ApiResponse({ status: 200, description: 'Organisations retrieved successfully', type: UserOrganizationResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request', type: UserOrganizationErrorResponseDto })
  @Get('/')
  async getUserOrganisations(@Req() req) {
    const { sub } = req.user;
    return this.organisationsService.getUserOrganisations(sub);
  }

  @UseGuards(OwnershipGuard)
  @ApiOperation({ summary: 'Add member to an organization' })
  @ApiResponse({ status: 201, description: 'Member added successfully' })
  @ApiResponse({ status: 409, description: 'User already added to organization.' })
  @ApiResponse({ status: 404, description: 'Organisation not found' })
  @Post(':org_id/users')
  async addMember(@Param('org_id', ParseUUIDPipe) org_id: string, @Body() addMemberDto: AddMemberDto) {
    return this.organisationsService.addOrganisationMember(org_id, addMemberDto);
  }

  @UseGuards(OwnershipGuard)
  @ApiOperation({ summary: 'Assign roles to members of an organisation' })
  @ApiResponse({
    status: 200,
    description: 'Assign roles to members of an organisation',
    schema: {
      properties: {
        status: { type: 'string' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            user: { type: 'string' },
            org: { type: 'string' },
            role: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 409, description: 'User already added to organization.' })
  @ApiResponse({ status: 403, description: 'User not a member of the organisation' })
  @Put(':org_id/users/:user_id/role')
  async updateMemberRole(
    @Param('user_id') memberId: string,
    @Param('org_id') orgId: string,
    @Body() updateMemberRoleDto: UpdateMemberRoleDto
  ) {
    return await this.organisationsService.updateMemberRole(orgId, memberId, updateMemberRoleDto);
  }
}
