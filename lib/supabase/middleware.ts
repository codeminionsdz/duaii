import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  try {
    let supabaseResponse = NextResponse.next({
      request,
    })

    // Verify environment variables exist
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase environment variables")
      return supabaseResponse
    }

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
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
    })

    // Skip middleware for static assets and API routes
    const pathname = request.nextUrl.pathname
    if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.startsWith("/api")) {
      return supabaseResponse
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Redirect unauthenticated users to login (except for auth pages, admin pages, and home)
      if (!user && !pathname.startsWith("/auth") && !pathname.startsWith("/admin") && pathname !== "/") {
        const url = request.nextUrl.clone()
        url.pathname = "/auth/login"
        return NextResponse.redirect(url)
      }

      // Handle role-based redirection for authenticated users
      if (user && !pathname.startsWith("/auth") && !pathname.startsWith("/admin")) {
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (serviceRoleKey) {
          const supabaseAdmin = createServerClient(supabaseUrl, serviceRoleKey, {
            cookies: {
              getAll() {
                return request.cookies.getAll()
              },
              setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
              },
            },
          })

          try {
            const { data: profile } = await supabaseAdmin
              .from("profiles")
              .select("role")
              .eq("id", user.id)
              .single()

            if (profile && pathname === "/home") {
              const url = request.nextUrl.clone()
              if (profile.role === "pharmacy") {
                url.pathname = "/pharmacy/dashboard"
                return NextResponse.redirect(url)
              } else if (profile.role === "admin") {
                url.pathname = "/admin"
                return NextResponse.redirect(url)
              }
            }
          } catch (error) {
            console.error("Error fetching user profile:", error)
          }
        }
      }
    } catch (error) {
      console.error("Auth error in middleware:", error)
      return supabaseResponse
    }

    return supabaseResponse
  } catch (error) {
    console.error("Middleware error:", error)
    return NextResponse.next()
  }
}
