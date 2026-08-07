import * as dotenv from 'dotenv'

if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.production' })
} else {
  dotenv.config({ path: '.env' })
  dotenv.config({ path: '.env.local', override: false })
}

import { DataSource } from 'typeorm'
import { User } from '../modules/users/entities'
import { Tag } from 'src/modules/tags/entities/tags.entities'
import { StartupProfiles } from 'src/modules/profiles/entities/startup-profiles.entity'
import { InvestorProfiles } from 'src/modules/profiles/entities/investor-profiles.entity'
import { Posts } from 'src/modules/posts/entities/posts.entity'
import { Reactions } from 'src/modules/reactions/entities/reactions.entity'
import { UserTable1782361957998 } from './migrations/1782361957998-UserTable'
import { UpdateRoleEnum1782702393426 } from './migrations/1782702393426-UpdateRoleEnum'
import { TagsJunctionCreation1782870675851 } from './migrations/1782870675851-TagsJunctionCreation'
import { UpdateAgeColumnType1783042825596 } from './migrations/1783042825596-UpdateAgeColumnType'
import { UpdateOnboardProcessEnum1783043973663 } from './migrations/1783043973663-UpdateOnboardProcessEnum'
import { AddLocationColumn1783045969540 } from './migrations/1783045969540-AddLocationColumn'
import { RefactorOnboarding1783100000000 } from './migrations/1783100000000-RefactorOnboarding'
import { AddOnboardingStep1783200000000 } from './migrations/1783200000000-AddOnboardingStep'
import { StartupProfileSchema1786007330786 } from './migrations/1786007330786-StartupProfileSchema'
import { InvestorProfilesSchema1786020573120 } from './migrations/1786020573120-InvestorProfilesSchema'
import { PostsSchema1786071519998 } from './migrations/1786071519998-PostsSchema'
import { ReactionsSchema1786094100789 } from './migrations/1786094100789-ReactionsSchema'

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '54322', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'postgres',
  synchronize: false,
  entities: [User, Tag, StartupProfiles, InvestorProfiles, Posts, Reactions],
  migrations: [
    UserTable1782361957998,
    UpdateRoleEnum1782702393426,
    TagsJunctionCreation1782870675851,
    UpdateAgeColumnType1783042825596,
    UpdateOnboardProcessEnum1783043973663,
    AddLocationColumn1783045969540,
    RefactorOnboarding1783100000000,
    AddOnboardingStep1783200000000,
    StartupProfileSchema1786007330786,
    InvestorProfilesSchema1786020573120,
    PostsSchema1786071519998,
    ReactionsSchema1786094100789,
  ],
})
