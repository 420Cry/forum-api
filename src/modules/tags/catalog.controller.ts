import { Controller, Get, Query, BadRequestException } from '@nestjs/common'
import { SkipEmailVerification } from '../auth/skip-email-verification.decorator'
import { isTagKind } from './catalog.seeds'
import { TagsService } from './tags.service'

@Controller('catalog')
export class CatalogController {
  constructor(private readonly tagsService: TagsService) {}

  /**
   * Catalog options for onboarding, settings, and find filters.
   * Auth required (global guard); email verification skipped so onboard works.
   */
  @Get('tags')
  @SkipEmailVerification()
  async listTags(@Query('kind') kind?: string) {
    if (!kind || !isTagKind(kind)) {
      throw new BadRequestException(
        'Query kind must be one of: goal, location, occupation, industry',
      )
    }
    const tags = await this.tagsService.findByKind(kind)
    return {
      kind,
      tags: tags.map((tag) => ({ key: tag.key, name: tag.name })),
    }
  }
}
