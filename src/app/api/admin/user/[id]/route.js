import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { verifyRole } from "@/lib/auth";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function OPTIONS(req) {
    return new Response(null, {
        status: 200,
        headers: corsHeaders(req),
    });
}

export async function PATCH(req, { params }) {
    const user = verifyRole(req, ["admin"]);
    if (!user) {
        return NextResponse.json({
            message: "Unauthorized - Admin only"
        }, {
            status: 401,
            headers: corsHeaders(req)
        });
    }
    
    const { id } = await params;
    const data = await req.json();
    const partialUpdate = {};
    console.log("data : ", data);
    
    // Admin can change user status (active, suspended, banned)
    if (data.status != null) {
        if (!["active", "suspended", "banned"].includes(data.status)) {
            return NextResponse.json({
                message: "Status must be 'active', 'suspended', or 'banned'"
            }, {
                status: 400,
                headers: corsHeaders(req)
            });
        }
        partialUpdate.status = data.status;
    }
    
    // Admin can change user role
    if (data.role != null) {
        if (!["creator", "editor", "admin"].includes(data.role)) {
            return NextResponse.json({
                message: "Role must be 'creator', 'editor', or 'admin'"
            }, {
                status: 400,
                headers: corsHeaders(req)
            });
        }
        partialUpdate.role = data.role;
    }
    
    try {
        const client = await getClientPromise();
        const db = client.db("wad-01");
        
        const targetUser = await db.collection("user").findOne({ _id: new ObjectId(id) });
        if (!targetUser) {
            return NextResponse.json({
                message: "User not found"
            }, {
                status: 404,
                headers: corsHeaders(req)
            });
        }
        
        const existedData = await db.collection("user").findOne({
            _id: new ObjectId(id)
        });
        const updateData = { ...existedData, ...partialUpdate };
        const updatedResult = await db.collection("user").updateOne({
            _id: new ObjectId(id)
        }, { $set: updateData });
        
        return NextResponse.json({
            message: "User updated successfully",
            result: updatedResult
        }, {
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
    const user = verifyRole(req, ["admin"]);
    if (!user) {
        return NextResponse.json({
            message: "Unauthorized - Admin only"
        }, {
            status: 401,
            headers: corsHeaders(req)
        });
    }
    
    const { id } = await params;
    
    try {
        const client = await getClientPromise();
        const db = client.db("wad-01");
        
        // Delete user
        const result = await db.collection("user").deleteOne({
            _id: new ObjectId(id)
        });
        
        // Also delete user's works, drafts, comments
        await db.collection("work").deleteMany({ authorId: id });
        await db.collection("draft").deleteMany({ authorId: id });
        await db.collection("comment").deleteMany({ userId: id });
        
        return NextResponse.json({
            deletedCount: result.deletedCount,
            message: "User and all associated data deleted"
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