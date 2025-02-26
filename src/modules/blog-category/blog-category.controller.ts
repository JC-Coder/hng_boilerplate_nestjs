import { Body, Controller, Post, UseGuards, Patch, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BlogCategoryService } from './blog-category.service';
import { SuperAdminGuard } from '@guards/super-admin.guard';
import { CreateBlogCategoryDto } from './dto/create-blog-category.dto';
import { UpdateBlogCategoryDto } from './dto/update-blog-category.dto';

@ApiTags('Blog Categories')
@Controller('blogs/categories')
export class BlogCategoryController {
  constructor(private readonly blogCategoryService: BlogCategoryService) {}

  @Post()
  @UseGuards(SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new blog category' })
  @ApiResponse({ status: 201, description: 'Blog category created successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid request data. Please provide a valid category name.' })
  @ApiResponse({ status: 401, description: 'Unauthorized. Token is missing or invalid.' })
  @ApiResponse({ status: 403, description: 'Forbidden. You do not have permission to create blog categories.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error. Please try again later.' })
  async create(@Body() createBlogCategoryDto: CreateBlogCategoryDto) {
    return await this.blogCategoryService.createOrganisationCategory(createBlogCategoryDto);
  }

  @Patch(':id')
  @UseGuards(SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an organisation category' })
  @ApiResponse({ status: 200, description: 'Organisation category updated successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid request data. Please provide valid data.' })
  @ApiResponse({ status: 401, description: 'Unauthorized. Token is missing or invalid.' })
  @ApiResponse({ status: 403, description: 'Forbidden. You do not have permission to update this category.' })
  @ApiResponse({ status: 404, description: 'Not Found. Category with the given ID does not exist.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error. Please try again later.' })
  async updateBlogCategory(@Param('id') id: string, @Body() updateBlogCategoryDto: UpdateBlogCategoryDto) {
    return await this.blogCategoryService.updateOrganisationCategory(id, updateBlogCategoryDto);
  }
}
