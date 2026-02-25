import { getClientPromise } from "@/lib/mongodb";
export async function ensureIndexes() {
    const client = await getClientPromise();
    const db = client.db("wad-01");
    
    // User indexes
    const userCollection = db.collection("user");
    await userCollection.createIndex({ username: 1 }, { unique: true });
    await userCollection.createIndex({ email: 1 }, { unique: true });
    
    // Work indexes
    const workCollection = db.collection("work");
    await workCollection.createIndex({ authorId: 1 });
    await workCollection.createIndex({ status: 1 });
    await workCollection.createIndex({ categoryId: 1 });
    
    // Draft indexes
    const draftCollection = db.collection("draft");
    await draftCollection.createIndex({ workId: 1 });
    await draftCollection.createIndex({ authorId: 1 });
    
    // Comment indexes
    const commentCollection = db.collection("comment");
    await commentCollection.createIndex({ workId: 1 });
    await commentCollection.createIndex({ userId: 1 });
    
    // Review indexes
    const reviewCollection = db.collection("review");
    await reviewCollection.createIndex({ workId: 1 });
    await reviewCollection.createIndex({ editorId: 1 });
    
    // Category indexes
    const categoryCollection = db.collection("category");
    await categoryCollection.createIndex({ name: 1 }, { unique: true });

    // Like indexes
    const likeCollection = db.collection("like");
    await likeCollection.createIndex({ userId: 1, workId: 1 }, { unique: true });
    await likeCollection.createIndex({ workId: 1 });
}