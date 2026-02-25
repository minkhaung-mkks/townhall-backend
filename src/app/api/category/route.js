import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { verifyRole } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function OPTIONS(req) {
    return new Response(null, {
        status: 200,
        headers: corsHeaders(req),
    });
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const skip = (page - 1) * limit;

        const client = await getClientPromise();
        const db = client.db("wad-01");

        const total = await db.collection("category").countDocuments({});
        const result = await db.collection("category")
            .find({})
            .skip(skip)
            .limit(limit)
            .toArray();

        console.log("==> result", result);
        return NextResponse.json({
            categories: result,
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

export async function POST(req) {
    const user = verifyRole(req, ["admin"]);
    if (!user) {
        return NextResponse.json({
            message: "Unauthorized - Admin only"
        }, {
            status: 401,
            headers: corsHeaders(req)
        });
    }
    
    const data = await req.json();
    const name = data.name;
    const description = data.description || "";
    
    if (!name) {
        return NextResponse.json({
            message: "Category name is required"
        }, {
            status: 400,
            headers: corsHeaders(req)
        });
    }
    
    try {
        const client = await getClientPromise();
        const db = client.db("wad-01");
        const result = await db.collection("category").insertOne({
            name: name,
            description: description,
            createdAt: new Date()
        });
        
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
        let displayErrorMsg = "Error creating category";
        if (errorMsg.includes("duplicate")) {
            displayErrorMsg = "Category name already exists";
        }
        return NextResponse.json({
            message: displayErrorMsg
        }, {
            status: 400,
            headers: corsHeaders(req)
        });
    }
}