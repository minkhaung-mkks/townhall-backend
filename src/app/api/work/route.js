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
        const tag = searchParams.get('tag');
        const sortBy = searchParams.get('sortBy');

        const client = await getClientPromise();
        const db = client.db("wad-01");
        
        const user = verifyJWT(req);
        
        let query = {};
        
        if (user && (user.role === "editor" || user.role === "admin")) {
            query.status = status || "published";
        } else if (user && user.role === "creator") {
            if (authorId === user.id) {
                if (status) {
                    query.status = status;
                }
            } else {
                query.status = "published";
            }
        } else {
            query.status = "published";
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

        if (tag) {
            query.tags = tag;
        }

        const sortOrder = sortBy === 'oldest' ? 1 : -1;

        const total = await db.collection("work").countDocuments(query);
        const result = await db.collection("work")
            .find(query)
            .sort({ publishedAt: sortOrder, createdAt: sortOrder })
            .skip(skip)
            .limit(limit)
            .toArray();

        // Attach like counts to each work
        const workIdsForLikes = result.map(w => w._id.toString());
        const likeCounts = await db.collection("like").aggregate([
            { $match: { workId: { $in: workIdsForLikes } } },
            { $group: { _id: "$workId", likeCount: { $sum: 1 } } }
        ]).toArray();
        const likeCountMap = {};
        likeCounts.forEach(l => { likeCountMap[l._id] = l.likeCount; });

        // Populate author info
        const authorIds = [...new Set(result.map(w => w.authorId).filter(Boolean))];
        const authors = await db.collection("user").find({
            _id: { $in: authorIds.map(id => { try { return new ObjectId(id); } catch { return null; } }).filter(Boolean) }
        }).project({ firstname: 1, lastname: 1, username: 1 }).toArray();
        const authorMap = {};
        authors.forEach(a => { authorMap[a._id.toString()] = a; });

        const worksWithLikes = result.map(w => ({
            ...w,
            likeCount: likeCountMap[w._id.toString()] || 0,
            author: authorMap[w.authorId] ? {
                firstname: authorMap[w.authorId].firstname,
                lastname: authorMap[w.authorId].lastname,
                username: authorMap[w.authorId].username
            } : null
        }));

        console.log("==> result", worksWithLikes);
        return NextResponse.json({
            works: worksWithLikes,
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