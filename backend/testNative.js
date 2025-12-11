const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI;

console.log('Testing with native MongoDB driver...');
console.log('URI:', uri);

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    console.log('Attempting to connect...');
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();
    console.log('✓ Connected successfully!');

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("✓ Pinged your deployment. You successfully connected to MongoDB!");

    // List databases
    const dbs = await client.db().admin().listDatabases();
    console.log('✓ Databases:', dbs.databases.map(db => db.name));

  } catch (error) {
    console.error('✗ Connection failed:', error.message);
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
    console.log('Connection closed.');
  }
}

run().catch(console.dir);
