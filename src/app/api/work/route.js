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
        const status = searchParams.get('status');
        const categoryId = searchParams.get('categoryId');
        const authorId = searchParams.get('authorId');
        const search = searchParams.get('search');

        const client = await getClientPromise();
        const db = client.db("wad-01");
        
        // Build query
        let query = {};
        
        // Default: only show published works for public
        const user = verifyJWT(req);
        if (!user || user.role === "creator") {
            query.status = "published";
        } else if (status) {
            query.status = status;
        }
        
        if (categoryId) {
            query.categoryId = categoryId;
        }
        
        if (authorId) {
            query.authorId = authorId;
        }
        
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }

        const total = await db.collection("work").countDocuments(query);
        const result = await db.collection("work")
            .find(query)
            .sort({ publishedAt: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        console.log("==> result", result);
        return NextResponse.json({
            works: result,
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
    const categoryId = data.categoryId;
    const tags = data.tags || [];
    
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
        const result = await db.collection("work").insertOne({
            title: title,
            content: content,
            authorId: user.id,
            categoryId: categoryId,
            tags: tags,
            status: "draft",
            submittedAt: null,
            approvedAt: null,
            publishedAt: null,
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