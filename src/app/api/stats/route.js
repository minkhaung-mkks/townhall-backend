import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
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
        const client = await getClientPromise();
        const db = client.db("wad-01");
        
        const totalPublishedWorks = await db.collection("work").countDocuments({ status: "published" });
        
        const totalCreators = await db.collection("user").countDocuments({ role: "creator", status: "active" });
        
        const totalComments = await db.collection("comment").countDocuments({ status: "visible" });
        
        const topWriters = await db.collection("work").aggregate([
            { $match: { status: "published" } },
            { $group: { _id: "$authorId", workCount: { $sum: 1 } } },
            { $sort: { workCount: -1 } },
            { $limit: 5 }
        ]).toArray();
        
        const writerIds = topWriters.map(w => w._id).filter(id => id);
        const users = await db.collection("user").find({ 
            _id: { $in: writerIds.map(id => { try { return new ObjectId(id); } catch { return null; } }).filter(id => id) }
        }).toArray();
        
        const userMap = {};
        users.forEach(u => {
            userMap[u._id.toString()] = u;
        });
        
        const topWritersWithData = topWriters.map(w => ({
            authorId: w._id,
            workCount: w.workCount,
            author: userMap[w._id] ? {
                firstname: userMap[w._id].firstname,
                lastname: userMap[w._id].lastname,
                username: userMap[w._id].username
            } : null
        })).filter(w => w.author);
        
        const topArticles = await db.collection("comment").aggregate([
            { $match: { status: "visible" } },
            { $group: { _id: "$workId", commentCount: { $sum: 1 } } },
            { $sort: { commentCount: -1 } },
            { $limit: 5 }
        ]).toArray();
        
        const workIds = topArticles.map(a => a._id).filter(id => id);
        const works = await db.collection("work").find({ 
            _id: { $in: workIds.map(id => { try { return new ObjectId(id); } catch { return null; } }).filter(id => id) }
        }).toArray();
        
        const workMap = {};
        works.forEach(w => {
            workMap[w._id.toString()] = w;
        });
        
        const topArticlesWithData = topArticles.map(a => ({
            workId: a._id,
            commentCount: a.commentCount,
            work: workMap[a._id] ? {
                title: workMap[a._id].title,
                authorId: workMap[a._id].authorId
            } : null
        })).filter(a => a.work);
        
        const worksByCategory = await db.collection("work").aggregate([
            { $match: { status: "published" } },
            { $group: { _id: "$categoryId", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]).toArray();
        
        const categoryIds = worksByCategory.map(c => c._id).filter(id => id);
        const categories = await db.collection("category").find({ 
            _id: { $in: categoryIds.map(id => { try { return new ObjectId(id); } catch { return null; } }).filter(id => id) }
        }).toArray();
        
        const categoryMap = {};
        categories.forEach(c => {
            categoryMap[c._id.toString()] = c;
        });
        
        const worksByCategoryWithData = worksByCategory.map(c => ({
            categoryId: c._id,
            count: c.count,
            category: categoryMap[c._id] ? {
                name: categoryMap[c._id].name
            } : null
        })).filter(c => c.category);
        
        const recentWorks = await db.collection("work")
            .find({ status: "published" })
            .sort({ publishedAt: -1 })
            .limit(5)
            .project({ title: 1, authorId: 1, publishedAt: 1, tags: 1 })
            .toArray();
        
        return NextResponse.json({
            totalPublishedWorks,
            totalCreators,
            totalComments,
            topWriters: topWritersWithData,
            topArticles: topArticlesWithData,
            worksByCategory: worksByCategoryWithData,
            recentWorks
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
