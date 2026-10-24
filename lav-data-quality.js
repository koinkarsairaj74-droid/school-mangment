/* Browser-demo record integrity checks. No external connections or mutations. */
(function(){"use strict";
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function audit(){
 const d=window.LavAcademicData,classes=d?.classes?.()||[],marks=d?.marks?.()||[],exams=d?.exams?.()||[];
 const students=typeof records==="undefined"?[]:records.Students||[];
 const times=typeof records==="undefined"?[]:classes.length?window.LavAcademicData?.timetable?.()||[]:[];
 const att=typeof loadAttendanceSessions==="function"?loadAttendanceSessions():[];
 const fees=typeof loadFeeReceipts==="function"?loadFeeReceipts():[];
 const problems=[],warn=[];
 const issue=(type,message,severity="error")=>(severity==="warning"?warn:problems).push({type,message,severity});
 const classKey=c=>String(c.name||"").trim().toLowerCase()+"|"+String(c.section||"").trim().toLowerCase();
 const seen=new Set(),keys=new Set(classes.map(classKey));
 students.forEach(s=>{
  const ad=String(s.admissionNo||"").trim().toLowerCase();
  if(!ad)issue("Admissions","Missing admission number: "+(s.name||"Unnamed"));
  else if(seen.has(ad))issue("Admissions","Repeated admission number "+s.admissionNo);
  else seen.add(ad);
  if(!keys.has(String(s.grade||"").trim().toLowerCase()+"|"+String(s.section||"").trim().toLowerCase()))issue("Class assignment",(s.name||"Student")+" is assigned to an undefined class / section","warning");
 });
 const ids=new Set(students.map(s=>String(s.id)));
 const examIds=new Set(exams.map(e=>String(e.id)));
 const markTriples=new Set();
 marks.forEach(m=>{
  if(!ids.has(String(m.studentId)))issue("Exam marks","An exam mark references a missing student");
  if(!examIds.has(String(m.examId)))issue("Exam marks","A mark references a deleted exam");
  const score=Number(m.score),max=Number(m.max);
  if(!Number.isFinite(score)||!Number.isFinite(max)||max<=0||score<0||score>max)issue("Exam marks","Invalid score for "+String(m.subject||"subject"));
  const key=[m.studentId,m.examId,String(m.subject||"").toLowerCase()].join("|");
  if(markTriples.has(key))issue("Exam marks","Duplicate exam/subject mark entry");
  else markTriples.add(key);
 });
 fees.forEach(r=>{
  const id=String(r.studentId||"");
  if(id&&!ids.has(id))issue("Fee receipts","Receipt "+(r.receiptNo||"unknown")+" references a missing student");
  const paid=Number(r.amountPaid),balance=Number(r.remainingBalance),total=Number(r.totalFee),previous=Number(r.previousBalance||0);
  if([paid,balance,total,previous].some(x=>!Number.isFinite(x)||x<0))issue("Fee receipts","Invalid negative or nonnumeric amount on "+(r.receiptNo||"receipt"));
  else if(Math.abs(Math.max(0,total+previous-paid)-balance)>.05)issue("Fee receipts","Incorrect closing balance on "+(r.receiptNo||"receipt"));
 });
 att.forEach(s=>{
  if(!Array.isArray(s.students)){issue("Attendance","Attendance session missing its student roster","warning");return;}
  const present=s.students.filter(x=>x.status==="P").length,absent=s.students.filter(x=>x.status==="A").length;
  if(present!==Number(s.present)||absent!==Number(s.absent)||present+absent!==Number(s.total))issue("Attendance","Saved attendance totals do not match the roster for "+(s.date||"unknown date"));
 });
 const slots=d?.timetable?.()||[];
 for(let i=0;i<slots.length;i++)for(let j=i+1;j<slots.length;j++){
  const a=slots[i],b=slots[j];
  if(a.day===b.day&&a.grade===b.grade&&a.section===b.section&&a.start<b.end&&b.start<a.end)
   issue("Timetable","Overlapping periods in "+a.grade+" / "+a.section+" on "+a.day);
 }
 return {errors:problems,warnings:warn,counts:{students:students.length,sections:classes.length,marks:marks.length,receipts:fees.length,attendance:att.length,periods:slots.length}};
}
function panel(){
 const {errors,warnings,counts}=audit();
 const issues=errors.concat(warnings);
 return '<section class="glass panel lav-quality-panel"><div class="lav-quality-head"><div><span class="lav-eyebrow">RECORD INTEGRITY · BROWSER DEMO</span><h3>Data accuracy audit</h3><p>Checks saved records for duplicate admissions, missing links, invalid marks, payment calculations, attendance counts and overlapping class periods.</p></div><button type="button" class="btn secondary" id="lavAuditRun">↻ Recheck</button></div>'
 +'<div class="lav-quality-summary"><div><small>Data issues</small><strong>'+errors.length+'</strong></div><div><small>Warnings</small><strong>'+warnings.length+'</strong></div><div><small>Records checked</small><strong>'+Object.values(counts).reduce((a,b)=>a+b,0)+'</strong></div></div>'
 +'<div class="lav-quality-issues" id="lavAuditResults">'+(issues.length?issues.slice(0,50).map(x=>'<div class="lav-quality-item"><span class="'+(x.severity==="error"?"error":"warning")+'">'+(x.severity==="error"?"Issue":"Review")+'</span><div><b>'+esc(x.type)+'</b><p>'+esc(x.message)+'</p></div></div>').join(""):'<p class="lav-quality-ok">✓ No consistency issues detected by the current checks.</p>')+'</div><p class="lav-quality-foot">This checks selected data relationships only. A clean result is not proof of production accuracy, payment confirmation, authentication security or database reliability.</p></section>';
}
function bind(){const e=document.getElementById("lavAuditRun");if(e)e.onclick=()=>{
 const root=document.querySelector(".lav-quality-panel");if(root){const t=document.createElement("div");t.innerHTML=panel();root.replaceWith(t.firstElementChild);bind();}
};}
window.LavDataQuality={audit,panel,bind};
})();