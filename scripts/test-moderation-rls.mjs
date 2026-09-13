#!/usr/bin/env node

/**
 * Test RLS policies for moderation tables (Fase 7)
 *
 * Verifica que las políticas RLS funcionen correctamente para:
 *   - listing_reports: INSERT abierto, SELECT solo admin
 *   - moderation_actions: INSERT solo admin, SELECT solo admin
 *
 * Uso:
 *   npm run test:moderation-rls
 *     (requiere SUPABASE_URL y SUPABASE_SERVICE_KEY en .env)
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !SUPABASE_ANON_KEY) {
  console.error(
    '❌ Faltan variables de entorno: SUPABASE_URL, SUPABASE_SERVICE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY'
  )
  process.exit(1)
}

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

let testsPassed = 0
let testsFailed = 0

async function test(name, fn) {
  try {
    await fn()
    console.log(`✓ ${name}`)
    testsPassed++
  } catch (error) {
    console.log(`✗ ${name}`)
    console.log(`  Error: ${error.message}`)
    testsFailed++
  }
}

async function main() {
  console.log('🔍 Testing Moderation RLS Policies...\n')

  // Setup: crear usuarios de prueba
  console.log('📋 Setup: Creating test users...')

  // Usuario regular
  const { data: regularUser } = await adminClient.auth.admin.createUser({
    email: `test-regular-${Date.now()}@test.local`,
    password: 'testpass123',
    email_confirm: true,
  })

  // Admin
  const { data: adminUser } = await adminClient.auth.admin.createUser({
    email: `test-admin-${Date.now()}@test.local`,
    password: 'testpass123',
    email_confirm: true,
  })

  // Marcar como admin
  await adminClient.from('profiles').update({ is_admin: true }).eq('id', adminUser.user.id)

  console.log(`  Regular user: ${regularUser.user.id}`)
  console.log(`  Admin user: ${adminUser.user.id}\n`)

  // Setup: crear un listing
  const { data: listing } = await adminClient
    .from('listings')
    .insert({
      seller_id: regularUser.user.id,
      category_id: 'autos',
      location_id: '00000000-0000-0000-0000-000000000000',
      status: 'published',
      title: 'Test Vehicle',
      brand: 'Test',
      model: 'Car',
      year: 2024,
      price_amount: 10000,
      price_currency: 'ARS',
      price_type: 'fixed',
    })
    .select()
    .single()

  console.log(`📌 Test listing created: ${listing.id}\n`)

  // Test: listing_reports
  console.log('📝 Testing listing_reports table:\n')

  await test('Anónimo puede crear reporte', async () => {
    const { error } = await anonClient.from('listing_reports').insert({
      listing_id: listing.id,
      reason: 'spam',
      details: 'Test report',
    })
    if (error) throw error
  })

  await test('Usuario regular puede crear reporte', async () => {
    const { error } = await anonClient
      .auth.signInWithPassword({
        email: regularUser.user.email,
        password: 'testpass123',
      })
      .catch(e => ({ error: e }))

    if (error) throw error

    const { error: insertError } = await anonClient.from('listing_reports').insert({
      listing_id: listing.id,
      reason: 'fotos_robadas',
      details: 'Fake photos',
    })
    if (insertError) throw insertError
  })

  await test('Usuario regular NO puede ver reportes', async () => {
    const { data, error } = await anonClient.from('listing_reports').select()

    // Debe fallar o devolver lista vacía (dependiendo de política)
    // Para este test, esperamos que falle o esté vacío
    if (data && data.length > 0) {
      throw new Error('Regular user debería ver 0 reportes')
    }
  })

  await test('Admin puede ver reportes', async () => {
    // Signar como admin
    const { error: signInError } = await adminClient
      .auth.signInWithPassword({
        email: adminUser.user.email,
        password: 'testpass123',
      })
      .catch(e => ({ error: e }))

    if (signInError) throw signInError

    const { data, error } = await adminClient.from('listing_reports').select()
    if (error) throw error
    // Admin debe poder ver (data puede ser vacío o no, lo importante es no error)
  })

  // Test: moderation_actions
  console.log('\n🎯 Testing moderation_actions table:\n')

  await test('Usuario regular NO puede crear moderation_action', async () => {
    const { error } = await anonClient.from('moderation_actions').insert({
      listing_id: listing.id,
      action: 'approved',
      reason: 'Looks good',
    })

    // Esperamos error (permission denied)
    if (!error) {
      throw new Error('Regular user no debería poder crear acciones')
    }
  })

  // Test: check_auto_approval RPC
  console.log('\n⚡ Testing RPC functions:\n')

  await test('check_auto_approval RPC devuelve resultado válido', async () => {
    const { data, error } = await adminClient.rpc('check_auto_approval', {
      p_seller_id: regularUser.user.id,
      p_rule_id: 'standard',
    })

    if (error) throw error
    if (!data) throw new Error('No data returned')
    if (data.length === 0) throw new Error('Empty result')

    const result = data[0]
    if (typeof result.should_auto_approve !== 'boolean') {
      throw new Error('Invalid result structure')
    }
  })

  await test('detect_duplicate_listing RPC devuelve resultado válido', async () => {
    const { data, error } = await adminClient.rpc('detect_duplicate_listing', {
      p_seller_id: regularUser.user.id,
      p_brand: 'Test',
      p_model: 'Car',
      p_year: 2024,
      p_price: 10000,
      p_days_window: 7,
    })

    if (error) throw error
    if (!data) throw new Error('No data returned')
    if (data.length === 0) throw new Error('Empty result')

    const result = data[0]
    if (typeof result.is_potential_duplicate !== 'boolean') {
      throw new Error('Invalid result structure')
    }
  })

  await test('check_rate_limit_new_seller RPC devuelve resultado válido', async () => {
    const { data, error } = await adminClient.rpc('check_rate_limit_new_seller', {
      p_seller_id: regularUser.user.id,
      p_max_listings: 3,
      p_hours_window: 48,
    })

    if (error) throw error
    if (!data) throw new Error('No data returned')
    if (data.length === 0) throw new Error('Empty result')

    const result = data[0]
    if (typeof result.is_within_limit !== 'boolean') {
      throw new Error('Invalid result structure')
    }
  })

  // Cleanup
  console.log('\n🧹 Cleaning up test users...')
  await adminClient.auth.admin.deleteUser(regularUser.user.id)
  await adminClient.auth.admin.deleteUser(adminUser.user.id)

  // Summary
  console.log(`\n${'='.repeat(50)}`)
  console.log(`✅ Passed: ${testsPassed}`)
  console.log(`❌ Failed: ${testsFailed}`)
  console.log(`${'='.repeat(50)}\n`)

  process.exit(testsFailed > 0 ? 1 : 0)
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
