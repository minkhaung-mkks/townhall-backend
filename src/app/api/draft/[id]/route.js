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

export async function GET(req, { params }) {
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
        const result = await db.collection("draft").findOne({ _id: new ObjectId(id) });
        
        if (!result) {
            return NextResponse.json({
                message: "Draft not found"
            }, {
                status: 404,
                headers: corsHeaders(req)
            });
        }
        
        // Check if user owns the draft
        if (result.authorId !== user.id) {
            return NextResponse.json({
                message: "Unauthorized"
            }, {
                status: 401,
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
    const partialUpdate = {};
    console.log("data : ", data);
    
    if (data.title != null) partialUpdate.title = data.title;
    if (data.content != null) partialUpdate.content = data.content;
    if (data.pinned != null) partialUpdate.pinned = data.pinned;
    
    try {
        const client = await getClientPromise();
        const db = client.db("wad-01");
        
        // Check if user owns the draft
        const draft = await db.collection("draft").findOne({ _id: new ObjectId(id) });
        if (!draft) {
            return NextResponse.json({
                message: "Draft not found"
            }, {
                status: 404,
                headers: corsHeaders(req)
            });
        }
        
        if (draft.authorId !== user.id) {
            return NextResponse.json({
                message: "Unauthorized"
            }, {
                status: 401,
                headers: corsHeaders(req)
            });
        }
        
        const existedData = await db.collection("draft").findOne({
            _id: new ObjectId(id)
        });
        const updateData = { ...existedData, ...partialUpdate };
        const updatedResult = await db.collection("draft").updateOne({
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
        
        // Check if user owns the draft
        const draft = await db.collection("draft").findOne({ _id: new ObjectId(id) });
        if (!draft) {
            return NextResponse.json({
                message: "Draft not found"
            }, {
                status: 404,
                headers: corsHeaders(req)
            });
        }
        
        // Check if pinned (optional: prevent deletion of pinned drafts)
        // if (draft.pinned) {
        //     return NextResponse.json({
        //         message: "Cannot delete pinned draft"
        //     }, {
        //         status: 400,
        //         headers: corsHeaders(req)
        //     });
        // }
        
        if (draft.authorId !== user.id) {
            return NextResponse.json({
                message: "Unauthorized"
            }, {
                status: 401,
                headers: corsHeaders(req)
            });
        }
        
        const result = await db.collection("draft").deleteOne({
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