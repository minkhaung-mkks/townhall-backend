import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { verifyJWT } from "@/lib/auth";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

const MAX_DRAFTS = 5;

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
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const skip = (page - 1) * limit;
        const workId = searchParams.get('workId');

        const client = await getClientPromise();
        const db = client.db("wad-01");
        
        let query = { authorId: user.id };
        if (workId) {
            query.workId = workId;
        }

        const total = await db.collection("draft").countDocuments(query);
        const result = await db.collection("draft")
            .find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        console.log("==> result", result);
        return NextResponse.json({
            drafts: result,
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
    const title = data.title;
    const content = data.content;
    const workId = data.workId;
    const pinned = data.pinned || false;
    
    if (!title || !content) {
        return NextResponse.json({
            message: "Title and content are required"
        }, {
            status: 400,
            headers: corsHeaders(req)
        });
    }
    
    try {
        const client = await getClientPromise();
        const db = client.db("wad-01");
        
        // Check if work exists and belongs to user
        if (workId) {
            const work = await db.collection("work").findOne({ _id: new ObjectId(workId) });
            if (!work) {
                return NextResponse.json({
                    message: "Work not found"
                }, {
                    status: 404,
                    headers: corsHeaders(req)
                });
            }
            if (work.authorId !== user.id) {
                return NextResponse.json({
                    message: "Unauthorized"
                }, {
                    status: 401,
                    headers: corsHeaders(req)
                });
            }
        }
        
        // Count existing drafts for this work
        const existingDraftsCount = await db.collection("draft").countDocuments({
            workId: workId,
            authorId: user.id
        });
        
        if (existingDraftsCount >= MAX_DRAFTS) {
            return NextResponse.json({
                message: "Maximum 5 drafts allowed per work. Please delete old drafts first."
            }, {
                status: 400,
                headers: corsHeaders(req)
            });
        }
        
        const result = await db.collection("draft").insertOne({
            title: title,
            content: content,
            authorId: user.id,
            workId: workId,
            pinned: pinned,
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
        return NextResponse.json({
            message: errorMsg
        }, {
            status: 400,
            headers: corsHeaders(req)
        });
    }
}