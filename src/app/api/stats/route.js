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
        const totalLikes = await db.collection("like").countDocuments();

        // Top Writers: ranked by total likes across all their published works
        // 1. Join likes with works to get authorId per like
        const topWritersByLikes = await db.collection("like").aggregate([
            { $lookup: {
                from: "work",
                let: { wId: "$workId" },
                pipeline: [
                    { $match: { $expr: { $eq: [{ $toString: "$_id" }, "$$wId"] }, status: "published" } }
                ],
                as: "work"
            }},
            { $unwind: "$work" },
            { $group: { _id: "$work.authorId", likeCount: { $sum: 1 } } },
            { $sort: { likeCount: -1 } },
            { $limit: 5 }
        ]).toArray();

        const writerIds = topWritersByLikes.map(w => w._id).filter(id => id);
        const users = await db.collection("user").find({
            _id: { $in: writerIds.map(id => { try { return new ObjectId(id); } catch { return null; } }).filter(id => id) }
        }).toArray();

        const userMap = {};
        users.forEach(u => {
            userMap[u._id.toString()] = u;
        });

        // Also get work counts per writer
        const writerWorkCounts = await db.collection("work").aggregate([
            { $match: { status: "published", authorId: { $in: writerIds } } },
            { $group: { _id: "$authorId", workCount: { $sum: 1 } } }
        ]).toArray();
        const workCountMap = {};
        writerWorkCounts.forEach(w => { workCountMap[w._id] = w.workCount; });

        const topWritersWithData = topWritersByLikes.map(w => ({
            authorId: w._id,
            likeCount: w.likeCount,
            workCount: workCountMap[w._id] || 0,
            author: userMap[w._id] ? {
                firstname: userMap[w._id].firstname,
                lastname: userMap[w._id].lastname,
                username: userMap[w._id].username
            } : null
        })).filter(w => w.author);

        // Top Articles: ranked by likes
        const topArticles = await db.collection("like").aggregate([
            { $group: { _id: "$workId", likeCount: { $sum: 1 } } },
            { $sort: { likeCount: -1 } },
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
            likeCount: a.likeCount,
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

        // Populate author names for recent works
        const recentAuthorIds = [...new Set(recentWorks.map(w => w.authorId).filter(Boolean))];
        const recentAuthors = await db.collection("user").find({
            _id: { $in: recentAuthorIds.map(id => { try { return new ObjectId(id); } catch { return null; } }).filter(Boolean) }
        }).project({ firstname: 1, lastname: 1, username: 1 }).toArray();
        const recentAuthorMap = {};
        recentAuthors.forEach(a => { recentAuthorMap[a._id.toString()] = a; });
        const recentWorksWithAuthors = recentWorks.map(w => ({
            ...w,
            author: recentAuthorMap[w.authorId] ? {
                firstname: recentAuthorMap[w.authorId].firstname,
                lastname: recentAuthorMap[w.authorId].lastname,
                username: recentAuthorMap[w.authorId].username
            } : null
        }));

        return NextResponse.json({
            totalPublishedWorks,
            totalCreators,
            totalComments,
            totalLikes,
            topWriters: topWritersWithData,
            topArticles: topArticlesWithData,
            worksByCategory: worksByCategoryWithData,
            recentWorks: recentWorksWithAuthors
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
