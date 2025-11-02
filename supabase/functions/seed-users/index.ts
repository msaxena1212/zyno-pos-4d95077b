import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleCode: string;
}

const testUsers: UserData[] = [
  {
    email: 'admin@retailpro.com',
    password: 'Admin123!',
    firstName: 'System',
    lastName: 'Administrator',
    roleCode: 'admin',
  },
  {
    email: 'manager@retailpro.com',
    password: 'Manager123!',
    firstName: 'Store',
    lastName: 'Manager',
    roleCode: 'manager',
  },
  {
    email: 'marketing@retailpro.com',
    password: 'Marketing123!',
    firstName: 'Marketing',
    lastName: 'Manager',
    roleCode: 'marketing_manager',
  },
  {
    email: 'stock@retailpro.com',
    password: 'Stock123!',
    firstName: 'Stock',
    lastName: 'Manager',
    roleCode: 'stock_manager',
  },
  {
    email: 'cashier@retailpro.com',
    password: 'Cashier123!',
    firstName: 'Front',
    lastName: 'Cashier',
    roleCode: 'cashier',
  },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const results = []

    // Get brand ID
    const { data: brandData, error: brandError } = await supabaseAdmin
      .from('brands')
      .select('id')
      .eq('code', 'RETAIL_PRO')
      .single()

    if (brandError) throw brandError

    for (const userData of testUsers) {
      console.log(`Creating user: ${userData.email}`)

      // Create user with Admin API
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          first_name: userData.firstName,
          last_name: userData.lastName,
        },
      })

      if (authError) {
        console.error(`Error creating user ${userData.email}:`, authError)
        results.push({ email: userData.email, status: 'error', error: authError.message })
        continue
      }

      console.log(`User created: ${userData.email}, ID: ${authData.user.id}`)

      // Get role ID
      const { data: roleData, error: roleError } = await supabaseAdmin
        .from('roles')
        .select('id')
        .eq('code', userData.roleCode)
        .single()

      if (roleError) {
        console.error(`Error finding role ${userData.roleCode}:`, roleError)
        results.push({ 
          email: userData.email, 
          status: 'partial', 
          message: 'User created but role not assigned',
          error: roleError.message 
        })
        continue
      }

      // Assign role
      const { error: assignError } = await supabaseAdmin
        .from('user_role_assignments')
        .insert({
          user_id: authData.user.id,
          role_id: roleData.id,
          brand_id: brandData.id,
          status: 'active',
        })

      if (assignError) {
        console.error(`Error assigning role to ${userData.email}:`, assignError)
        results.push({ 
          email: userData.email, 
          status: 'partial', 
          message: 'User created but role not assigned',
          error: assignError.message 
        })
        continue
      }

      console.log(`Role ${userData.roleCode} assigned to ${userData.email}`)
      results.push({ 
        email: userData.email, 
        role: userData.roleCode,
        status: 'success',
        message: 'User created and role assigned'
      })
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        results,
        message: 'Test users seeded successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in seed-users function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
