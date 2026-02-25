import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcrypt";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/wad-01";
const DB_NAME = "wad-01";

const DEFAULT_PASSWORD = "password123";
const SALT_ROUNDS = 10;

async function seed() {
    let client;
    
    try {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        console.log("Connected to MongoDB");
        
        const db = client.db(DB_NAME);
        
        const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
        
        const users = [
            {
                _id: new ObjectId(),
                username: "admin",
                email: "admin@test.com",
                password: hashedPassword,
                firstname: "Admin",
                lastname: "User",
                bio: "System administrator with full access to all features.",
                role: "admin",
                status: "active",
                createdAt: new Date()
            },
            {
                _id: new ObjectId(),
                username: "editor1",
                email: "editor@test.com",
                password: hashedPassword,
                firstname: "John",
                lastname: "Editor",
                bio: "Content editor with review permissions.",
                role: "editor",
                status: "active",
                createdAt: new Date()
            },
            {
                _id: new ObjectId(),
                username: "creator1",
                email: "creator1@test.com",
                password: hashedPassword,
                firstname: "Jane",
                lastname: "Writer",
                bio: "Aspiring writer and content creator.",
                role: "creator",
                status: "active",
                createdAt: new Date()
            },
            {
                _id: new ObjectId(),
                username: "creator2",
                email: "creator2@test.com",
                password: hashedPassword,
                firstname: "Bob",
                lastname: "Author",
                bio: "Experienced author with multiple publications.",
                role: "creator",
                status: "active",
                createdAt: new Date()
            },
            {
                _id: new ObjectId(),
                username: "banned_user",
                email: "banned@test.com",
                password: hashedPassword,
                firstname: "Banned",
                lastname: "User",
                bio: "This account has been banned.",
                role: "creator",
                status: "banned",
                createdAt: new Date()
            },
            {
                _id: new ObjectId(),
                username: "suspended_user",
                email: "suspended@test.com",
                password: hashedPassword,
                firstname: "Suspended",
                lastname: "User",
                bio: "This account is temporarily suspended.",
                role: "creator",
                status: "suspended",
                createdAt: new Date()
            }
        ];
        
        await db.collection("user").insertMany(users);
        console.log(`Inserted ${users.length} users`);
        
        const categories = [
            {
                _id: new ObjectId(),
                name: "Fiction",
                description: "Creative writing that uses imagination and invention to tell stories.",
                createdAt: new Date()
            },
            {
                _id: new ObjectId(),
                name: "Non-Fiction",
                description: "Writing based on facts, real events, and real people.",
                createdAt: new Date()
            },
            {
                _id: new ObjectId(),
                name: "Poetry",
                description: "Literary work in which special intensity is given to the expression of feelings and ideas.",
                createdAt: new Date()
            },
            {
                _id: new ObjectId(),
                name: "Essay",
                description: "A short piece of writing on a particular subject.",
                createdAt: new Date()
            },
            {
                _id: new ObjectId(),
                name: "Tutorial",
                description: "Step-by-step guides and how-to articles.",
                createdAt: new Date()
            }
        ];
        
        await db.collection("category").insertMany(categories);
        console.log(`Inserted ${categories.length} categories`);
        
        const adminUser = users[0];
        const editorUser = users[1];
        const creator1 = users[2];
        const creator2 = users[3];
        
        const fictionCat = categories[0];
        const nonFictionCat = categories[1];
        const poetryCat = categories[2];
        const essayCat = categories[3];
        
        const works = [
            {
                _id: new ObjectId(),
                title: "The Journey Beyond",
                content: "Chapter 1: The Beginning\n\nIt was a dark and stormy night when Sarah first discovered the mysterious door in her grandmother's attic. The old wooden frame was covered in intricate carvings that seemed to glow faintly in the dim light filtering through the dusty window.\n\n'What could be behind this?' she wondered, her fingers tracing the ancient symbols. The door had no handle, no keyhole - just a small indentation in the shape of a crescent moon.\n\nLittle did she know that this discovery would change everything she thought she knew about reality itself. As midnight approached, the carvings began to pulse with an ethereal blue light, and the door slowly creaked open on its own...\n\n[Continue reading in the full publication]",
                authorId: creator1._id.toString(),
                categoryId: fictionCat._id.toString(),
                tags: ["fantasy", "adventure", "mystery"],
                status: "published",
                submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                approvedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
                publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new ObjectId(),
                title: "Understanding Modern Architecture",
                content: "Modern architecture represents a departure from traditional design principles, embracing simplicity, functionality, and the honest expression of materials. This essay explores the key movements that shaped 20th and 21st-century architecture.\n\n## The Bauhaus Movement\n\nFounded in 1919 by Walter Gropius, the Bauhaus school became synonymous with the 'less is more' philosophy. The movement emphasized the unity of art, craft, and technology, producing buildings that were both functional and aesthetically striking.\n\n## Brutalism\n\nEmerging in the 1950s, Brutalism is characterized by massive, monolithic forms and raw concrete surfaces. Despite its controversial reputation, the style represented architects' desire for honesty in construction and a rejection of bourgeois ornamentation.\n\n## Sustainable Design\n\nToday's architecture increasingly focuses on environmental responsibility. Green roofs, solar panels, and passive heating systems are becoming standard features in contemporary building design.",
                authorId: creator2._id.toString(),
                categoryId: nonFictionCat._id.toString(),
                tags: ["architecture", "design", "history"],
                status: "published",
                submittedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
                approvedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
                publishedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
                createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new ObjectId(),
                title: "Whispers of Dawn",
                content: "In the quiet hours before sunrise,\nWhere shadows dance with fading night,\nI hear the whispers of the dawn,\nSoft and gentle, pale and light.\n\nThe world awakens slowly now,\nAs colors paint the eastern sky,\nA symphony of bird and breeze,\nAs day and darkness say goodbye.\n\nIn this moment, pure and still,\nBefore the rush of day begins,\nI find a peace within my soul,\nWhere hope and possibility grins.\n\nSo let me hold this fleeting time,\nThis precious gift of morning's birth,\nBefore the sun claims full dominion\nOver all the sleeping earth.",
                authorId: creator1._id.toString(),
                categoryId: poetryCat._id.toString(),
                tags: ["poetry", "nature", "morning"],
                status: "published",
                submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                approvedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
                publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new ObjectId(),
                title: "The Art of Mindful Living",
                content: "In our fast-paced world, the practice of mindfulness offers a sanctuary of calm and clarity. This guide explores practical techniques for incorporating mindfulness into daily life.\n\n## What is Mindfulness?\n\nMindfulness is the practice of being fully present and engaged in the current moment, aware of our thoughts and feelings without judgment.\n\n## Daily Practices\n\n1. **Morning Meditation**: Start your day with 10 minutes of quiet reflection.\n2. **Mindful Eating**: Pay attention to the taste, texture, and aroma of your food.\n3. **Walking Meditation**: Focus on each step, the feeling of your feet touching the ground.\n4. **Digital Detox**: Set aside specific times to disconnect from devices.\n\n## Benefits\n\nReduced stress, improved focus, better emotional regulation, and enhanced relationships are just some of the documented benefits of regular mindfulness practice.",
                authorId: creator2._id.toString(),
                categoryId: essayCat._id.toString(),
                tags: ["mindfulness", "wellness", "self-improvement"],
                status: "submitted",
                submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                approvedAt: null,
                publishedAt: null,
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new ObjectId(),
                title: "A Forgotten Melody - Draft",
                content: "The old piano sat in the corner of the abandoned house, its keys yellowed with age. When Elena pressed the first note, a cloud of dust rose into the air, dancing in the shaft of light from the broken window.\n\nThe sound was unexpectedly clear, resonating through the empty rooms. She pressed another key, then another, until her fingers began to remember a melody she had never consciously learned.\n\n[Work in progress - more to come]",
                authorId: creator1._id.toString(),
                categoryId: fictionCat._id.toString(),
                tags: ["fiction", "mystery", "music"],
                status: "draft",
                submittedAt: null,
                approvedAt: null,
                publishedAt: null,
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new ObjectId(),
                title: "The Last Summer",
                content: "Summer 1985. That was the year everything changed for the small town of Millbrook. When the circus arrived, nobody expected the wonder and chaos it would bring.\n\nThe tent rose like a cathedral of dreams in the empty field behind the old mill. Children watched with wide eyes as performers unloaded impossible things - a carousel horse that seemed to breathe, a trunk that hummed with an otherworldly light, a cage covered in black velvet.\n\n'They say the ringmaster grants wishes,' whispered Tommy to his sister. She rolled her eyes, but clutched her lucky coin tighter.\n\n[This work was unfortunately rejected for publication. Thank you for your submission.]",
                authorId: creator2._id.toString(),
                categoryId: fictionCat._id.toString(),
                tags: ["fiction", "nostalgia", "coming-of-age"],
                status: "rejected",
                submittedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                approvedAt: null,
                publishedAt: null,
                createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new ObjectId(),
                title: "Approved but Unpublished",
                content: "This is a sample work that has been approved by an editor but hasn't been published yet. It demonstrates the workflow state between approval and publication.\n\nThe content here is ready for public viewing, just waiting for final publication steps.",
                authorId: creator1._id.toString(),
                categoryId: nonFictionCat._id.toString(),
                tags: ["sample", "workflow"],
                status: "approved",
                submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                approvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                publishedAt: null,
                createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            }
        ];
        
        await db.collection("work").insertMany(works);
        console.log(`Inserted ${works.length} works`);
        
        const publishedWork1 = works[0];
        const publishedWork2 = works[1];
        const publishedWork3 = works[2];
        const submittedWork = works[3];
        const draftWork = works[4];
        
        const comments = [
            {
                _id: new ObjectId(),
                workId: publishedWork1._id.toString(),
                userId: creator2._id.toString(),
                username: creator2.username,
                body: "This is absolutely captivating! I can't wait to read more. The way you've built the suspense is masterful.",
                status: "visible",
                createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new ObjectId(),
                workId: publishedWork1._id.toString(),
                userId: editorUser._id.toString(),
                username: editorUser.username,
                body: "Great start! The imagery is vivid and the pacing is perfect for a fantasy opening.",
                status: "visible",
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new ObjectId(),
                workId: publishedWork1._id.toString(),
                userId: adminUser._id.toString(),
                username: adminUser.username,
                body: "Wonderful work! This is exactly the kind of quality content we want on our platform.",
                status: "visible",
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new ObjectId(),
                workId: publishedWork2._id.toString(),
                userId: creator1._id.toString(),
                username: creator1.username,
                body: "Very informative! I learned a lot about brutalist architecture. The photos really help illustrate your points.",
                status: "visible",
                createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new ObjectId(),
                workId: publishedWork3._id.toString(),
                userId: creator2._id.toString(),
                username: creator2.username,
                body: "Beautiful poem! The imagery of dawn really resonates with me.",
                status: "visible",
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new ObjectId(),
                workId: publishedWork3._id.toString(),
                userId: adminUser._id.toString(),
                username: adminUser.username,
                body: "This comment contains inappropriate content and has been hidden.",
                status: "hidden",
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            }
        ];
        
        await db.collection("comment").insertMany(comments);
        console.log(`Inserted ${comments.length} comments`);
        
        const drafts = [
            {
                _id: new ObjectId(),
                title: "The Journey Beyond - Revision 2",
                content: "Chapter 1: The Beginning (Revised)\n\nIt was a dark and stormy night when Sarah first discovered the mysterious door in her grandmother's attic. The old wooden frame was covered in intricate carvings that seemed to glow faintly in the dim light filtering through the dusty window.\n\nShe reached out tentatively, her fingers brushing against the cold wood. The temperature in the attic seemed to drop, and she shivered despite her sweater.\n\n[Draft saved for potential revision]",
                authorId: creator1._id.toString(),
                workId: publishedWork1._id.toString(),
                pinned: false,
                createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new ObjectId(),
                title: "A Forgotten Melody - Early Draft",
                content: "The old piano sat in the corner of the abandoned house... [Early draft saved automatically]",
                authorId: creator1._id.toString(),
                workId: draftWork._id.toString(),
                pinned: true,
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
            }
        ];
        
        await db.collection("draft").insertMany(drafts);
        console.log(`Inserted ${drafts.length} drafts`);
        
        const reviews = [
            {
                _id: new ObjectId(),
                workId: publishedWork1._id.toString(),
                editorId: editorUser._id.toString(),
                decision: "approved",
                feedback: "Excellent fantasy piece with strong world-building. The prose is evocative and the pacing keeps the reader engaged. Approved for publication.",
                createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new ObjectId(),
                workId: publishedWork2._id.toString(),
                editorId: editorUser._id.toString(),
                decision: "approved",
                feedback: "Well-researched and informative article on architecture. The structure is logical and the content is engaging. Approved.",
                createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new ObjectId(),
                workId: publishedWork3._id.toString(),
                editorId: editorUser._id.toString(),
                decision: "approved",
                feedback: "Beautiful poem with excellent use of imagery. Perfect for our poetry collection.",
                createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new ObjectId(),
                workId: works[5]._id.toString(),
                editorId: editorUser._id.toString(),
                decision: "rejected",
                feedback: "While the writing shows promise, the narrative feels incomplete and needs more development. The story lacks a clear resolution. Please consider expanding and resubmitting.",
                createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
            },
            {
                _id: new ObjectId(),
                workId: works[6]._id.toString(),
                editorId: editorUser._id.toString(),
                decision: "approved",
                feedback: "Good work! This has been approved and is ready for publication.",
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            }
        ];
        
        await db.collection("review").insertMany(reviews);
        console.log(`Inserted ${reviews.length} reviews`);

        // Likes - spread across published works and users
        const likes = [
            // "The Journey Beyond" (publishedWork1, by creator1) — 4 likes
            { _id: new ObjectId(), userId: creator2._id.toString(), workId: publishedWork1._id.toString(), createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
            { _id: new ObjectId(), userId: editorUser._id.toString(), workId: publishedWork1._id.toString(), createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
            { _id: new ObjectId(), userId: adminUser._id.toString(), workId: publishedWork1._id.toString(), createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
            { _id: new ObjectId(), userId: users[4]._id.toString(), workId: publishedWork1._id.toString(), createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },

            // "Understanding Modern Architecture" (publishedWork2, by creator2) — 2 likes
            { _id: new ObjectId(), userId: creator1._id.toString(), workId: publishedWork2._id.toString(), createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
            { _id: new ObjectId(), userId: adminUser._id.toString(), workId: publishedWork2._id.toString(), createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000) },

            // "Whispers of Dawn" (publishedWork3, by creator1) — 3 likes
            { _id: new ObjectId(), userId: creator2._id.toString(), workId: publishedWork3._id.toString(), createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
            { _id: new ObjectId(), userId: editorUser._id.toString(), workId: publishedWork3._id.toString(), createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
            { _id: new ObjectId(), userId: adminUser._id.toString(), workId: publishedWork3._id.toString(), createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
        ];

        await db.collection("like").insertMany(likes);
        console.log(`Inserted ${likes.length} likes`);

        await db.collection("user").createIndex({ email: 1 }, { unique: true });
        await db.collection("user").createIndex({ username: 1 }, { unique: true });
        await db.collection("category").createIndex({ name: 1 }, { unique: true });
        await db.collection("work").createIndex({ authorId: 1 });
        await db.collection("work").createIndex({ status: 1 });
        await db.collection("comment").createIndex({ workId: 1 });
        await db.collection("draft").createIndex({ authorId: 1 });
        await db.collection("review").createIndex({ workId: 1 });
        await db.collection("like").createIndex({ userId: 1, workId: 1 }, { unique: true });
        await db.collection("like").createIndex({ workId: 1 });
        console.log("Created indexes");
        
        console.log("\n=== SEED COMPLETE ===");
        console.log("\nTest Accounts (password: password123):");
        console.log("  admin@test.com     - Admin user");
        console.log("  editor@test.com    - Editor user");
        console.log("  creator1@test.com  - Creator (has published works)");
        console.log("  creator2@test.com  - Creator (has published works)");
        console.log("  banned@test.com    - Banned user");
        console.log("  suspended@test.com - Suspended user");
        
    } catch (error) {
        console.error("Seed error:", error);
        process.exit(1);
    } finally {
        if (client) {
            await client.close();
            console.log("\nDisconnected from MongoDB");
        }
    }
}

seed();
