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

export async function GET(req, { params }) {
    const user = verifyRole(req, ["editor", "admin"]);
    if (!user) {
        return NextResponse.json({
            message: "Unauthorized - Editor or Admin only"
        }, {
            status: 401,
            headers: corsHeaders(req)
        });
    }
    
    const { id } = await params;

    try {
        const client = await getClientPromise();
        const db = client.db("wad-01");
        const result = await db.collection("review").findOne({ _id: new ObjectId(id) });
        
        if (!result) {
            return NextResponse.json({
                message: "Review not found"
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
    const user = verifyRole(req, ["editor", "admin"]);
    if (!user) {
        return NextResponse.json({
            message: "Unauthorized - Editor or Admin only"
        }, {
            status: 401,
            headers: corsHeaders(req)
        });
    }
    
    const { id } = await params;
    const data = await req.json();
    const partialUpdate = {};
    console.log("data : ", data);
    
    if (data.decision != null) {
        if (data.decision !== "approved" && data.decision !== "rejected") {
            return NextResponse.json({
                message: "Decision must be 'approved' or 'rejected'"
            }, {
                status: 400,
                headers: corsHeaders(req)
            });
        }
        partialUpdate.decision = data.decision;
    }
    if (data.feedback != null) partialUpdate.feedback = data.feedback;
    
    try {
        const client = await getClientPromise();
        const db = client.db("wad-01");
        
        const review = await db.collection("review").findOne({ _id: new ObjectId(id) });
        if (!review) {
            return NextResponse.json({
                message: "Review not found"
            }, {
                status: 404,
                headers: corsHeaders(req)
            });
        }
        
        const existedData = await db.collection("review").findOne({
            _id: new ObjectId(id)
        });
        const updateData = { ...existedData, ...partialUpdate };
        const updatedResult = await db.collection("review").updateOne({
            _id: new ObjectId(id)
        }, { $set: updateData });
        
        // If decision changed, update work status
        if (data.decision && data.decision !== review.decision) {
            let newStatus = data.decision === "approved" ? "approved" : "rejected";
            await db.collection("work").updateOne(
                { _id: new ObjectId(review.workId) },
                { $set: { status: newStatus, approvedAt: data.decision === "approved" ? new Date() : null } }
            );
        }
        
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
        
        const result = await db.collection("review").deleteOne({
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