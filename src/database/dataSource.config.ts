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
import { UserTable1782361957998 } from './migrations/1782361957998-UserTable'
import { UpdateRoleEnum1782702393426 } from './migrations/1782702393426-UpdateRoleEnum'
import { TagsJunctionCreation1782870675851 } from './migrations/1782870675851-TagsJunctionCreation'
import { UpdateAgeColumnType1783042825596 } from './migrations/1783042825596-UpdateAgeColumnType'
import { UpdateOnboardProcessEnum1783043973663 } from './migrations/1783043973663-UpdateOnboardProcessEnum'
import { AddLocationColumn1783045969540 } from './migrations/1783045969540-AddLocationColumn'
import { RefactorOnboarding1783100000000 } from './migrations/1783100000000-RefactorOnboarding'
import { AddOnboardingStep1783200000000 } from './migrations/1783200000000-AddOnboardingStep'

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '54322', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'postgres',
  synchronize: false,
  entities: [User, Tag],
  migrations: [
    UserTable1782361957998,
    UpdateRoleEnum1782702393426,
    TagsJunctionCreation1782870675851,
    UpdateAgeColumnType1783042825596,
    UpdateOnboardProcessEnum1783043973663,
    AddLocationColumn1783045969540,
    RefactorOnboarding1783100000000,
    AddOnboardingStep1783200000000,
  ],
})
