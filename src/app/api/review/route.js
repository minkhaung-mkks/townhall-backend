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

export async function GET(req) {
    const user = verifyRole(req, ["editor", "admin"]);
    if (!user) {
        return NextResponse.json({
            message: "Unauthorized - Editor or Admin only"
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
        
        let query = {};
        if (workId) {
            query.workId = workId;
        }

        const total = await db.collection("review").countDocuments(query);
        const result = await db.collection("review")
            .find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        console.log("==> result", result);
        return NextResponse.json({
            reviews: result,
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
    const user = verifyRole(req, ["editor", "admin"]);
    if (!user) {
        return NextResponse.json({
            message: "Unauthorized - Editor or Admin only"
        }, {
            status: 401,
            headers: corsHeaders(req)
        });
    }
    
    const data = await req.json();
    const workId = data.workId;
    const decision = data.decision; // "approved" or "rejected"
    const feedback = data.feedback || "";
    
    if (!workId || !decision) {
        return NextResponse.json({
            message: "Work ID and decision are required"
        }, {
            status: 400,
            headers: corsHeaders(req)
        });
    }
    
    if (decision !== "approved" && decision !== "rejected") {
        return NextResponse.json({
            message: "Decision must be 'approved' or 'rejected'"
        }, {
            status: 400,
            headers: corsHeaders(req)
        });
    }
    
    try {
        const client = await getClientPromise();
        const db = client.db("wad-01");
        
        // Check if work exists and is in submitted status
        const work = await db.collection("work").findOne({ _id: new ObjectId(workId) });
        if (!work) {
            return NextResponse.json({
                message: "Work not found"
            }, {
                status: 404,
                headers: corsHeaders(req)
            });
        }
        
        if (work.status !== "submitted") {
            return NextResponse.json({
                message: "Work must be in 'submitted' status to review"
            }, {
                status: 400,
                headers: corsHeaders(req)
            });
        }
        
        // Create review
        const result = await db.collection("review").insertOne({
            workId: workId,
            editorId: user.id,
            decision: decision,
            feedback: feedback,
            createdAt: new Date()
        });
        
        // Update work status based on decision
        let newStatus = decision === "approved" ? "approved" : "rejected";
        let updateData = {
            status: newStatus,
            approvedAt: decision === "approved" ? new Date() : null
        };
        
        await db.collection("work").updateOne(
            { _id: new ObjectId(workId) },
            { $set: updateData }
        );
        
        return NextResponse.json({
            id: result.insertedId,
            workStatus: newStatus
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