import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { verifyJWT } from "@/lib/auth";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

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
        const workId = searchParams.get('workId');

        if (!workId) {
            return NextResponse.json({
                message: "Work ID is required"
            }, {
                status: 400,
                headers: corsHeaders(req)
            });
        }

        const client = await getClientPromise();
        const db = client.db("wad-01");

        // Only show visible comments (not hidden)
        const query = { workId: workId, status: "visible" };
        
        const total = await db.collection("comment").countDocuments(query);
        const result = await db.collection("comment")
            .find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        console.log("==> result", result);
        return NextResponse.json({
            comments: result,
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
    const user = verifyJWT(req);
    if (!user) {
        return NextResponse.json({
            message: "Unauthorized"
        }, {
            status: 401,
            headers: corsHeaders(req)
        });
    }
    
    const data = await req.json();
    const workId = data.workId;
    const body = data.body;
    
    if (!workId || !body) {
        return NextResponse.json({
            message: "Work ID and comment body are required"
        }, {
            status: 400,
            headers: corsHeaders(req)
        });
    }
    
    try {
        const client = await getClientPromise();
        const db = client.db("wad-01");
        
        // Check if work exists and is published
        const work = await db.collection("work").findOne({ _id: new ObjectId(workId) });
        if (!work) {
            return NextResponse.json({
                message: "Work not found"
            }, {
                status: 404,
                headers: corsHeaders(req)
            });
        }
        
        if (work.status !== "published") {
            return NextResponse.json({
                message: "Can only comment on published works"
            }, {
                status: 400,
                headers: corsHeaders(req)
            });
        }
        
        const result = await db.collection("comment").insertOne({
            workId: workId,
            userId: user.id,
            username: user.username,
            body: body,
            status: "visible",
            createdAt: new Date(),
            updatedAt: new Date()
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
        return NextResponse.json({
            message: errorMsg
        }, {
            status: 400,
            headers: corsHeaders(req)
        });
    }
}