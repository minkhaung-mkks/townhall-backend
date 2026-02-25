import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { verifyJWT, verifyRole } from "@/lib/auth";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function OPTIONS(req) {
    return new Response(null, {
        status: 200,
        headers: corsHeaders(req),
    });
}

export async function GET(req, { params }) {
    const { id } = await params;
    const user = verifyJWT(req);

    try {
        const client = await getClientPromise();
        const db = client.db("wad-01");
        const work = await db.collection("work").findOne({ _id: new ObjectId(id) });
        
        if (!work) {
            return NextResponse.json({
                message: "Work not found"
            }, {
                status: 404,
                headers: corsHeaders(req)
            });
        }
        
        // Check access: only published works are public
        // Authors can see their own works
        // Editors and admins can see all
        if (work.status !== "published") {
            if (!user) {
                return NextResponse.json({
                    message: "Unauthorized"
                }, {
                    status: 401,
                    headers: corsHeaders(req)
                });
            }
            if (work.authorId !== user.id && user.role !== "editor" && user.role !== "admin") {
                return NextResponse.json({
                    message: "Unauthorized"
                }, {
                    status: 401,
                    headers: corsHeaders(req)
                });
            }
        }
        
        const likeCount = await db.collection("like").countDocuments({ workId: id });

        let author = null;
        if (work.authorId) {
            try {
                const authorDoc = await db.collection("user").findOne(
                    { _id: new ObjectId(work.authorId) },
                    { projection: { firstname: 1, lastname: 1, username: 1 } }
                );
                if (authorDoc) {
                    author = { firstname: authorDoc.firstname, lastname: authorDoc.lastname, username: authorDoc.username };
                }
            } catch {}
        }

        console.log("==> result", work);
        return NextResponse.json({ ...work, likeCount, author }, {
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

export async function PATCH(req, { params }) {
    const user = verifyJWT(req);
    if (!user) {
        return NextResponse.json({
            message: "Unauthorized"
        }, {
            status: 401,
            headers: corsHeaders(req)
        });
    }
    
    const { id } = await params;
    const data = await req.json();
    const partialUpdate = { updatedAt: new Date() };
    console.log("data : ", data);
    
    if (data.title != null) partialUpdate.title = data.title;
    if (data.content != null) partialUpdate.content = data.content;
    if (data.categoryId != null) partialUpdate.categoryId = data.categoryId;
    if (data.tags != null) partialUpdate.tags = data.tags;
    if (data.status != null) {
        partialUpdate.status = data.status;
        // Set dates based on status
        if (data.status === "submitted") {
            partialUpdate.submittedAt = new Date();
        } else if (data.status === "approved") {
            partialUpdate.approvedAt = new Date();
        } else if (data.status === "published") {
            partialUpdate.publishedAt = new Date();
        }
    }
    
    try {
        const client = await getClientPromise();
        const db = client.db("wad-01");
        
        // Check if user owns the work or is editor/admin
        const work = await db.collection("work").findOne({ _id: new ObjectId(id) });
        if (!work) {
            return NextResponse.json({
                message: "Work not found"
            }, {
                status: 404,
                headers: corsHeaders(req)
            });
        }
        
        // Only author can update their own work (unless editor/admin changing status)
        if (work.authorId !== user.id && user.role !== "editor" && user.role !== "admin") {
            return NextResponse.json({
                message: "Unauthorized"
            }, {
                status: 401,
                headers: corsHeaders(req)
            });
        }
        
        const existedData = await db.collection("work").findOne({
            _id: new ObjectId(id)
        });
        const updateData = { ...existedData, ...partialUpdate };
        const updatedResult = await db.collection("work").updateOne({
            _id: new ObjectId(id)
        }, { $set: updateData });
        
        return NextResponse.json(updatedResult, {
            status: 200,
            headers: corsHeaders(req)
        });
    }
    catch (exception) {
        const errorMsg = exception.toString();
        return NextResponse.json({
            message: errorMsg
        }, {
            status: 400,
            headers: corsHeaders(req)
        });
    }
}

export async function DELETE(req, { params }) {
    const user = verifyJWT(req);
    if (!user) {
        return NextResponse.json({
            message: "Unauthorized"
        }, {
            status: 401,
            headers: corsHeaders(req)
        });
    }
    
    const { id } = await params;
    
    try {
        const client = await getClientPromise();
        const db = client.db("wad-01");
        
        // Check if user owns the work or is admin
        const work = await db.collection("work").findOne({ _id: new ObjectId(id) });
        if (!work) {
            return NextResponse.json({
                message: "Work not found"
            }, {
                status: 404,
                headers: corsHeaders(req)
            });
        }
        
        if (work.authorId !== user.id && user.role !== "admin") {
            return NextResponse.json({
                message: "Unauthorized"
            }, {
                status: 401,
                headers: corsHeaders(req)
            });
        }
        
        const result = await db.collection("work").deleteOne({
            _id: new ObjectId(id)
        });
        
        // Also delete related drafts, comments, and likes
        await db.collection("draft").deleteMany({ workId: id });
        await db.collection("comment").deleteMany({ workId: id });
        await db.collection("like").deleteMany({ workId: id });
        
        return NextResponse.json({
            deletedCount: result.deletedCount
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