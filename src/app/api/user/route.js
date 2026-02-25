import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

export async function OPTIONS(req) {
    return new Response(null, {
        status: 200,
        headers: corsHeaders(req),
    });
}

export async function POST(req) {
    const data = await req.json();
    const username = data.username;
    const email = data.email;
    const password = data.password;
    const firstname = data.firstname;
    const lastname = data.lastname;
    const bio = data.bio || "";
    const role = data.role || "creator";
    
    if (!username || !email || !password) {
        return NextResponse.json({
            message: "Missing mandatory data"
        }, {
            status: 400,
            headers: corsHeaders(req)
        });
    }
    
    try {
        const client = await getClientPromise();
        const db = client.db("wad-01");
        const result = await db.collection("user").insertOne({
            username: username,
            email: email,
            password: await bcrypt.hash(password, 10),
            firstname: firstname,
            lastname: lastname,
            bio: bio,
            role: role,
            status: "active",
            createdAt: new Date()
        });
        console.log("result", result);
        return NextResponse.json({
            id: result.insertedId
        }, {
            status: 200,
            headers: corsHeaders(req)
        });
    }
    catch (exception) {
        console.log("exception", exception.toString());
        const errorMsg = exception.toString();
        let displayErrorMsg = "";
        if (errorMsg.includes("duplicate")) {
            if (errorMsg.includes("username")) {
                displayErrorMsg = "Duplicate Username!!"
            }
            else if (errorMsg.includes("email")) {
                displayErrorMsg = "Duplicate Email!!"
            }
        }
        return NextResponse.json({
            message: displayErrorMsg
        }, {
            status: 400,
            headers: corsHeaders(req)
        });
    }
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const skip = (page - 1) * limit;

        const client = await getClientPromise();
        const db = client.db("wad-01");

        const total = await db.collection("user").countDocuments({});
        const result = await db.collection("user")
            .find({})
            .project({ password: 0 })
            .skip(skip)
            .limit(limit)
            .toArray();

        console.log("==> result", result);
        return NextResponse.json({
            users: result,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }, {
            headers: corsHeaders(req)
        });
    }
    catch (exception) {
        console.log("exception", exception.toString());
        const errorMsg = exception.toString();
        return NextResponse.json({
            message: errorMsg
        }, {
            status: 400,
            headers: corsHeaders(req)
        });
    }
}