import { Controller, Get, Query } from '@nestjs/common'
import { Public } from '../auth/public.decorator'
import { OccupationsService } from './occupations.service'

@Controller('catalog')
export class OccupationsController {
  constructor(private readonly occupationsService: OccupationsService) {}

  /**
   * Typeahead for onboarding / settings occupation fields.
   * Public: occupation catalog is non-sensitive and must work on /onboard
   * (browsers often surface auth failures as CORS).
   */
  @Get('occupations')
  @Public()
  searchOccupations(
    @Query('q') q?: string,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedOffset = Math.max(0, Number.parseInt(offset ?? '0', 10) || 0)
    const parsedLimit = Number.parseInt(limit ?? '20', 10) || 20
    const page = this.occupationsService.search(
      q ?? '',
      parsedOffset,
      parsedLimit,
    )
    return {
      occupations: page.items,
      total: page.total,
      hasMore: page.hasMore,
    }
  }
}
