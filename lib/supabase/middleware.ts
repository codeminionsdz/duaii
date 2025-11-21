import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  // Only get user if we need authentication (not for static assets)
  if (!request.nextUrl.pathname.startsWith('/_next') && !request.nextUrl.pathname.startsWith('/favicon') && !request.nextUrl.pathname.startsWith('/api')) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Redirect unauthenticated users to login (except for auth pages, admin pages, and home)
    if (!user && !request.nextUrl.pathname.startsWith("/auth") && !request.nextUrl.pathname.startsWith("/admin") && request.nextUrl.pathname !== "/") {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }

    // Handle role-based redirection for authenticated users
    if (user && !request.nextUrl.pathname.startsWith("/auth") && !request.nextUrl.pathname.startsWith("/admin")) {
      // Get user profile to determine role (using service role to bypass RLS)
      const supabaseAdmin = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
              supabaseResponse = NextResponse.next({
                request,
              })
              cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
            },
          },
        },
      )

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (profile) {
        // Redirect based on role if accessing home page
        if (request.nextUrl.pathname === "/home") {
          const url = request.nextUrl.clone()
          if (profile.role === "pharmacy") {
            url.pathname = "/pharmacy/dashboard"
          } else if (profile.role === "admin") {
            url.pathname = "/admin"
          }
          // For regular users, stay on /home
          if (profile.role === "pharmacy" || profile.role === "admin") {
            return NextResponse.redirect(url)
          }
        }
      }
    }
  }

  return supabaseResponse
}
