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
        const workId = searchParams.get('workId');

        if (!workId) {
            return NextResponse.json({
                message: "workId is required"
            }, {
                status: 400,
                headers: corsHeaders(req)
            });
        }

        const client = await getClientPromise();
        const db = client.db("wad-01");

        const likeCount = await db.collection("like").countDocuments({ workId });

        const user = verifyJWT(req);
        let liked = false;
        if (user) {
            const existing = await db.collection("like").findOne({ userId: user.id, workId });
            liked = !!existing;
        }

        return NextResponse.json({ likeCount, liked }, {
            headers: corsHeaders(req)
        });
    }
    catch (exception) {
        console.log("exception", exception.toString());
        return NextResponse.json({
            message: exception.toString()
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

    try {
        const data = await req.json();
        const workId = data.workId;

        if (!workId) {
            return NextResponse.json({
                message: "workId is required"
            }, {
                status: 400,
                headers: corsHeaders(req)
            });
        }

        const client = await getClientPromise();
        const db = client.db("wad-01");

        // Check work exists and is published
        const work = await db.collection("work").findOne({ _id: new ObjectId(workId) });
        if (!work || work.status !== "published") {
            return NextResponse.json({
                message: "Work not found or not published"
            }, {
                status: 404,
                headers: corsHeaders(req)
            });
        }

        // Toggle like
        const existing = await db.collection("like").findOne({ userId: user.id, workId });

        if (existing) {
            await db.collection("like").deleteOne({ _id: existing._id });
        } else {
            await db.collection("like").insertOne({
                userId: user.id,
                workId,
                createdAt: new Date()
            });
        }

        const likeCount = await db.collection("like").countDocuments({ workId });

        return NextResponse.json({
            liked: !existing,
            likeCount
        }, {
            headers: corsHeaders(req)
        });
    }
    catch (exception) {
        console.log("exception", exception.toString());
        return NextResponse.json({
            message: exception.toString()
        }, {
            status: 400,
            headers: corsHeaders(req)
        });
    }
}
