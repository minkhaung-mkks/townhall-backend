import corsHeaders from "@/lib/cors";
import { NextResponse } from "next/server";

export async function OPTIONS(req) {
    return new Response(null, {
        status: 200,
        headers: corsHeaders(req),
    });
}

export async function POST(req) {
    const response = NextResponse.json({
        message: "Logout successful"
    }, {
        status: 200,
        headers: corsHeaders(req)
    });
    response.cookies.set("token", "", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
        secure: process.env.NODE_ENV === "production"
    });
    return response;
}