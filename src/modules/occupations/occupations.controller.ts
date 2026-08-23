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
   *
   * Pass `locale=vn` for Vietnamese labels and locale-aware typeahead.
   */
  @Get('occupations')
  @Public()
  searchOccupations(
    @Query('q') q?: string,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
    @Query('locale') locale?: string,
  ) {
    const parsedOffset = Math.max(0, Number.parseInt(offset ?? '0', 10) || 0)
    const parsedLimit = Number.parseInt(limit ?? '20', 10) || 20
    const page = this.occupationsService.search(
      q ?? '',
      parsedOffset,
      parsedLimit,
      locale,
    )
    return {
      occupations: page.items,
      total: page.total,
      hasMore: page.hasMore,
    }
  }

  /** Resolve a single occupation key to a localized display name. */
  @Get('occupations/resolve')
  @Public()
  resolveOccupation(
    @Query('key') key?: string,
    @Query('locale') locale?: string,
  ) {
    const occupationKey = (key ?? '').trim()
    if (!occupationKey) {
      return { key: null, name: null }
    }
    const name =
      this.occupationsService.nameForKey(occupationKey, locale) ?? null
    return { key: occupationKey, name }
  }
}
