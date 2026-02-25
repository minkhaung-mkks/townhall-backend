import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = "townhall";

async function reset() {
    let client;
    
    try {
        console.log(MONGODB_URI)
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        console.log("Connected to MongoDB");
        
        const db = client.db(DB_NAME);
        
        const collections = ["user", "work", "category", "comment", "draft", "review"];
        
        for (const collectionName of collections) {
            try {
                const result = await db.collection(collectionName).deleteMany({});
                console.log(`Deleted ${result.deletedCount} documents from ${collectionName}`);
            } catch (err) {
                console.log(`Collection ${collectionName} does not exist or is empty`);
            }
        }
        
        console.log("\n=== RESET COMPLETE ===");
        console.log("All collections have been cleared.");
        
    } catch (error) {
        console.error("Reset error:", error);
        process.exit(1);
    } finally {
        if (client) {
            await client.close();
            console.log("\nDisconnected from MongoDB");
        }
    }
}

reset();
