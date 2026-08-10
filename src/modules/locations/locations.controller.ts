import { Controller, Get, Query } from '@nestjs/common'
import { SkipEmailVerification } from '../auth/skip-email-verification.decorator'
import { LocationsService } from './locations.service'

@Controller('catalog')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  /**
   * Typeahead for onboarding / settings location fields.
   * Auth required (global guard); email verification skipped so onboard works.
   */
  @Get('locations')
  @SkipEmailVerification()
  searchLocations(@Query('q') q?: string) {
    return { locations: this.locationsService.search(q ?? '') }
  }
}
