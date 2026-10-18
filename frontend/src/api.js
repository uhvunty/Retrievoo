export const getSession=()=>{try{return JSON.parse(localStorage.getItem('session'))}catch{return null}};
export async function api(path,options={}){
 const token=getSession()?.token;
 const headers={...(options.body instanceof FormData?{}:{'Content-Type':'application/json'}),...(token?{Authorization:`Bearer ${token}`}:{})};
 const response=await fetch('/api'+path,{...options,headers:{...headers,...options.headers}});
 const data=await response.json().catch(()=>({error:'Unexpected server response'}));
 if(!response.ok)throw Error(data.error||'Request failed');return data;
}
