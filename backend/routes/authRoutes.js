import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { database } from '../config/db.js';
const router=Router();
function session(user){return {token:jwt.sign({id:String(user._id),name:user.name},process.env.JWT_SECRET,{expiresIn:'7d'}),user:{id:String(user._id),name:user.name,email:user.email}}}
router.post('/register',async(req,res,next)=>{try{
 const name=String(req.body.name||'').trim(),email=String(req.body.email||'').trim().toLowerCase(),password=String(req.body.password||'');
 if(!name||name.length>80||!/^\S+@\S+\.\S+$/.test(email)||password.length<8)return res.status(400).json({error:'Enter a name, valid email and password of at least 8 characters'});
 const db=await database();const hash=await bcrypt.hash(password,12);
 const result=await db.collection('users').insertOne({name,email,password:hash,createdAt:new Date()});
 res.status(201).json(session({_id:result.insertedId,name,email}));
 }catch(e){if(e.code===11000)return res.status(409).json({error:'Email already registered'});next(e)}});
router.post('/login',async(req,res,next)=>{try{
 const email=String(req.body.email||'').trim().toLowerCase(),password=String(req.body.password||'');
 const user=await (await database()).collection('users').findOne({email});
 if(!user||!(await bcrypt.compare(password,user.password)))return res.status(401).json({error:'Invalid email or password'});
 res.json(session(user));
 }catch(e){next(e)}});
export default router;
