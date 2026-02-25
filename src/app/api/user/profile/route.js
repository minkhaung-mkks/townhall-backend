import { verifyJWT } from "@/lib/auth";
import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function OPTIONS(req) {
    return new Response(null, {
        status: 200,
        headers: corsHeaders(req),
    });
}

export async function GET(req) {
    const user = verifyJWT(req);
    if (!user) {
        return NextResponse.json({
            message: "Unauthorized"
        }, {
            status: 401,
            headers: corsHeaders(req)
        });
    }
    
    try {
        const client = await getClientPromise();
        const db = client.db("wad-01");
        const email = user.email;
        const profile = await db.collection("user").findOne({ email });
        console.log("profile: ", profile);
        
        // Don't return password
        const { password, ...profileWithoutPassword } = profile;
        
        return NextResponse.json({
            ...profileWithoutPassword,
            id: profile._id.toString()
        }, {
            headers: corsHeaders(req)
        });
    }
    catch (error) {
        console.log("Get Profile Exception: ", error.toString());
        return NextResponse.json({
            message: error.toString()
        }, {
            status: 400,
            headers: corsHeaders(req)
        });
    }
}