<<<<<<< HEAD
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const baseUrl = process.env.API_BASE_URL;

  if (!baseUrl) {
    return NextResponse.json(
      { success: false, message: "API_BASE_URL is not configured" },

      { status: 500 }
    );
  }

  try {
    const body = await req.json();

    const { code, redirectUri } = body;
=======
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const baseUrl = process.env.API_BASE_URL
  if (!baseUrl) {
    return NextResponse.json(
      { success: false, message: "API_BASE_URL is not configured" },
      { status: 500 }
    )
  }

  try {
    const body = await req.json()
    const { code, redirectUri } = body
>>>>>>> origin/main

    if (!code || !redirectUri) {
      return NextResponse.json(
        { success: false, message: "Missing code or redirectUri" },
<<<<<<< HEAD

        { status: 400 }
      );
    }

    // sent code transfer token from backend

    const res = await fetch(`${baseUrl}/api/external/auth/line`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({ code, redirectUri }),
    });

    const data = await res.json();
=======
        { status: 400 }
      )
    }

    // sent code transfer token from backend
    const res = await fetch(`${baseUrl}/api/external/auth/line`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code, redirectUri }),
    })

    const data = await res.json()
>>>>>>> origin/main

    if (!res.ok || !data.success) {
      return NextResponse.json(
        { success: false, message: data.message || "LINE login failed" },
<<<<<<< HEAD

        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("LINE login error:", error);

    return NextResponse.json(
      { success: false, message: "Internal server error" },

      { status: 500 }
    );
=======
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("LINE login error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
>>>>>>> origin/main
  }
}
