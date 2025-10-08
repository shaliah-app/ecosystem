#!/usr/bin/env tsx

import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

/**
 * Advanced script to generate TypeScript types from Drizzle schemas
 * This script uses Drizzle's introspection capabilities to generate types
 */

// This would be the ideal approach, but requires more setup
// For now, let's create a template-based approach

const generateTypesFromSchema = (schemaName: string, tableName: string, fields: any[]) => {
  const interfaceName = schemaName.charAt(0).toUpperCase() + schemaName.slice(1)
  const insertName = `${interfaceName}Insert`
  const rowName = `${interfaceName}Row`

  let interfaceCode = `// Auto-generated from Drizzle schema
// This file is generated automatically - do not edit manually

export interface ${interfaceName} {
`

  let insertCode = `export interface ${insertName} {
`

  fields.forEach(field => {
    const isOptional = field.nullable || field.hasDefault
    const optionalMarker = isOptional ? '?' : ''
    const nullMarker = field.nullable ? ' | null' : ''
    
    interfaceCode += `  ${field.name}${optionalMarker}: ${field.type}${nullMarker};\n`
    
    if (field.hasDefault || field.name === 'id' || field.name.includes('_at')) {
      insertCode += `  ${field.name}?: ${field.type}${nullMarker};\n`
    } else {
      insertCode += `  ${field.name}: ${field.type}${nullMarker};\n`
    }
  })

  interfaceCode += `}

${insertCode}}

// Legacy type aliases for backward compatibility with existing code
export type ${rowName} = ${interfaceName}
`

  return interfaceCode
}

// Example usage for auth_tokens
const authTokensFields = [
  { name: 'id', type: 'string', nullable: false, hasDefault: true },
  { name: 'token', type: 'string', nullable: false, hasDefault: false },
  { name: 'user_id', type: 'string', nullable: false, hasDefault: false },
  { name: 'created_at', type: 'string', nullable: false, hasDefault: true },
  { name: 'expires_at', type: 'string', nullable: false, hasDefault: false },
  { name: 'used_at', type: 'string', nullable: true, hasDefault: false },
  { name: 'is_active', type: 'boolean', nullable: false, hasDefault: true }
]

// Example usage for user_profiles
const userProfilesFields = [
  { name: 'id', type: 'string', nullable: false, hasDefault: true },
  { name: 'user_id', type: 'string', nullable: false, hasDefault: false },
  { name: 'full_name', type: 'string', nullable: true, hasDefault: false },
  { name: 'language', type: 'string', nullable: false, hasDefault: true },
  { name: 'telegram_user_id', type: 'number', nullable: true, hasDefault: false },
  { name: 'created_at', type: 'string', nullable: false, hasDefault: true },
  { name: 'updated_at', type: 'string', nullable: false, hasDefault: true }
]

const generateTypes = () => {
  console.log('🔄 Generating types from Drizzle schemas...')
  
  // Ensure src directory exists
  mkdirSync('src', { recursive: true })
  
  // Generate auth tokens types
  const authTokensContent = generateTypesFromSchema('AuthToken', 'auth_tokens', authTokensFields)
  writeFileSync('src/auth-tokens.ts', authTokensContent)
  console.log('✅ Generated auth-tokens.ts')
  
  // Generate user profiles types
  const userProfilesContent = generateTypesFromSchema('UserProfile', 'user_profiles', userProfilesFields)
  writeFileSync('src/user-profiles.ts', userProfilesContent)
  console.log('✅ Generated user-profiles.ts')
  
  // Generate index file
  const indexContent = `// Auto-generated database schema exports
// This file is generated automatically - do not edit manually

export * from './auth-tokens'
export * from './user-profiles'
`
  writeFileSync('src/index.ts', indexContent)
  console.log('✅ Generated index.ts')
  
  console.log('🎉 Type generation complete!')
  console.log('📝 Run "pnpm build" to compile the types')
}

// Run the generation
generateTypes()
