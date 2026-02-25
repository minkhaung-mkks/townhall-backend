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
    const { id } = await params;

    try {
        const client = await getClientPromise();
        const db = client.db("wad-01");
        const result = await db.collection("category").findOne({ _id: new ObjectId(id) });
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
    
    if (data.name != null) partialUpdate.name = data.name;
    if (data.description != null) partialUpdate.description = data.description;
    
    try {
        const client = await getClientPromise();
        const db = client.db("wad-01");
        const existedData = await db.collection("category").findOne({
            _id: new ObjectId(id)
        });
        const updateData = { ...existedData, ...partialUpdate };
        const updatedResult = await db.collection("category").updateOne({
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
        const result = await db.collection("category").deleteOne({
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