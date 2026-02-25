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

    try {
        const client = await getClientPromise();
        const db = client.db("wad-01");
        const result = await db.collection("comment").findOne({ _id: new ObjectId(id) });
        
        if (!result) {
            return NextResponse.json({
                message: "Comment not found"
            }, {
                status: 404,
                headers: corsHeaders(req)
            });
        }
        
        console.log("==> result", result);
        return NextResponse.json(result, {
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
    
    if (data.body != null) partialUpdate.body = data.body;
    if (data.status != null) partialUpdate.status = data.status;
    
    try {
        const client = await getClientPromise();
        const db = client.db("wad-01");
        
        const comment = await db.collection("comment").findOne({ _id: new ObjectId(id) });
        if (!comment) {
            return NextResponse.json({
                message: "Comment not found"
            }, {
                status: 404,
                headers: corsHeaders(req)
            });
        }
        
        // Check permissions
        // User can edit their own comment (body only)
        // Admin can change status (hide/unhide)
        const isAdmin = user.role === "admin";
        const isOwner = comment.userId === user.id;
        
        if (data.status && !isAdmin) {
            return NextResponse.json({
                message: "Unauthorized - Only admin can change comment status"
            }, {
                status: 401,
                headers: corsHeaders(req)
            });
        }
        
        if (data.body && !isOwner) {
            return NextResponse.json({
                message: "Unauthorized - Can only edit your own comments"
            }, {
                status: 401,
                headers: corsHeaders(req)
            });
        }
        
        const existedData = await db.collection("comment").findOne({
            _id: new ObjectId(id)
        });
        const updateData = { ...existedData, ...partialUpdate };
        const updatedResult = await db.collection("comment").updateOne({
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
        
        const comment = await db.collection("comment").findOne({ _id: new ObjectId(id) });
        if (!comment) {
            return NextResponse.json({
                message: "Comment not found"
            }, {
                status: 404,
                headers: corsHeaders(req)
            });
        }
        
        // Check permissions - owner or admin can delete
        const isAdmin = user.role === "admin";
        const isOwner = comment.userId === user.id;
        
        if (!isAdmin && !isOwner) {
            return NextResponse.json({
                message: "Unauthorized"
            }, {
                status: 401,
                headers: corsHeaders(req)
            });
        }
        
        const result = await db.collection("comment").deleteOne({
            _id: new ObjectId(id)
        });
        
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