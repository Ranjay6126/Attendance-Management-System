const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const resetDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/attendance_system');
        console.log('MongoDB Connected');

        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();

        for (const collection of collections) {
            await db.dropCollection(collection.name);
            console.log(`Dropped collection: ${collection.name}`);
        }

        console.log('All collections dropped successfully.');

        const uploadsDir = path.join(__dirname, 'uploads');
        if (fs.existsSync(uploadsDir)) {
            const files = fs.readdirSync(uploadsDir);
            for (const file of files) {
                const filePath = path.join(uploadsDir, file);
                fs.unlinkSync(filePath);
                console.log(`Deleted upload: ${file}`);
            }
        }

        console.log('All uploaded images deleted.');

        await mongoose.disconnect();
        console.log('Database reset complete. Now run: npm run setup');
        process.exit(0);
    } catch (error) {
        console.error('Error resetting database:', error.message);
        console.error(error);
        await mongoose.disconnect();
        process.exit(1);
    }
};

resetDatabase();
