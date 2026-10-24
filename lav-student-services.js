(function(){
"use strict";
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const $=id=>document.getElementById(id);
const find=id=>records.Students.find(s=>String(s.id)===String(id));
const data=()=>window.LavAcademicData;
const money=x=>Number(x||0).toLocaleString("en-IN",{style:"currency",currency:"INR"});
const HISTORY="lavsms-student-history-v1";
function history(){try{const a=JSON.parse(localStorage.getItem(HISTORY)||"[]");return Array.isArray(a)?a:[];}catch(e){return [];}}
function log(id,type,detail){try{const rows=history();rows.unshift({id:String(id),type,detail,date:new Date().toISOString()});localStorage.setItem(HISTORY,JSON.stringify(rows.slice(0,400)));}catch(e){console.warn(e);}}
function marks(s){return (data()?.marks()||[]).filter(m=>String(m.studentId)===String(s.id));}
function sessions(s){return loadAttendanceSessions().filter(a=>Array.isArray(a.students)&&a.students.some(x=>String(x.id)===String(s.id)));}
function stats(s){let p=0,a=0;sessions(s).forEach(x=>{const row=x.students.find(y=>String(y.id)===String(s.id));if(row?.status==="P")p++;if(row?.status==="A")a++;});return {present:p,absent:a,rate:p+a?Math.round(100*p/(p+a)):null};}
function receipts(s){return loadFeeReceipts().filter(x=>String(x.studentId||"")===String(s.id)||(!x.studentId&&x.admissionNo&&String(x.admissionNo)===String(s.admissionNo))).sort((x,y)=>String(y.createdAt||y.paymentDate||"").localeCompare(String(x.createdAt||x.paymentDate||"")));}
function balance(s){const a=receipts(s);return a.length?Math.max(0,Number(a[0].remainingBalance)||0):0;}
function canDelete(id){const s=find(id);if(!s)return {ok:false,message:"Student not found."};const x=[];if(marks(s).length)x.push("marks");if(sessions(s).length)x.push("attendance");if(receipts(s).length)x.push("fee receipts");if(typeof certSaved==="function"&&certSaved().some(c=>c.studentId===s.id))x.push("certificates");return x.length?{ok:false,message:"Linked "+x.join(", ")+" exist. Deletion is blocked to preserve related records. Change status to Inactive instead."}:{ok:true};}
function classes(grade,section){
 let all=data()?.classes()||[];
 let names=Array.from(new Set(all.map(x=>x.name))).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
 if(grade&&!names.includes(grade))names.push(grade);
 let secs=Array.from(new Set(all.filter(x=>x.name===grade).map(x=>x.section))).sort();
 if(section&&!secs.includes(section))secs.push(section);
 return {names,secs};
}
function bindAdmission(){const g=$("student-grade"),s=$("student-section");if(!g||!s)return;g.onchange=()=>{const sections=classes(g.value,"").secs;s.innerHTML=(sections.length?sections:["A"]).map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join("");};}
function close(){const n=$("lavProfile");if(n)n.remove();}
function info(k,v){return '<div class="lav-pr-info"><small>'+esc(k)+'</small><b>'+esc(v||"—")+'</b></div>';}
function profile(id){
 const s=find(id);if(!s){alert("Student not found.");return;}close();
 const attendance=stats(s),r=receipts(s),m=marks(s),paid=r.reduce((v,x)=>v+Number(x.amountPaid||0),0);
 const examNames=data()?.exams()||[];
 const markRows=m.map(x=>'<tr><td>'+esc(examNames.find(e=>e.id===x.examId)?.name||"Exam")+'</td><td>'+esc(x.subject)+'</td><td>'+esc(x.score)+' / '+esc(x.max)+'</td></tr>').join("");
 const feeRows=r.slice(0,6).map(x=>'<tr><td>'+esc(x.receiptNo)+'</td><td>'+esc(x.paymentDate)+'</td><td>'+money(x.amountPaid)+'</td><td>'+money(x.remainingBalance)+'</td></tr>').join("");
 const h=history().filter(x=>x.id===s.id);
 const html='<div class="lav-pr-overlay" id="lavProfile"><section class="glass lav-pr-panel" role="dialog" aria-modal="true" aria-label="Student profile"><div class="lav-pr-head"><b>STUDENT DOSSIER · DEMO</b><button type="button" data-pr="close">✕ Close</button></div><div class="lav-pr-body"><div class="lav-pr-hero"><span class="lav-pr-circle">'+esc(s.name.trim().split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase())+'</span><div><small>'+esc(s.admissionNo)+'</small><h2>'+esc(s.name)+'</h2><p>'+esc(s.grade)+' · '+esc(s.section)+' · '+esc(s.status)+'</p></div></div>'
  +'<div class="lav-pr-actions"><button type="button" class="btn" data-pr="id">Print ID card</button><button type="button" class="btn secondary" data-pr="move">Promote / Transfer</button><button type="button" class="btn secondary" data-pr="marks">Print marksheet</button><button type="button" class="btn secondary" data-pr="edit">Edit student</button></div>'
  +'<div class="lav-pr-kpis">'+[['Attendance',attendance.rate===null?"No sessions":attendance.rate+"%",attendance.present+" P / "+attendance.absent+" A"],["Payments recorded",money(paid),r.length+" receipts"],["Last receipt balance",money(balance(s)),r.length?"Saved local receipt":"No receipt recorded"]].map(x=>'<div><small>'+x[0]+'</small><b>'+x[1]+'</b><span>'+x[2]+'</span></div>').join("")+'</div>'
  +'<h3>Student information</h3><div class="lav-pr-grid">'+info("Admission number",s.admissionNo)+info("Class / division",s.grade+" / "+s.section)+info("Parent / guardian",s.parent)+info("Contact",s.phone)+info("Email",s.email)+info("Date of birth",s.dob)+info("Gender",s.gender)+info("Status",s.status)+'</div>'
  +'<h3>Academic marks</h3><div class="tablewrap"><table class="data"><thead><tr><th>Exam</th><th>Subject</th><th>Marks</th></tr></thead><tbody>'+(markRows||'<tr><td colspan="3">No marks recorded.</td></tr>')+'</tbody></table></div>'
  +'<h3>Recent fee receipts</h3><div class="tablewrap"><table class="data"><thead><tr><th>Receipt</th><th>Date</th><th>Paid</th><th>Balance</th></tr></thead><tbody>'+(feeRows||'<tr><td colspan="4">No receipts.</td></tr>')+'</tbody></table></div>'
  +'<h3>Class movement history</h3><div class="lav-pr-history">'+(h.map(x=>'<p><b>'+esc(x.type)+'</b> '+esc(x.detail)+' <small>'+esc(x.date.slice(0,10))+'</small></p>').join("")||'<p>No promotions recorded yet.</p>')+'</div><p class="lav-pr-note">DEMO · Figures are calculated from saved local student IDs. Latest outstanding amount is the last recorded receipt balance, not a verified school account.</p></div></section></div>';
 document.body.insertAdjacentHTML("beforeend",html);
 $("lavProfile").onclick=e=>{if(e.target.id==="lavProfile")close();};
 $("lavProfile").querySelectorAll("[data-pr]").forEach(btn=>btn.onclick=()=>{let a=btn.dataset.pr;if(a==="close")close();if(a==="edit"){close();openStudentForm(id);}if(a==="id")printId(s);if(a==="marks")data()?.printMarksFor(s.id);if(a==="move")move(id);});
}
function printId(s){
 const sc=data()?.school()||{name:"NXT GEN ENGLISH SCHOOL",address:"Dream City Nagar, Appawadi, Pune, Maharashtra",year:"2026-2027"};
 const h='<!doctype html><html><head><meta charset="utf-8"><title>Student ID · DEMO</title><style>@page{size:A4}body{font:14px Arial;background:#f3f5fa}.card{width:340px;border:2px solid #16375f;border-radius:14px;overflow:hidden;background:white;margin:50px auto}.head{text-align:center;background:#153963;color:white;padding:15px}.head h2{font-size:16px;margin:4px}.head p{font-size:10px}.details{padding:17px 24px}.details p{display:flex;justify-content:space-between}.avatar{width:76px;height:76px;margin:12px auto;background:#dfe8fc;color:#17365b;border-radius:18px;display:grid;place-items:center;font-size:25px}.name{text-align:center;font-size:20px;font-weight:800}.note{text-align:center;background:#fff2de;color:#8a5b13;padding:12px;font-size:10px}button{display:block;margin:20px auto;padding:10px 20px}@media print{body{background:#fff}button{display:none}}</style></head><body><div class="card"><div class="head"><h2>'+esc(sc.name)+'</h2><p>'+esc(sc.address)+'</p><p>'+esc(sc.year)+'</p></div><div class="avatar">'+esc(s.name.split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase())+'</div><div class="name">'+esc(s.name)+'</div><div class="details"><p><b>Admission</b>'+esc(s.admissionNo)+'</p><p><b>Class</b>'+esc(s.grade)+' / '+esc(s.section)+'</p><p><b>Guardian</b>'+esc(s.parent)+'</p><p><b>Phone</b>'+esc(s.phone||"Not provided")+'</p></div><div class="note">SAMPLE ID CARD · NOT VALID IDENTIFICATION</div></div><button onclick="window.print()">Print / PDF</button></body></html>';
 const w=window.open("","_blank","width=800,height=800");if(!w){alert("Allow pop-ups to print.");return;}w.document.write(h);w.document.close();
}
function move(id){
 const s=find(id);if(!s)return;
 const cs=classes(s.grade,s.section),div=document.createElement("div");div.id="lavMove";div.className="lav-pr-overlay";
 div.innerHTML='<form class="lav-pr-move glass" id="lavMoveForm"><h2>Student promotion / transfer</h2><p><b>'+esc(s.name)+'</b> · '+esc(s.admissionNo)+'</p><p>Current: '+esc(s.grade)+' / '+esc(s.section)+'</p><label>New class<select id="lavMoveGrade" required>'+cs.names.map(n=>'<option value="'+esc(n)+'" '+(n===s.grade?"selected":"")+'>'+esc(n)+'</option>').join("")+'</select></label><label>New division<select id="lavMoveSection" required></select></label><label>Reason<select id="lavMoveReason"><option>Promotion</option><option>Section transfer</option><option>Correction</option></select></label><div><button type="button" class="btn secondary" id="lavMoveCancel">Cancel</button><button type="submit" class="btn">Save class change</button></div><p class="lav-pr-note">Student ID stays the same. Historical marks and attendance are preserved.</p></form>';
 document.body.append(div);
 const g=$("lavMoveGrade"),sec=$("lavMoveSection");
 function update(){let opts=classes(g.value,g.value===s.grade?s.section:"").secs;sec.innerHTML=opts.map(x=>'<option value="'+esc(x)+'" '+(g.value===s.grade&&x===s.section?"selected":"")+'>'+esc(x)+'</option>').join("");}
 g.onchange=update;update();$("lavMoveCancel").onclick=()=>div.remove();div.onclick=e=>{if(e.target===div)div.remove();};
 $("lavMoveForm").onsubmit=e=>{
  e.preventDefault();const grade=g.value,section=sec.value;
  if(!(data()?.classes()||[]).some(c=>c.name===grade&&c.section===section&&c.status!=="Inactive")){alert("Choose an active class and section.");return;}
  if(grade===s.grade&&section===s.section){alert("Choose a new class or division.");return;}
  if(!confirm("Change "+s.name+" from "+s.grade+" / "+s.section+" to "+grade+" / "+section+"?"))return;
  const before=s.grade+" / "+s.section;s.grade=grade;s.section=section;s.detail=grade+" · "+section;
  if(!saveRecords())return;
  log(s.id,$("lavMoveReason").value,before+" → "+grade+" / "+section);
  div.remove();close();render();profile(id);
 };
}
function page(){
 const q=($("search")?.value||"").trim().toLowerCase(),arr=records.Students.filter(s=>!q||[s.name,s.admissionNo,s.grade,s.section,s.parent,s.phone,s.email,s.status].join(" ").toLowerCase().includes(q));
 const rows=arr.map(s=>{const a=stats(s),r=receipts(s);return '<tr><td><b>'+esc(s.name)+'</b><small class="lav-sub">'+esc(s.email||"Demo record")+'</small></td><td>'+esc(s.admissionNo)+'</td><td>'+esc(s.grade)+' / '+esc(s.section)+'</td><td>'+esc(s.parent)+'<small class="lav-sub">'+esc(s.phone||"Not provided")+'</small></td><td>'+(a.rate===null?"No sessions":a.rate+"%")+'</td><td>'+(r.length?money(balance(s)):"No receipts")+'</td><td>'+esc(s.status)+'</td><td><div class="lav-row-actions"><button data-pr-view="'+esc(s.id)+'">View</button><button data-student-edit="'+esc(s.id)+'">Edit</button><button class="lav-danger" data-student-delete="'+esc(s.id)+'">Delete</button></div></td></tr>';}).join("");
 return '<section class="glass lav-intro"><div><span class="lav-eyebrow">LAV SMS · ADMISSIONS</span><h2>Student management</h2><p>Profiles, attendance, fee receipts, marks and class movements.</p></div><div class="lav-actions"><button class="btn" data-add="Students">＋ Add student</button></div></section><div class="lav-kpis lav-compact"><section class="glass lav-kpi"><small>Registered students</small><b>'+records.Students.length+'</b></section><section class="glass lav-kpi"><small>Active</small><b>'+records.Students.filter(x=>x.status==="Active").length+'</b></section><section class="glass lav-kpi"><small>Search results</small><b>'+arr.length+'</b></section></div><section class="glass panel"><div class="tablewrap"><table class="data lav-table"><thead><tr><th>Student</th><th>Admission #</th><th>Class</th><th>Parent</th><th>Attendance</th><th>Last fee balance</th><th>Status</th><th>Actions</th></tr></thead><tbody>'+(rows||'<tr><td colspan="8" class="empty">No students match this search.</td></tr>')+'</tbody></table></div></section><p class="lav-pr-note">Demo uses local browser storage. Use fictional student records only.</p>';
}
function bind(){document.querySelectorAll("[data-pr-view]").forEach(b=>b.onclick=()=>profile(b.dataset.prView));}
window.LavStudentServices={page,bind,profile,canDelete,bindAdmission,classes,stats,receipts,balance,log,history};
})();