import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log("Received Razorpay Webhook Event:", body.event);

    // Listen for payment.captured status
    if (body.event === "payment.captured") {
      const payment = body.payload.payment.entity;
      const paymentId = payment.id;
      const amount = payment.amount; // in paise
      const email = payment.email;
      const notes = payment.notes ?? {};

      console.log(`Payment Captured: ID=${paymentId}, Email=${email}, Amount=${amount}`);

      let resumeId = notes.resume_id;
      let versionSignature = notes.version_signature;
      let userId = notes.user_id;

      // Fallback 1: Query resumes by customer email to match context
      if (!userId && email) {
        const { data: resumes } = await supabase
          .from("resumes")
          .select("id, user_id, content, template, language")
          .order("updated_at", { ascending: false });
        
        const targetResume = resumes?.find(r => {
          const c = (r.content ?? {}) as any;
          return c.email?.toLowerCase() === email.toLowerCase();
        });

        if (targetResume) {
          resumeId = targetResume.id;
          userId = targetResume.user_id;
          if (!versionSignature) {
            versionSignature = getResumeSignature(targetResume.content, targetResume.template, targetResume.language);
          }
        }
      }

      // Fallback 2: Select most recently modified resume
      if (!userId) {
        const { data: lastResumes } = await supabase
          .from("resumes")
          .select("id, user_id, content, template, language")
          .order("updated_at", { ascending: false })
          .limit(1);
        if (lastResumes && lastResumes.length > 0) {
          resumeId = lastResumes[0].id;
          userId = lastResumes[0].user_id;
          versionSignature = getResumeSignature(lastResumes[0].content, lastResumes[0].template, lastResumes[0].language);
        }
      }

      if (userId && resumeId && versionSignature) {
        // 1. Log payment inside payments table
        const { error: payErr } = await supabase
          .from("payments")
          .insert({
            id: paymentId,
            user_id: userId,
            resume_id: resumeId,
            amount: Math.round(amount / 100),
            status: "captured",
            email: email,
            notes: notes,
          });
        
        if (payErr) console.error("Error inserting payment:", payErr);

        // 2. Lock version inside premium_unlocks table
        const { error: unlockErr } = await supabase
          .from("premium_unlocks")
          .insert({
            user_id: userId,
            resume_id: resumeId,
            version_signature: versionSignature,
            payment_id: paymentId,
          });

        if (unlockErr) console.error("Error inserting premium unlock:", unlockErr);

        // 3. Set verified premium tags directly into resume content
        const { data: currentResume } = await supabase
          .from("resumes")
          .select("content")
          .eq("id", resumeId)
          .single();

        if (currentResume) {
          const updatedContent = {
            ...(currentResume.content as any),
            premium_unlocked: true,
            premium_signature: versionSignature,
            payment_utr: paymentId,
            unlocked_at: new Date().toISOString(),
          };

          const { error: resumeUpdateErr } = await supabase
            .from("resumes")
            .update({ content: updatedContent })
            .eq("id", resumeId);

          if (resumeUpdateErr) console.error("Error updating resume:", resumeUpdateErr);
          else console.log(`Successfully unlocked resume ${resumeId} with signature ${versionSignature}`);
        }
      } else {
        console.error("Could not determine user_id or resume_id for payment:", paymentId);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("razorpay-webhook error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getResumeSignature(content: any, template: string, language: string): string {
  const cleanContent = { ...content };
  delete cleanContent.premium_unlocked;
  delete cleanContent.premium_signature;
  
  const expCount = Array.isArray(cleanContent.experience) ? cleanContent.experience.length : 0;
  const eduCount = Array.isArray(cleanContent.education) ? cleanContent.education.length : 0;
  const projCount = Array.isArray(cleanContent.projects) ? cleanContent.projects.length : 0;
  const skillsCount = Array.isArray(cleanContent.skills) ? cleanContent.skills.length : 0;
  
  let totalCharCount = 0;
  if (cleanContent.fullName) totalCharCount += cleanContent.fullName.length;
  if (cleanContent.headline) totalCharCount += cleanContent.headline.length;
  if (cleanContent.summary) totalCharCount += cleanContent.summary.length;
  if (Array.isArray(cleanContent.experience)) {
    cleanContent.experience.forEach((e: any) => {
      totalCharCount += (e.title?.length ?? 0) + (e.company?.length ?? 0);
      if (Array.isArray(e.bullets)) {
        e.bullets.forEach((b: string) => totalCharCount += b.length);
      }
    });
  }
  if (Array.isArray(cleanContent.education)) {
    cleanContent.education.forEach((ed: any) => {
      totalCharCount += (ed.degree?.length ?? 0) + (ed.school?.length ?? 0);
    });
  }
  if (Array.isArray(cleanContent.projects)) {
    cleanContent.projects.forEach((p: any) => {
      totalCharCount += (p.name?.length ?? 0) + (p.description?.length ?? 0);
    });
  }
  
  const roundedCharCount = Math.round(totalCharCount / 50) * 50;
  return `${template}_${language}_ex${expCount}_ed${eduCount}_pj${projCount}_sk${skillsCount}_len${roundedCharCount}`;
}
