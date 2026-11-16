import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods":"POST, OPTIONS" };
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", {headers:cors});
  if (req.method !== "POST") return Response.json({error:"Method not allowed"},{status:405,headers:cors});
  const auth = req.headers.get("Authorization");
  if (!auth) return Response.json({error:"Sign in required"},{status:401,headers:cors});
  const url=Deno.env.get("SUPABASE_URL")!, anon=Deno.env.get("SUPABASE_ANON_KEY")!, service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const caller=createClient(url,anon,{global:{headers:{Authorization:auth}}});
  const admin=createClient(url,service);
  const {data:{user}}=await caller.auth.getUser();
  if(!user) return Response.json({error:"Invalid session"},{status:401,headers:cors});
  const {data:profile}=await admin.from("profiles").select("role,active").eq("id",user.id).single();
  if(!profile?.active || profile.role!=="admin") return Response.json({error:"Admin access required"},{status:403,headers:cors});
  let b:any; try{b=await req.json()}catch{return Response.json({error:"Invalid JSON"},{status:400,headers:cors})}
  const name=String(b.full_name||"").trim(), code=String(b.employee_code||"").trim(), email=String(b.email||"").trim(), dept=String(b.department||"").trim();
  if(!name||!code||!email) return Response.json({error:"Name, employee ID and email are required"},{status:400,headers:cors});
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({error:"Valid email required"},{status:400,headers:cors});
  const {data:created,error:createError}=await admin.auth.admin.inviteUserByEmail(email);
  if(createError||!created.user) return Response.json({error:createError?.message||"Invitation failed"},{status:400,headers:cors});
  const {error:profileError}=await admin.from("profiles").insert({id:created.user.id,employee_code:code,full_name:name,department:dept,role:"employee",active:true});
  if(profileError){await admin.auth.admin.deleteUser(created.user.id);return Response.json({error:profileError.message},{status:400,headers:cors})}
  await admin.from("audit_log").insert({actor_id:user.id,action:"employee_invited",target_table:"profiles",target_id:created.user.id,details:{employee_code:code}});
  return Response.json({ok:true,user_id:created.user.id});
});
