import { Controller, Get, Query } from '@nestjs/common'
import { Public } from '../auth/public.decorator'
import { LocationsService } from './locations.service'

@Controller('catalog')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  /**
   * Typeahead for onboarding / settings location fields.
   * Public: city catalog is non-sensitive and must work on /onboard before
   * profile auth edge-cases (browsers often surface 401 as CORS).
   */
  @Get('locations')
  @Public()
  searchLocations(
    @Query('q') q?: string,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedOffset = Math.max(0, Number.parseInt(offset ?? '0', 10) || 0)
    const parsedLimit = Number.parseInt(limit ?? '20', 10) || 20
    const page = this.locationsService.search(
      q ?? '',
      parsedOffset,
      parsedLimit,
    )
    return {
      locations: page.items,
      total: page.total,
      hasMore: page.hasMore,
    }
  }
}
