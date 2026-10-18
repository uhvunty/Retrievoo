import { Router } from 'express';
import multer from 'multer';
import { ObjectId } from 'mongodb';
import { Readable } from 'node:stream';
import { database, bucket } from '../config/db.js';
import { auth } from '../middleware/auth.js';
const router=Router();
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:3*1024*1024},fileFilter:(req,file,cb)=>cb(null,['image/jpeg','image/png','image/webp'].includes(file.mimetype))});
const valid=id=>ObjectId.isValid(id)&&String(new ObjectId(id))===id.toLowerCase();
function serialize(item){return {...item,_id:String(item._id),imageId:item.imageId?String(item.imageId):null};}
router.get('/',async(req,res,next)=>{try{
 const type=String(req.query.type||'all'),q=String(req.query.q||'').trim().slice(0,100);
 const filter={};if(['lost','found'].includes(type))filter.type=type;
 if(q){const escaped=q.replace(/[^a-zA-Z0-9 ]/g, c => '\\' + c);filter.$or=[{title:{$regex:escaped,$options:'i'}},{description:{$regex:escaped,$options:'i'}}]}
 const items=await (await database()).collection('items').find(filter).sort({createdAt:-1}).limit(100).toArray();res.json(items.map(serialize));
 }catch(e){next(e)}});
router.post('/',auth,upload.single('image'),async(req,res,next)=>{try{
 const {title,description,location,contact,type}=req.body;
 if(!['lost','found'].includes(type)||![title,description,location,contact].every(x=>typeof x==='string'&&x.trim())||title.length>100||description.length>2000||location.length>200||contact.length>200)return res.status(400).json({error:'Fill all fields within their length limits'});
 if(!req.file)return res.status(400).json({error:'Upload a JPG, PNG or WebP image (maximum 3 MB)'});
 const b=await bucket();const stream=b.openUploadStream(req.file.originalname,{contentType:req.file.mimetype});
 await new Promise((resolve,reject)=>{Readable.from(req.file.buffer).pipe(stream).on('finish',resolve).on('error',reject)});
 const item={title:title.trim(),description:description.trim(),location:location.trim(),contact:contact.trim(),type,imageId:stream.id,userId:new ObjectId(req.user.id),ownerName:req.user.name,status:'open',createdAt:new Date()};
 const result=await (await database()).collection('items').insertOne(item);res.status(201).json(serialize({...item,_id:result.insertedId}));
 }catch(e){next(e)}});
router.patch('/:id/complete',auth,async(req,res,next)=>{try{
 if(!valid(req.params.id))return res.status(400).json({error:'Invalid item ID'});
 const result=await (await database()).collection('items').updateOne({_id:new ObjectId(req.params.id),userId:new ObjectId(req.user.id),status:'open'},{$set:{status:'completed',completedAt:new Date()}});
 if(!result.modifiedCount)return res.status(404).json({error:'Item not found, already completed, or not yours'});
 res.json({message:'Transaction completed'});
 }catch(e){next(e)}});
router.get('/image/:id',async(req,res,next)=>{try{
 if(!valid(req.params.id))return res.status(400).end();
 const b=await bucket();const file=await (await database()).collection('images.files').findOne({_id:new ObjectId(req.params.id)});
 if(!file)return res.status(404).end();
 res.set('Content-Type',file.contentType||'application/octet-stream');res.set('Cache-Control','public, max-age=86400');b.openDownloadStream(file._id).on('error',next).pipe(res);
 }catch(e){next(e)}});
export default router;
