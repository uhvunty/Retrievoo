import { MongoClient, GridFSBucket } from 'mongodb';
let client, connection;
export async function database() {
  if (!connection) {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing');
    client = new MongoClient(process.env.MONGODB_URI);
    connection = client.connect().then(async () => {
      const db = client.db('lost_found');
      await Promise.all([db.collection('users').createIndex({email:1},{unique:true}),db.collection('items').createIndex({createdAt:-1})]);
      return db;
    }).catch(e=>{connection=null;throw e});
  }
  return connection;
}
export async function bucket() { return new GridFSBucket(await database(),{bucketName:'images'}); }
