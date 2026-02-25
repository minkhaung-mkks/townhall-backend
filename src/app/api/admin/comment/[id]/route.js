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
    const partialUpdate = { updatedAt: new Date() };
    console.log("data : ", data);
    
    // Admin can change comment status (visible/hidden)
    if (data.status != null) {
        if (!["visible", "hidden"].includes(data.status)) {
            return NextResponse.json({
                message: "Status must be 'visible' or 'hidden'"
            }, {
                status: 400,
                headers: corsHeaders(req)
            });
        }
        partialUpdate.status = data.status;
    }
    
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
        
        const existedData = await db.collection("comment").findOne({
            _id: new ObjectId(id)
        });
        const updateData = { ...existedData, ...partialUpdate };
        const updatedResult = await db.collection("comment").updateOne({
            _id: new ObjectId(id)
        }, { $set: updateData });
        
        return NextResponse.json({
            message: "Comment updated successfully",
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
        
        const result = await db.collection("comment").deleteOne({
            _id: new ObjectId(id)
        });
        
        return NextResponse.json({
            deletedCount: result.deletedCount,
            message: "Comment deleted"
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