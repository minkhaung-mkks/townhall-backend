import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "mydefaultjwtsecret";

export async function OPTIONS(req) {
    return new Response(null, {
        status: 200,
        headers: corsHeaders(req),
    });
}

export async function POST(req) {
    const data = await req.json();
    console.log(data);
    const { email, password } = data;
    
    if (!email || !password) {
        return NextResponse.json({
            message: "Missing email or password"
        }, {
            status: 400,
            headers: corsHeaders(req)
        });
    }
    
    try {
        console.log("login route");
        const client = await getClientPromise();
        const db = client.db("wad-01");
        const user = await db.collection("user").findOne({ email });
        
        if (!user) {
            return NextResponse.json({
                message: "Invalid email or password"
            }, {
                status: 401,
                headers: corsHeaders(req)
            });
        }
        
        if (user.status === "suspended" || user.status === "banned") {
            return NextResponse.json({
                message: "Account is suspended or banned"
            }, {
                status: 403,
                headers: corsHeaders(req)
            });
        }
        
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return NextResponse.json({
                message: "Invalid email or password"
            }, {
                status: 401,
                headers: corsHeaders(req)
            });
        }
        
        // Generate JWT
        const token = jwt.sign({
            id: user._id.toString(),
            email: user.email,
            username: user.username,
            role: user.role
        }, JWT_SECRET, { expiresIn: "7d" });
        
        // Set JWT as HTTP-only cookie
        const response = NextResponse.json({
            message: "Login successful",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        }, {
            status: 200,
            headers: corsHeaders(req)
        });
        
        response.cookies.set("token", token, {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
            secure: process.env.NODE_ENV === "production"
        });
        
        return response;
    } catch (exception) {
        console.log("exception", exception.toString());
        return NextResponse.json({
            message: "Internal server error"
        }, {
            status: 500,
            headers: corsHeaders(req)
        });
    }
}