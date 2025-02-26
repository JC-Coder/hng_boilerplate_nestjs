import { Controller, Post, Body, Get, Put, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { FaqService } from './faq.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { Faq } from './entities/faq.entity';
import { ICreateFaqResponse, IFaq } from './faq.interface';
import { skipAuth } from '@shared/helpers/skipAuth';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { SuperAdminGuard } from '@guards/super-admin.guard';

@ApiTags('Faqs')
@Controller('faqs')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  @UseGuards(SuperAdminGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new FAQ' })
  @ApiResponse({
    status: 201,
    description: 'The FAQ has been successfully created.',
    type: Faq,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request if input data is invalid.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error if an unexpected error occurs.',
  })
  @ApiBearerAuth()
  async create(@Body() createFaqDto: CreateFaqDto, @Req() req: any): Promise<ICreateFaqResponse> {
    const language = req.language;
    const faq: IFaq = await this.faqService.create(createFaqDto, language);
    return {
      status_code: 201,
      success: true,
      data: faq,
    };
  }

  @skipAuth()
  @Get()
  @ApiOperation({ summary: 'Get all frequently asked questions' })
  async findAll(@Req() req: any) {
    const language = req.language;
    return this.faqService.findAllFaq(language);
  }

  @ApiBearerAuth()
  @UseGuards(SuperAdminGuard)
  @Put(':id')
  @ApiOperation({ summary: 'Update an existing FAQ' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'The FAQ has been successfully updated.', type: Faq })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async update(@Param('id') id: string, @Body() updateFaqDto: UpdateFaqDto, @Req() req: any) {
    const language = req.language;
    return this.faqService.updateFaq(id, updateFaqDto, language);
  }

  @ApiBearerAuth()
  @UseGuards(SuperAdminGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an FAQ' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'The FAQ has been successfully deleted.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async remove(@Param('id') id: string) {
    return this.faqService.removeFaq(id);
  }
}
