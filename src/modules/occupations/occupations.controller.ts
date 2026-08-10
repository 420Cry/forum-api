import { Controller, Get, Query } from '@nestjs/common'
import { SkipEmailVerification } from '../auth/skip-email-verification.decorator'
import { OccupationsService } from './occupations.service'

@Controller('catalog')
export class OccupationsController {
  constructor(private readonly occupationsService: OccupationsService) {}

  /**
   * Typeahead for onboarding / settings occupation fields.
   * Auth required (global guard); email verification skipped so onboard works.
   */
  @Get('occupations')
  @SkipEmailVerification()
  searchOccupations(@Query('q') q?: string) {
    return { occupations: this.occupationsService.search(q ?? '') }
  }
}
